import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all exchanges (coordinator)
router.get('/', (req, res) => {
  const exchanges = db.prepare(`
    SELECT e.*,
      rf.name as requesting_family_name,
      pf.name as providing_family_name,
      cv.name as cookie_name
    FROM exchanges e
    JOIN families rf ON e.requesting_family_id = rf.id
    JOIN families pf ON e.providing_family_id = pf.id
    JOIN cookie_varieties cv ON e.cookie_variety_id = cv.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(exchanges);
});

// Get exchanges for a family (as requester or provider)
router.get('/family/:familyId', (req, res) => {
  const exchanges = db.prepare(`
    SELECT e.*,
      rf.name as requesting_family_name,
      pf.name as providing_family_name,
      cv.name as cookie_name
    FROM exchanges e
    JOIN families rf ON e.requesting_family_id = rf.id
    JOIN families pf ON e.providing_family_id = pf.id
    JOIN cookie_varieties cv ON e.cookie_variety_id = cv.id
    WHERE e.requesting_family_id = ? OR e.providing_family_id = ?
    ORDER BY e.created_at DESC
  `).all(req.params.familyId, req.params.familyId);
  res.json(exchanges);
});

// Create exchange request
router.post('/', (req, res) => {
  const { requesting_family_id, providing_family_id, cookie_variety_id, quantity } = req.body;

  // Check provider has enough inventory
  const inventory = db.prepare(
    'SELECT quantity FROM inventory WHERE family_id = ? AND cookie_variety_id = ?'
  ).get(providing_family_id, cookie_variety_id);

  if (!inventory || inventory.quantity < quantity) {
    return res.status(400).json({ error: 'Provider does not have enough inventory' });
  }

  const result = db.prepare(`
    INSERT INTO exchanges (requesting_family_id, providing_family_id, cookie_variety_id, quantity)
    VALUES (?, ?, ?, ?)
  `).run(requesting_family_id, providing_family_id, cookie_variety_id, quantity);

  res.status(201).json({ id: result.lastInsertRowid, status: 'requested' });
});

// Update exchange status (approve/decline/complete)
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const validStatuses = ['requested', 'approved', 'declined', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id);

  if (!exchange) {
    return res.status(404).json({ error: 'Exchange not found' });
  }

  // If approving, complete the transfer
  if (status === 'approved' || status === 'completed') {
    // Decrease provider inventory
    db.prepare(`
      UPDATE inventory SET quantity = quantity - ?
      WHERE family_id = ? AND cookie_variety_id = ?
    `).run(exchange.quantity, exchange.providing_family_id, exchange.cookie_variety_id);

    // Increase requester inventory
    const existing = db.prepare(
      'SELECT * FROM inventory WHERE family_id = ? AND cookie_variety_id = ?'
    ).get(exchange.requesting_family_id, exchange.cookie_variety_id);

    if (existing) {
      db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?')
        .run(exchange.quantity, existing.id);
    } else {
      db.prepare('INSERT INTO inventory (family_id, cookie_variety_id, quantity) VALUES (?, ?, ?)')
        .run(exchange.requesting_family_id, exchange.cookie_variety_id, exchange.quantity);
    }

    // Log transaction
    db.prepare(`
      INSERT INTO inventory_transactions (cookie_variety_id, quantity, from_family_id, to_family_id, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(exchange.cookie_variety_id, exchange.quantity, exchange.providing_family_id, exchange.requesting_family_id, 'exchange');

    // Mark as completed
    db.prepare('UPDATE exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('completed', id);
  } else {
    db.prepare('UPDATE exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, id);
  }

  res.json({ success: true });
});

export default router;
