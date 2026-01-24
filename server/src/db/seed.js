import db from './index.js';

const cookies = [
  { name: 'Exploremores', price: 6.00 },
  { name: 'Thin Mints', price: 6.00 },
  { name: 'Caramel Delites', price: 6.00 },
  { name: 'Peanut Butter Patties', price: 6.00 },
  { name: 'Adventurefuls', price: 6.00 },
  { name: 'Lemonads', price: 6.00 },
  { name: 'Trefoils', price: 6.00 },
  { name: 'Peanut Butter Sandwich', price: 6.00 },
  { name: 'Caramel Chocolate Chip', price: 7.00 },
];

const insertCookie = db.prepare(
  'INSERT OR REPLACE INTO cookie_varieties (name, price_per_box, active) VALUES (?, ?, 1)'
);

for (const cookie of cookies) {
  insertCookie.run(cookie.name, cookie.price);
}

console.log('Database seeded with cookie varieties');
