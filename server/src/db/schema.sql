-- server/src/db/schema.sql
CREATE TABLE IF NOT EXISTS families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cookie_varieties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price_per_box REAL NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER,
  cookie_variety_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'on_hand',
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (cookie_variety_id) REFERENCES cookie_varieties(id),
  UNIQUE(family_id, cookie_variety_id, status)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  amount_paid REAL DEFAULT 0,
  payment_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE TABLE IF NOT EXISTS order_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  cookie_variety_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (cookie_variety_id) REFERENCES cookie_varieties(id)
);

CREATE TABLE IF NOT EXISTS exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requesting_family_id INTEGER NOT NULL,
  providing_family_id INTEGER NOT NULL,
  cookie_variety_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'requested',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requesting_family_id) REFERENCES families(id),
  FOREIGN KEY (providing_family_id) REFERENCES families(id),
  FOREIGN KEY (cookie_variety_id) REFERENCES cookie_varieties(id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cookie_variety_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  from_family_id INTEGER,
  to_family_id INTEGER,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cookie_variety_id) REFERENCES cookie_varieties(id)
);
