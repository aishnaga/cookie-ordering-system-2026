# Cookie Ordering System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app for Girl Scouts Troop 40203 to manage cookie orders, inventory, and payments.

**Architecture:** React SPA frontend with Node.js/Express API backend. SQLite database for persistence. Coordinator routes password-protected, parent portal public with family dropdown.

**Tech Stack:** React 18, Vite, Express, better-sqlite3, Chakra UI

---

## Phase 1: Project Setup

### Task 1: Initialize Node.js Backend

**Files:**
- Create: `server/package.json`
- Create: `server/src/index.js`

**Step 1: Create server directory and package.json**

```bash
mkdir -p server/src
```

```json
// server/package.json
{
  "name": "cookie-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "node --test tests/**/*.test.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "express-session": "^1.18.0"
  }
}
```

**Step 2: Create minimal Express server**

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Install dependencies and test**

```bash
cd server && npm install && npm run dev
```

In another terminal: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok"}`

**Step 4: Commit**

```bash
git add server/
git commit -m "feat: initialize Express server"
```

---

### Task 2: Initialize React Frontend

**Files:**
- Create: `client/` (via Vite)

**Step 1: Create Vite React app**

```bash
npm create vite@latest client -- --template react
```

**Step 2: Install dependencies**

```bash
cd client && npm install && npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion axios
```

**Step 3: Test frontend runs**

```bash
npm run dev
```

Open http://localhost:5173 - should see Vite+React page.

**Step 4: Commit**

```bash
git add client/
git commit -m "feat: initialize React frontend with Chakra UI"
```

---

### Task 3: Set Up Database Schema

**Files:**
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/index.js`
- Create: `server/src/db/seed.js`

**Step 1: Create database directory**

```bash
mkdir -p server/src/db
```

**Step 2: Write schema**

```sql
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
```

**Step 3: Create database initialization module**

```javascript
// server/src/db/index.js
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/cookies.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(join(__dirname, '../../data'), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export default db;
```

**Step 4: Create seed script**

```javascript
// server/src/db/seed.js
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
```

**Step 5: Add seed script to package.json and run**

Add to server/package.json scripts:
```json
"seed": "node src/db/seed.js"
```

```bash
cd server && npm run seed
```

Expected: "Database seeded with cookie varieties"

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: add database schema and seed data"
```

---

## Phase 2: Backend API

### Task 4: Families API

**Files:**
- Create: `server/src/routes/families.js`
- Modify: `server/src/index.js`

**Step 1: Create families routes**

```javascript
// server/src/routes/families.js
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

  const paid = db.prepare(`
    SELECT COALESCE(SUM(amount_paid), 0) as total
    FROM orders
    WHERE family_id = ?
  `).get(id);

  res.json({
    owed: owed.total,
    paid: paid.total,
    balance: owed.total - paid.total
  });
});

export default router;
```

**Step 2: Add route to index.js**

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';
import familiesRouter from './routes/families.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/families', familiesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Test endpoint**

```bash
curl -X POST http://localhost:3001/api/families -H "Content-Type: application/json" -d '{"name":"Smith Family"}'
curl http://localhost:3001/api/families
```

**Step 4: Commit**

```bash
git add server/
git commit -m "feat: add families API endpoints"
```

---

### Task 5: Cookie Varieties API

**Files:**
- Create: `server/src/routes/cookies.js`
- Modify: `server/src/index.js`

**Step 1: Create cookie routes**

```javascript
// server/src/routes/cookies.js
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
```

**Step 2: Add to index.js**

Add import and route:
```javascript
import cookiesRouter from './routes/cookies.js';
// ...
app.use('/api/cookies', cookiesRouter);
```

**Step 3: Test and commit**

```bash
curl http://localhost:3001/api/cookies
git add server/
git commit -m "feat: add cookie varieties API endpoints"
```

---

### Task 6: Inventory API

**Files:**
- Create: `server/src/routes/inventory.js`
- Modify: `server/src/index.js`

**Step 1: Create inventory routes**

```javascript
// server/src/routes/inventory.js
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

export default router;
```

**Step 2: Add to index.js and commit**

```javascript
import inventoryRouter from './routes/inventory.js';
app.use('/api/inventory', inventoryRouter);
```

```bash
git add server/
git commit -m "feat: add inventory API endpoints"
```

---

### Task 7: Orders API

**Files:**
- Create: `server/src/routes/orders.js`
- Modify: `server/src/index.js`

**Step 1: Create orders routes**

```javascript
// server/src/routes/orders.js
import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all orders (coordinator)
router.get('/', (req, res) => {
  const status = req.query.status;
  let query = `
    SELECT o.*, f.name as family_name,
    (SELECT SUM(oli.quantity * oli.unit_price) FROM order_line_items oli WHERE oli.order_id = o.id) as amount_owed
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
  res.json(orders);
});

