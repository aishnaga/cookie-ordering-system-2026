import db from './index.js';

const cookies = [
  { name: 'Exploremores', price: 6.00 },
  { name: 'Thin Mints', price: 6.00 },
  { name: 'Caramel Delites', price: 6.00 },
  { name: 'Peanut Butter Patties', price: 6.00 },
  { name: 'Adventurefuls', price: 6.00 },
  { name: 'Lemonades', price: 6.00 },
  { name: 'Trefoils', price: 6.00 },
  { name: 'Peanut Butter Sandwich', price: 6.00 },
  { name: 'Caramel Chocolate Chip', price: 7.00 },
];

for (const cookie of cookies) {
  // Check if cookie exists first
  const existing = db.prepare('SELECT id FROM cookie_varieties WHERE name = ?').get(cookie.name);
  if (existing) {
    // Update price if it changed, but keep the same ID
    db.prepare('UPDATE cookie_varieties SET price_per_box = ?, active = 1 WHERE id = ?').run(cookie.price, existing.id);
  } else {
    // Insert new cookie
    db.prepare('INSERT INTO cookie_varieties (name, price_per_box, active) VALUES (?, ?, 1)').run(cookie.name, cookie.price);
  }
}

// Fix orphaned line items - match old cookie IDs to new ones by finding the closest match
// This is a one-time migration for line items with invalid cookie_variety_id
try {
  const orphanedLineItems = db.prepare(`
    SELECT oli.id, oli.cookie_variety_id, oli.unit_price
    FROM order_line_items oli
    WHERE oli.cookie_variety_id NOT IN (SELECT id FROM cookie_varieties)
  `).all();

  if (orphanedLineItems.length > 0) {
    console.log(`Found ${orphanedLineItems.length} line items with invalid cookie IDs, attempting to fix...`);

    // Try to match by price
    for (const item of orphanedLineItems) {
      const matchingCookie = db.prepare('SELECT id FROM cookie_varieties WHERE price_per_box = ? LIMIT 1').get(item.unit_price);
      if (matchingCookie) {
        db.prepare('UPDATE order_line_items SET cookie_variety_id = ? WHERE id = ?').run(matchingCookie.id, item.id);
        console.log(`Fixed line item ${item.id} -> cookie ${matchingCookie.id}`);
      }
    }
  }
} catch (e) {
  console.log('Migration check failed:', e.message);
}

console.log('Database seeded with cookie varieties');
