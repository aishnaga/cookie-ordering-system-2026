import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all orders (coordinator)
router.get('/', (req, res) => {
  const status = req.query.status;
  let query = `
    SELECT o.*, f.name as family_name
    FROM orders o
    JOIN families f ON o.family_id = f.id
  `;
  if (status) {
    query += ` WHERE o.status = ?`;
  }
  query += ' ORDER BY o.created_at DESC';

  const orders = status
    ? db.prepare(query).all(status)
    : db.prepare(query).all();

  // Add line items and calculate amount for each order
  const ordersWithItems = orders.map(order => {
    const lineItems = db.prepare(`
      SELECT oli.quantity, oli.unit_price, cv.name as cookie_name
      FROM order_line_items oli
      JOIN cookie_varieties cv ON oli.cookie_variety_id = cv.id
      WHERE oli.order_id = ?
    `).all(order.id);

    const amount_owed = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return { ...order, line_items: lineItems, amount_owed };
  });

  res.json(ordersWithItems);
});

// Get orders for a family
router.get('/family/:familyId', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*
    FROM orders o
    WHERE o.family_id = ?
    ORDER BY o.created_at DESC
  `).all(req.params.familyId);

  const ordersWithAmount = orders.map(order => {
    const lineItems = db.prepare(`
      SELECT oli.quantity, oli.unit_price
      FROM order_line_items oli
      WHERE oli.order_id = ?
    `).all(order.id);

    const amount_owed = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return { ...order, amount_owed };
  });

  res.json(ordersWithAmount);
});

// Get single order with line items
router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, f.name as family_name
    FROM orders o
    JOIN families f ON o.family_id = f.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const lineItems = db.prepare(`
    SELECT oli.*, cv.name as cookie_name
    FROM order_line_items oli
    JOIN cookie_varieties cv ON oli.cookie_variety_id = cv.id
    WHERE oli.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, line_items: lineItems });
});

// Create order (parent)
router.post('/', (req, res) => {
  const { family_id, items } = req.body;

  if (!family_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Family and items are required' });
  }

  // Check inventory availability for each item
  const insufficientItems = [];
  for (const item of items) {
    const inventory = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as available
      FROM inventory
      WHERE family_id IS NULL AND cookie_variety_id = ? AND status = 'on_hand'
    `).get(item.cookie_variety_id);

    const cookie = db.prepare('SELECT name FROM cookie_varieties WHERE id = ?').get(item.cookie_variety_id);

    if (inventory.available < item.quantity) {
      insufficientItems.push({
        cookie: cookie?.name || `Cookie #${item.cookie_variety_id}`,
        requested: item.quantity,
        available: inventory.available
      });
    }
  }

  // Auto-decline if insufficient inventory
  if (insufficientItems.length > 0) {
    const details = insufficientItems.map(i =>
      `${i.cookie}: requested ${i.requested}, only ${i.available} available`
    ).join('; ');

    return res.status(400).json({
      error: 'Insufficient inventory',
      details: details,
      insufficientItems: insufficientItems
    });
  }

  const result = db.prepare(
    'INSERT INTO orders (family_id) VALUES (?)'
  ).run(family_id);

  const orderId = result.lastInsertRowid;

  for (const item of items) {
    const cookie = db.prepare('SELECT price_per_box FROM cookie_varieties WHERE id = ?').get(item.cookie_variety_id);
    db.prepare(
      'INSERT INTO order_line_items (order_id, cookie_variety_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    ).run(orderId, item.cookie_variety_id, item.quantity, cookie.price_per_box);
  }

  res.status(201).json({ id: orderId, status: 'pending' });
});

// Update order status (coordinator)
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const validStatuses = ['pending', 'approved', 'ready_for_pickup', 'picked_up', 'paid'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, id);

  // If picked up, move inventory from central to family
  if (status === 'picked_up') {
    const order = db.prepare('SELECT family_id FROM orders WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM order_line_items WHERE order_id = ?').all(id);

    for (const item of items) {
      // Decrease central inventory
      db.prepare(`
        UPDATE inventory SET quantity = quantity - ?
        WHERE family_id IS NULL AND cookie_variety_id = ? AND status = 'on_hand'
      `).run(item.quantity, item.cookie_variety_id);

      // Increase family inventory
      const existing = db.prepare(
        'SELECT * FROM inventory WHERE family_id = ? AND cookie_variety_id = ?'
      ).get(order.family_id, item.cookie_variety_id);

      if (existing) {
        db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?')
          .run(item.quantity, existing.id);
      } else {
        db.prepare('INSERT INTO inventory (family_id, cookie_variety_id, quantity) VALUES (?, ?, ?)')
          .run(order.family_id, item.cookie_variety_id, item.quantity);
      }

      // Log transaction
      db.prepare(
        'INSERT INTO inventory_transactions (cookie_variety_id, quantity, from_family_id, to_family_id, reason) VALUES (?, ?, NULL, ?, ?)'
      ).run(item.cookie_variety_id, item.quantity, order.family_id, 'order_fulfillment');
    }
  }

  res.json({ success: true });
});

// Record payment
router.post('/:id/payment', (req, res) => {
  const { amount, notes, paymentType } = req.body;
  const { id } = req.params;

  const validTypes = ['cash', 'check', 'credit_card'];
  if (!validTypes.includes(paymentType)) {
    return res.status(400).json({ error: 'Invalid payment type' });
  }

  const columnMap = {
    cash: 'cash_paid',
    check: 'check_paid',
    credit_card: 'credit_card_paid'
  };

  const column = columnMap[paymentType];

  db.prepare(`
    UPDATE orders
    SET ${column} = ${column} + ?,
        payment_notes = COALESCE(payment_notes || '; ', '') || ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(amount, notes || '', id);

  res.json({ success: true });
});

// Update order line items (coordinator)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  // Delete existing line items
  db.prepare('DELETE FROM order_line_items WHERE order_id = ?').run(id);

  // Insert new line items
  for (const item of items) {
    const cookie = db.prepare('SELECT price_per_box FROM cookie_varieties WHERE id = ?').get(item.cookie_variety_id);
    db.prepare(
      'INSERT INTO order_line_items (order_id, cookie_variety_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    ).run(id, item.cookie_variety_id, item.quantity, cookie.price_per_box);
  }

  db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

  res.json({ success: true });
});

// Delete order (coordinator)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Delete line items first
  db.prepare('DELETE FROM order_line_items WHERE order_id = ?').run(id);
  // Delete the order
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);

  res.json({ success: true });
});

export default router;
