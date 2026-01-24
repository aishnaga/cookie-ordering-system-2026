import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get central inventory (family_id is NULL)
router.get('/central', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, cv.name as cookie_name, cv.price_per_box
    FROM inventory i
    JOIN cookie_varieties cv ON i.cookie_variety_id = cv.id
    WHERE i.family_id IS NULL
  `).all();
  res.json(inventory);
});

// Get family inventory
router.get('/family/:familyId', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, cv.name as cookie_name, cv.price_per_box
    FROM inventory i
    JOIN cookie_varieties cv ON i.cookie_variety_id = cv.id
    WHERE i.family_id = ?
  `).all(req.params.familyId);
  res.json(inventory);
});

// Get all families' inventory (for parent portal)
router.get('/all-families', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, cv.name as cookie_name, f.name as family_name
    FROM inventory i
    JOIN cookie_varieties cv ON i.cookie_variety_id = cv.id
    JOIN families f ON i.family_id = f.id
    WHERE i.quantity > 0
  `).all();
  res.json(inventory);
});

// Add to central inventory (coordinator receives from council)
router.post('/central', (req, res) => {
  const { cookie_variety_id, quantity, status = 'on_hand' } = req.body;

  // Upsert inventory
  const existing = db.prepare(
    'SELECT * FROM inventory WHERE family_id IS NULL AND cookie_variety_id = ? AND status = ?'
  ).get(cookie_variety_id, status);

  if (existing) {
    db.prepare(
      'UPDATE inventory SET quantity = quantity + ? WHERE id = ?'
    ).run(quantity, existing.id);
  } else {
    db.prepare(
      'INSERT INTO inventory (family_id, cookie_variety_id, quantity, status) VALUES (NULL, ?, ?, ?)'
    ).run(cookie_variety_id, quantity, status);
  }

  // Log transaction
  db.prepare(
    'INSERT INTO inventory_transactions (cookie_variety_id, quantity, to_family_id, reason) VALUES (?, ?, NULL, ?)'
  ).run(cookie_variety_id, quantity, 'council_delivery');

  res.status(201).json({ success: true });
});

// Update inventory status (ordered -> on_hand)
router.put('/central/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE inventory SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Adjust inventory (corrections)
router.post('/adjust', (req, res) => {
  const { family_id, cookie_variety_id, quantity, reason } = req.body;

  const existing = db.prepare(
    'SELECT * FROM inventory WHERE family_id IS ? AND cookie_variety_id = ?'
  ).get(family_id || null, cookie_variety_id);

  if (existing) {
    db.prepare(
      'UPDATE inventory SET quantity = ? WHERE id = ?'
    ).run(quantity, existing.id);
  } else {
    db.prepare(
      'INSERT INTO inventory (family_id, cookie_variety_id, quantity) VALUES (?, ?, ?)'
    ).run(family_id || null, cookie_variety_id, quantity);
  }

  db.prepare(
    'INSERT INTO inventory_transactions (cookie_variety_id, quantity, from_family_id, to_family_id, reason) VALUES (?, ?, ?, ?, ?)'
  ).run(cookie_variety_id, quantity, null, family_id, reason || 'adjustment');

  res.json({ success: true });
});

// Update family inventory (for parents to manually adjust their own inventory)
router.put('/family/:familyId', (req, res) => {
  const { familyId } = req.params;
  const { items } = req.body; // Array of { cookie_variety_id, quantity }

  for (const item of items) {
    const existing = db.prepare(
      'SELECT * FROM inventory WHERE family_id = ? AND cookie_variety_id = ?'
    ).get(familyId, item.cookie_variety_id);

    if (existing) {
      db.prepare(
        'UPDATE inventory SET quantity = ? WHERE id = ?'
      ).run(item.quantity, existing.id);
    } else if (item.quantity > 0) {
      db.prepare(
        'INSERT INTO inventory (family_id, cookie_variety_id, quantity) VALUES (?, ?, ?)'
      ).run(familyId, item.cookie_variety_id, item.quantity);
    }
  }

  res.json({ success: true });
});

export default router;
