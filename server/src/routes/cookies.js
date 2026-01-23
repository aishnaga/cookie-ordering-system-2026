import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all active cookies
router.get('/', (req, res) => {
  const showAll = req.query.all === 'true';
  const query = showAll
    ? 'SELECT * FROM cookie_varieties ORDER BY name'
    : 'SELECT * FROM cookie_varieties WHERE active = 1 ORDER BY name';
  const cookies = db.prepare(query).all();
  res.json(cookies);
});

// Create cookie variety
router.post('/', (req, res) => {
  const { name, price_per_box } = req.body;
  if (!name || price_per_box === undefined) {
    return res.status(400).json({ error: 'Name and price_per_box are required' });
  }
  const result = db.prepare(
    'INSERT INTO cookie_varieties (name, price_per_box) VALUES (?, ?)'
  ).run(name, price_per_box);
  res.status(201).json({ id: result.lastInsertRowid, name, price_per_box, active: 1 });
});

// Update cookie variety
router.put('/:id', (req, res) => {
  const { name, price_per_box, active } = req.body;
  const { id } = req.params;
  db.prepare(
    'UPDATE cookie_varieties SET name = ?, price_per_box = ?, active = ? WHERE id = ?'
  ).run(name, price_per_box, active ? 1 : 0, id);
  res.json({ id: Number(id), name, price_per_box, active });
});

export default router;