// Get orders for a family
router.get('/family/:familyId', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*,
    (SELECT SUM(oli.quantity * oli.unit_price) FROM order_line_items oli WHERE oli.order_id = o.id) as amount_owed
    FROM orders o
    WHERE o.family_id = ?
    ORDER BY o.created_at DESC
  `).all(req.params.familyId);
  res.json(orders);
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

  const result = db.prepare(
    'INSERT INTO orders (family_id) VALUES (?)'
  ).run(family_id);

  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_line_items (order_id, cookie_variety_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
  );

  for (const item of items) {
    const cookie = db.prepare('SELECT price_per_box FROM cookie_varieties WHERE id = ?').get(item.cookie_variety_id);
    insertItem.run(orderId, item.cookie_variety_id, item.quantity, cookie.price_per_box);
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
  const { amount, notes } = req.body;
  const { id } = req.params;

  db.prepare(`
    UPDATE orders
    SET amount_paid = amount_paid + ?,
        payment_notes = COALESCE(payment_notes || '; ', '') || ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(amount, notes || '', id);

  res.json({ success: true });
});

export default router;
```

**Step 2: Add to index.js and commit**

```javascript
import ordersRouter from './routes/orders.js';
app.use('/api/orders', ordersRouter);
```

```bash
git add server/
git commit -m "feat: add orders API endpoints"
```

---

### Task 8: Exchanges API

**Files:**
- Create: `server/src/routes/exchanges.js`
- Modify: `server/src/index.js`

**Step 1: Create exchanges routes**

```javascript
// server/src/routes/exchanges.js
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
```

**Step 2: Add to index.js and commit**

```javascript
import exchangesRouter from './routes/exchanges.js';
app.use('/api/exchanges', exchangesRouter);
```

```bash
git add server/
git commit -m "feat: add exchanges API endpoints"
```

---

### Task 9: Admin Authentication Middleware

**Files:**
- Create: `server/src/middleware/auth.js`
- Modify: `server/src/index.js`

**Step 1: Create auth middleware**

```javascript
// server/src/middleware/auth.js
import session from 'express-session';

const ADMIN_PASSWORD = 'spicewoodgstroop40203!';

