import db from './index.js';

const cookies = [
  { name: 'Thin Mints', price: 6.00 },
  { name: 'Samoas', price: 6.00 },
  { name: 'Tagalongs', price: 6.00 },
  { name: 'Do-si-dos', price: 6.00 },
  { name: 'Trefoils', price: 6.00 },
  { name: 'Lemon-Ups', price: 6.00 },
  { name: "S'mores", price: 7.00 },
  { name: 'Adventurefuls', price: 7.00 },
];

const insertCookie = db.prepare(
  'INSERT OR IGNORE INTO cookie_varieties (name, price_per_box) VALUES (?, ?)'
);

for (const cookie of cookies) {
  insertCookie.run(cookie.name, cookie.price);
}

console.log('Database seeded with cookie varieties');
