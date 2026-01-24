import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all families
router.get('/', (req, res) => {
  const families = db.prepare('SELECT * FROM families ORDER BY name').all();
  res.json(families);
});

// Create family
router.post('/', (req, res) => {
  const { name, contact_info } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO families (name, contact_info) VALUES (?, ?)'
    ).run(name, contact_info || null);
    res.status(201).json({ id: result.lastInsertRowid, name, contact_info });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Family name already exists' });
    }
    throw err;
  }
});

// Update family
router.put('/:id', (req, res) => {
  const { name, contact_info } = req.body;
  const { id } = req.params;
  db.prepare(
    'UPDATE families SET name = ?, contact_info = ? WHERE id = ?'
  ).run(name, contact_info, id);
  res.json({ id: Number(id), name, contact_info });
});

// Delete family
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM families WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Get family balance
router.get('/:id/balance', (req, res) => {
  const { id } = req.params;

  const owed = db.prepare(`
    SELECT COALESCE(SUM(oli.quantity * oli.unit_price), 0) as total
    FROM orders o
    JOIN order_line_items oli ON o.id = oli.order_id
    WHERE o.family_id = ? AND o.status != 'pending'
  `).get(id);

  const cash = db.prepare(`
    SELECT COALESCE(SUM(cash_paid), 0) as total
    FROM orders
    WHERE family_id = ?
  `).get(id);

  const check = db.prepare(`
    SELECT COALESCE(SUM(check_paid), 0) as total
    FROM orders
    WHERE family_id = ?
  `).get(id);

  const creditCard = db.prepare(`
    SELECT COALESCE(SUM(credit_card_paid), 0) as total
    FROM orders
    WHERE family_id = ?
  `).get(id);

  const totalPaid = cash.total + check.total + creditCard.total;

  res.json({
    owed: owed.total,
    cash: cash.total,
    check: check.total,
    creditCard: creditCard.total,
    balance: owed.total - totalPaid
  });
});

export default router;