export const sessionMiddleware = session({
  secret: 'cookie-troop-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

export const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export const loginAdmin = (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

export const logoutAdmin = (req, res) => {
  req.session.destroy();
  res.json({ success: true });
};

export const checkAdmin = (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
};
```

**Step 2: Update index.js with auth**

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';
import { sessionMiddleware, requireAdmin, loginAdmin, logoutAdmin, checkAdmin } from './middleware/auth.js';
import familiesRouter from './routes/families.js';
import cookiesRouter from './routes/cookies.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';
import exchangesRouter from './routes/exchanges.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(sessionMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/admin/login', loginAdmin);
app.post('/api/admin/logout', logoutAdmin);
app.get('/api/admin/check', checkAdmin);

// Public routes (parent portal)
app.use('/api/families', familiesRouter);
app.use('/api/cookies', cookiesRouter);
app.get('/api/inventory/central', (req, res, next) => {
  require('./routes/inventory.js').then(m => m.default.handle(req, res, next));
});
app.get('/api/inventory/all-families', (req, res, next) => {
  require('./routes/inventory.js').then(m => m.default.handle(req, res, next));
});

// All routes - some endpoints need admin check in the route handlers
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/exchanges', exchangesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Commit**

```bash
git add server/
git commit -m "feat: add admin authentication middleware"
```

---

## Phase 3: Frontend

### Task 10: Set Up Chakra UI and Routing

**Files:**
- Modify: `client/src/main.jsx`
- Modify: `client/src/App.jsx`
- Create: `client/src/api.js`

**Step 1: Update main.jsx with Chakra provider**

```jsx
// client/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
```

**Step 2: Install react-router-dom**

```bash
cd client && npm install react-router-dom
```

**Step 3: Create API helper**

```javascript
// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});

export default api;
```

**Step 4: Commit**

```bash
git add client/
git commit -m "feat: set up Chakra UI and routing"
```

---

### Task 11: Parent Portal - Family Selector

**Files:**
- Create: `client/src/components/FamilySelector.jsx`
- Create: `client/src/context/FamilyContext.jsx`

**Step 1: Create family context**

```jsx
// client/src/context/FamilyContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const FamilyContext = createContext();

export function FamilyProvider({ children }) {
  const [selectedFamily, setSelectedFamily] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedFamily');
    if (saved) {
      setSelectedFamily(JSON.parse(saved));
    }
  }, []);

  const selectFamily = (family) => {
    setSelectedFamily(family);
    localStorage.setItem('selectedFamily', JSON.stringify(family));
  };

  const clearFamily = () => {
    setSelectedFamily(null);
    localStorage.removeItem('selectedFamily');
  };

  return (
    <FamilyContext.Provider value={{ selectedFamily, selectFamily, clearFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
```

**Step 2: Create family selector component**

```jsx
// client/src/components/FamilySelector.jsx
import { useState, useEffect } from 'react';
import {
  Box, Select, Button, VStack, Heading, Text
} from '@chakra-ui/react';
import { useFamily } from '../context/FamilyContext';
import api from '../api';

export default function FamilySelector() {
  const [families, setFamilies] = useState([]);
  const [selected, setSelected] = useState('');
  const { selectFamily } = useFamily();

  useEffect(() => {
    api.get('/families').then(res => setFamilies(res.data));
  }, []);

  const handleContinue = () => {
    const family = families.find(f => f.id === Number(selected));
    if (family) {
      selectFamily(family);
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4}>
        <Heading size="lg">Welcome!</Heading>
        <Text>Select your family to continue</Text>
        <Select
          placeholder="Select your family"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {families.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <Button
          colorScheme="green"
          width="100%"
          onClick={handleContinue}
          isDisabled={!selected}
        >
          Continue
        </Button>
      </VStack>
    </Box>
  );
}
```

**Step 3: Commit**

```bash
git add client/
git commit -m "feat: add family selector component"
```

---

### Task 12: Parent Portal - Order Form

**Files:**
- Create: `client/src/pages/parent/OrderPage.jsx`

**Step 1: Create order page**

```jsx
// client/src/pages/parent/OrderPage.jsx
import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, HStack, Text, NumberInput,
  NumberInputField, Button, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Alert, AlertIcon
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function OrderPage() {
  const { selectedFamily } = useFamily();
  const [cookies, setCookies] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/cookies').then(res => {
      setCookies(res.data);
      const initial = {};
      res.data.forEach(c => { initial[c.id] = 0; });
      setQuantities(initial);
    });
  }, []);

  const total = cookies.reduce((sum, c) => {
    return sum + (quantities[c.id] || 0) * c.price_per_box;
  }, 0);

  const hasItems = Object.values(quantities).some(q => q > 0);

  const handleSubmit = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([cookie_variety_id, quantity]) => ({
        cookie_variety_id: Number(cookie_variety_id),
        quantity
      }));

    setSubmitting(true);
    try {
      await api.post('/orders', {
        family_id: selectedFamily.id,
        items
      });
      toast({
        title: 'Order submitted!',
        description: 'Waiting for coordinator approval.',
        status: 'success',
        duration: 5000,
      });
      // Reset form
      const reset = {};
      cookies.forEach(c => { reset[c.id] = 0; });
      setQuantities(reset);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to submit order',
        status: 'error',
        duration: 5000,
      });
    }
    setSubmitting(false);
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Place Order</Heading>
        <Text>Ordering as: <strong>{selectedFamily.name}</strong></Text>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Cookie</Th>
              <Th isNumeric>Price</Th>
              <Th isNumeric>Quantity</Th>
              <Th isNumeric>Subtotal</Th>
            </Tr>
          </Thead>
          <Tbody>
            {cookies.map(cookie => (
              <Tr key={cookie.id}>
                <Td>{cookie.name}</Td>
                <Td isNumeric>${cookie.price_per_box.toFixed(2)}</Td>
                <Td isNumeric>
                  <NumberInput
                    size="sm"
                    maxW={20}
                    min={0}
                    value={quantities[cookie.id]}
                    onChange={(_, val) => setQuantities({
                      ...quantities,
                      [cookie.id]: val || 0
                    })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Td>
                <Td isNumeric>
                  ${((quantities[cookie.id] || 0) * cookie.price_per_box).toFixed(2)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Total: ${total.toFixed(2)}
          </Text>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isDisabled={!hasItems || submitting}
            isLoading={submitting}
          >
            Submit Order
          </Button>
        </HStack>

        <Alert status="info">
          <AlertIcon />
          Your order will be reviewed by the coordinator before pickup.
        </Alert>
      </VStack>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add parent order page"
```

---

### Task 13: Parent Portal - Inventory View

**Files:**
- Create: `client/src/pages/parent/InventoryPage.jsx`

**Step 1: Create inventory page**

```jsx
// client/src/pages/parent/InventoryPage.jsx
import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td,
  Tabs, TabList, TabPanels, Tab, TabPanel, Badge
} from '@chakra-ui/react';
import api from '../../api';

export default function InventoryPage() {
  const [central, setCentral] = useState([]);
  const [familyInventory, setFamilyInventory] = useState([]);

  useEffect(() => {
    api.get('/inventory/central').then(res => setCentral(res.data));
    api.get('/inventory/all-families').then(res => setFamilyInventory(res.data));
  }, []);

  // Group family inventory by family
  const byFamily = familyInventory.reduce((acc, item) => {
    if (!acc[item.family_name]) acc[item.family_name] = [];
    acc[item.family_name].push(item);
    return acc;
  }, {});

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Cookie Inventory</Heading>

        <Tabs>
          <TabList>
            <Tab>Troop Supply</Tab>
            <Tab>Family Inventory</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Cookie</Th>
                    <Th isNumeric>Available</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {central.map(item => (
                    <Tr key={item.id}>
                      <Td>{item.cookie_name}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td>
                        <Badge colorScheme={item.status === 'on_hand' ? 'green' : 'yellow'}>
                          {item.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            <TabPanel>
              {Object.entries(byFamily).map(([familyName, items]) => (
                <Box key={familyName} mb={6}>
                  <Heading size="sm" mb={2}>{familyName}</Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Cookie</Th>
                        <Th isNumeric>Quantity</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map(item => (
                        <Tr key={item.id}>
                          <Td>{item.cookie_name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ))}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add parent inventory page"
```

---

### Task 14: Parent Portal - Exchange Request

**Files:**
- Create: `client/src/pages/parent/ExchangePage.jsx`

**Step 1: Create exchange page**

```jsx
// client/src/pages/parent/ExchangePage.jsx
import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td,
  Button, NumberInput, NumberInputField, useToast, Badge,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure, Text
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function ExchangePage() {
  const { selectedFamily } = useFamily();
  const [familyInventory, setFamilyInventory] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadData = () => {
    api.get('/inventory/all-families').then(res => setFamilyInventory(res.data));
    api.get(`/exchanges/family/${selectedFamily.id}`).then(res => setMyExchanges(res.data));
  };

  useEffect(() => {
    loadData();
  }, [selectedFamily.id]);

  const otherFamilies = familyInventory.filter(
    item => item.family_id !== selectedFamily.id
  );

  const handleRequest = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    onOpen();
  };

  const submitRequest = async () => {
    try {
      await api.post('/exchanges', {
        requesting_family_id: selectedFamily.id,
        providing_family_id: selectedItem.family_id,
        cookie_variety_id: selectedItem.cookie_variety_id,
        quantity
      });
      toast({
        title: 'Request sent!',
        status: 'success',
        duration: 3000,
      });
      onClose();
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to send request',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleApprove = async (exchangeId) => {
    try {
      await api.put(`/exchanges/${exchangeId}/status`, { status: 'approved' });
      toast({ title: 'Exchange approved!', status: 'success', duration: 3000 });
      loadData();
    } catch (err) {
      toast({ title: 'Error', status: 'error', duration: 3000 });
    }
  };

  const handleDecline = async (exchangeId) => {
    try {
      await api.put(`/exchanges/${exchangeId}/status`, { status: 'declined' });
      toast({ title: 'Exchange declined', status: 'info', duration: 3000 });
      loadData();
    } catch (err) {
      toast({ title: 'Error', status: 'error', duration: 3000 });
    }
  };

  const pendingRequests = myExchanges.filter(
    e => e.status === 'requested' && e.providing_family_id === selectedFamily.id
  );

  const myRequests = myExchanges.filter(
    e => e.requesting_family_id === selectedFamily.id
  );

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Cookie Exchanges</Heading>

        {pendingRequests.length > 0 && (
          <Box borderWidth={1} borderRadius="lg" p={4} bg="yellow.50">
            <Heading size="sm" mb={3}>Pending Requests for Your Cookies</Heading>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>From</Th>
                  <Th>Cookie</Th>
                  <Th isNumeric>Qty</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingRequests.map(ex => (
                  <Tr key={ex.id}>
                    <Td>{ex.requesting_family_name}</Td>
                    <Td>{ex.cookie_name}</Td>
                    <Td isNumeric>{ex.quantity}</Td>
                    <Td>
                      <HStack>
                        <Button size="xs" colorScheme="green" onClick={() => handleApprove(ex.id)}>
                          Approve
                        </Button>
                        <Button size="xs" colorScheme="red" onClick={() => handleDecline(ex.id)}>
                          Decline
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box>
          <Heading size="md" mb={3}>Request Cookies from Other Families</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Family</Th>
                <Th>Cookie</Th>
                <Th isNumeric>Available</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {otherFamilies.map(item => (
                <Tr key={`${item.family_id}-${item.cookie_variety_id}`}>
                  <Td>{item.family_name}</Td>
                  <Td>{item.cookie_name}</Td>
                  <Td isNumeric>{item.quantity}</Td>
                  <Td>
                    <Button size="sm" onClick={() => handleRequest(item)}>
                      Request
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box>
          <Heading size="md" mb={3}>My Exchange Requests</Heading>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>To/From</Th>
                <Th>Cookie</Th>
                <Th isNumeric>Qty</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {myRequests.map(ex => (
                <Tr key={ex.id}>
                  <Td>{ex.providing_family_name}</Td>
                  <Td>{ex.cookie_name}</Td>
                  <Td isNumeric>{ex.quantity}</Td>
                  <Td>
                    <Badge colorScheme={
                      ex.status === 'completed' ? 'green' :
                      ex.status === 'declined' ? 'red' : 'yellow'
                    }>
                      {ex.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Cookies</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedItem && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Request <strong>{selectedItem.cookie_name}</strong> from{' '}
                  <strong>{selectedItem.family_name}</strong>
                </Text>
                <Text>Available: {selectedItem.quantity}</Text>
                <NumberInput
                  min={1}
                  max={selectedItem.quantity}
                  value={quantity}
                  onChange={(_, val) => setQuantity(val)}
                >
                  <NumberInputField />
                </NumberInput>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="green" onClick={submitRequest}>
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add parent exchange page"
```

---

### Task 15: Parent Portal - My Status Page

**Files:**
- Create: `client/src/pages/parent/MyStatusPage.jsx`

**Step 1: Create status page**

```jsx
// client/src/pages/parent/MyStatusPage.jsx
import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function MyStatusPage() {
  const { selectedFamily } = useFamily();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [balance, setBalance] = useState({ owed: 0, paid: 0, balance: 0 });

  useEffect(() => {
    api.get(`/orders/family/${selectedFamily.id}`).then(res => setOrders(res.data));
    api.get(`/inventory/family/${selectedFamily.id}`).then(res => setInventory(res.data));
    api.get(`/families/${selectedFamily.id}/balance`).then(res => setBalance(res.data));
  }, [selectedFamily.id]);

  const statusColors = {
    pending: 'yellow',
    approved: 'blue',
    ready_for_pickup: 'purple',
    picked_up: 'teal',
    paid: 'green'
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>My Status - {selectedFamily.name}</Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Stat borderWidth={1} borderRadius="lg" p={4}>
            <StatLabel>Amount Owed</StatLabel>
            <StatNumber>${balance.owed.toFixed(2)}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4}>
            <StatLabel>Amount Paid</StatLabel>
            <StatNumber>${balance.paid.toFixed(2)}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg={balance.balance > 0 ? 'red.50' : 'green.50'}>
            <StatLabel>Balance</StatLabel>
            <StatNumber color={balance.balance > 0 ? 'red.500' : 'green.500'}>
              ${Math.abs(balance.balance).toFixed(2)}
            </StatNumber>
            <StatHelpText>
              {balance.balance > 0 ? 'Due' : balance.balance < 0 ? 'Credit' : 'Paid in full'}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box>
          <Heading size="md" mb={3}>My Inventory</Heading>
          {inventory.length === 0 ? (
            <Box p={4} bg="gray.50" borderRadius="md">No cookies in inventory</Box>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Cookie</Th>
                  <Th isNumeric>Quantity</Th>
                </Tr>
              </Thead>
              <Tbody>
                {inventory.map(item => (
                  <Tr key={item.id}>
                    <Td>{item.cookie_name}</Td>
                    <Td isNumeric>{item.quantity}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        <Box>
          <Heading size="md" mb={3}>My Orders</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Order #</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Paid</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.map(order => (
                <Tr key={order.id}>
                  <Td>{order.id}</Td>
                  <Td>{new Date(order.created_at).toLocaleDateString()}</Td>
                  <Td isNumeric>${(order.amount_owed || 0).toFixed(2)}</Td>
                  <Td isNumeric>${order.amount_paid.toFixed(2)}</Td>
                  <Td>
                    <Badge colorScheme={statusColors[order.status]}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add parent status page"
```

---

### Task 16: Parent Portal - Layout and Navigation

**Files:**
- Create: `client/src/layouts/ParentLayout.jsx`
- Modify: `client/src/App.jsx`

**Step 1: Create parent layout**

```jsx
// client/src/layouts/ParentLayout.jsx
import {
  Box, Flex, HStack, Button, Heading, Spacer
} from '@chakra-ui/react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';

export default function ParentLayout() {
  const { selectedFamily, clearFamily } = useFamily();
  const navigate = useNavigate();

  const handleChangeFamily = () => {
    clearFamily();
    navigate('/');
  };

  return (
    <Box minH="100vh">
      <Flex bg="green.500" color="white" px={6} py={4} align="center">
        <Heading size="md">Troop 40203 Cookies</Heading>
        <Spacer />
        <HStack spacing={4}>
          <Button as={Link} to="/order" variant="ghost" colorScheme="whiteAlpha">
            Order
          </Button>
          <Button as={Link} to="/inventory" variant="ghost" colorScheme="whiteAlpha">
            Inventory
          </Button>
          <Button as={Link} to="/exchange" variant="ghost" colorScheme="whiteAlpha">
            Exchange
          </Button>
          <Button as={Link} to="/my-status" variant="ghost" colorScheme="whiteAlpha">
            My Status
          </Button>
          <Button variant="outline" colorScheme="whiteAlpha" size="sm" onClick={handleChangeFamily}>
            {selectedFamily?.name} ▾
          </Button>
        </HStack>
      </Flex>
      <Outlet />
    </Box>
  );
}
```

**Step 2: Update App.jsx with routes**

```jsx
// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import FamilySelector from './components/FamilySelector';
import ParentLayout from './layouts/ParentLayout';
import OrderPage from './pages/parent/OrderPage';
import InventoryPage from './pages/parent/InventoryPage';
import ExchangePage from './pages/parent/ExchangePage';
import MyStatusPage from './pages/parent/MyStatusPage';

function ParentRoutes() {
  const { selectedFamily } = useFamily();

  if (!selectedFamily) {
    return <FamilySelector />;
  }

  return (
    <Routes>
      <Route element={<ParentLayout />}>
        <Route index element={<Navigate to="/order" replace />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="exchange" element={<ExchangePage />} />
        <Route path="my-status" element={<MyStatusPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <FamilyProvider>
      <Routes>
        <Route path="/admin/*" element={<div>Admin (coming next)</div>} />
        <Route path="/*" element={<ParentRoutes />} />
      </Routes>
    </FamilyProvider>
  );
}

export default App;
```

**Step 3: Commit**

```bash
git add client/
git commit -m "feat: add parent portal layout and navigation"
```

---

### Task 17: Coordinator Dashboard - Login

**Files:**
- Create: `client/src/pages/admin/LoginPage.jsx`
- Create: `client/src/context/AdminContext.jsx`

**Step 1: Create admin context**

```jsx
// client/src/context/AdminContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/check')
      .then(res => setIsAdmin(res.data.isAdmin))
      .finally(() => setLoading(false));
  }, []);

  const login = async (password) => {
    const res = await api.post('/admin/login', { password });
    if (res.data.success) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await api.post('/admin/logout');
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
```

**Step 2: Create login page**

```jsx
// client/src/pages/admin/LoginPage.jsx
import { useState } from 'react';
import {
  Box, VStack, Heading, Input, Button, Alert, AlertIcon
} from '@chakra-ui/react';
import { useAdmin } from '../../context/AdminContext';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(password);
      if (!success) {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed');
    }
    setLoading(false);
  };

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Heading size="lg">Coordinator Login</Heading>
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            colorScheme="blue"
            width="100%"
            isLoading={loading}
          >
            Login
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
```

**Step 3: Commit**

```bash
git add client/
git commit -m "feat: add admin login and context"
```

---

### Task 18: Coordinator Dashboard - Layout

**Files:**
- Create: `client/src/layouts/AdminLayout.jsx`

**Step 1: Create admin layout**

```jsx
// client/src/layouts/AdminLayout.jsx
import {
  Box, Flex, VStack, Button, Heading, Spacer
} from '@chakra-ui/react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function AdminLayout() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/families', label: 'Families' },
    { to: '/admin/cookies', label: 'Cookies' },
    { to: '/admin/inventory', label: 'Inventory' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/payments', label: 'Payments' },
    { to: '/admin/exchanges', label: 'Exchanges' },
  ];

  return (
    <Flex minH="100vh">
      <Box w="200px" bg="blue.700" color="white" p={4}>
        <VStack spacing={4} align="stretch">
          <Heading size="sm" mb={4}>Coordinator</Heading>
          {navItems.map(item => (
            <Button
              key={item.to}
              as={Link}
              to={item.to}
              variant="ghost"
              colorScheme="whiteAlpha"
              justifyContent="flex-start"
            >
              {item.label}
            </Button>
          ))}
          <Spacer />
          <Button variant="outline" colorScheme="whiteAlpha" onClick={handleLogout}>
            Logout
          </Button>
        </VStack>
      </Box>
      <Box flex={1} bg="gray.50">
        <Outlet />
      </Box>
    </Flex>
  );
}
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add admin layout with navigation"
```

---

### Task 19: Coordinator Dashboard - Main Pages

**Files:**
- Create: `client/src/pages/admin/DashboardPage.jsx`
- Create: `client/src/pages/admin/FamiliesPage.jsx`
- Create: `client/src/pages/admin/CookiesPage.jsx`
- Create: `client/src/pages/admin/InventoryPage.jsx`
- Create: `client/src/pages/admin/OrdersPage.jsx`
- Create: `client/src/pages/admin/PaymentsPage.jsx`
- Create: `client/src/pages/admin/ExchangesPage.jsx`

Due to size, see individual file contents in the codebase. Each page follows similar patterns with CRUD operations and status management.

**Step 1: Create all admin pages** (see detailed code in repository)

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: add coordinator dashboard pages"
```

---

### Task 20: Wire Up Admin Routes

**Files:**
- Modify: `client/src/App.jsx`

**Step 1: Update App.jsx with admin routes**

```jsx
// client/src/App.jsx - final version
import { Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import FamilySelector from './components/FamilySelector';
import ParentLayout from './layouts/ParentLayout';
import AdminLayout from './layouts/AdminLayout';
import OrderPage from './pages/parent/OrderPage';
import InventoryPage from './pages/parent/InventoryPage';
import ExchangePage from './pages/parent/ExchangePage';
import MyStatusPage from './pages/parent/MyStatusPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import FamiliesPage from './pages/admin/FamiliesPage';
import CookiesPage from './pages/admin/CookiesPage';
import AdminInventoryPage from './pages/admin/InventoryPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import AdminExchangesPage from './pages/admin/ExchangesPage';
import { Spinner, Center } from '@chakra-ui/react';

function AdminRoutes() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }

  if (!isAdmin) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="families" element={<FamiliesPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="exchanges" element={<AdminExchangesPage />} />
      </Route>
    </Routes>
  );
}

function ParentRoutes() {
  const { selectedFamily } = useFamily();

  if (!selectedFamily) {
    return <FamilySelector />;
  }

  return (
    <Routes>
      <Route element={<ParentLayout />}>
        <Route index element={<Navigate to="/order" replace />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="exchange" element={<ExchangePage />} />
        <Route path="my-status" element={<MyStatusPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <FamilyProvider>
      <AdminProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<ParentRoutes />} />
        </Routes>
      </AdminProvider>
    </FamilyProvider>
  );
}

export default App;
```

**Step 2: Commit**

```bash
git add client/
git commit -m "feat: wire up admin routes"
```

---

## Phase 4: Final Integration

### Task 21: Test End-to-End

**Step 1: Start both servers**

Terminal 1:
```bash
cd server && npm run dev
```

Terminal 2:
```bash
cd client && npm run dev
```

**Step 2: Test parent portal**
- Open http://localhost:5173
- Add a family via API: `curl -X POST http://localhost:3001/api/families -H "Content-Type: application/json" -d '{"name":"Test Family"}'`
- Select family, place order, view inventory

**Step 3: Test coordinator dashboard**
- Open http://localhost:5173/admin
- Login with: `spicewoodgstroop40203!`
- Add families, manage inventory, process orders

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: end-to-end testing fixes"
```

---

### Task 22: Add .gitignore and README

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Create .gitignore**

```
node_modules/
.DS_Store
*.db
*.db-wal
*.db-shm
server/data/
.env
dist/
```

**Step 2: Create README.md**

```markdown
# Girl Scouts Cookie Ordering System

Troop 40203 cookie order management system.

## Quick Start

1. Start the server:
   ```bash
   cd server
   npm install
   npm run seed
   npm run dev
   ```

2. Start the client:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Open http://localhost:5173 for parent portal
4. Open http://localhost:5173/admin for coordinator dashboard

## Coordinator Password

`spicewoodgstroop40203!`
```

**Step 3: Commit**

```bash
git add .
git commit -m "docs: add gitignore and README"
```

---

## Summary

This plan creates a complete cookie ordering system with:

- **Backend**: Express API with SQLite, session-based auth
- **Parent Portal**: Order form, inventory view, exchanges, status
- **Coordinator Dashboard**: Manage families, cookies, inventory, orders, payments, exchanges

Total: 22 tasks, ~2-5 minutes each step.
