import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use /app/server/data if on Railway (check for RAILWAY env vars), otherwise local
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
const localDataDir = join(__dirname, '../../data');
const railwayDataDir = '/app/server/data';

// Use Railway path if on Railway, otherwise local
const dataDir = isRailway ? railwayDataDir : localDataDir;
const dbPath = join(dataDir, 'cookies.db');

console.log('=== DATABASE INITIALIZATION ===');
console.log('Environment:', isRailway ? 'Railway' : 'Local');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);
console.log('Database path:', dbPath);

// Ensure data directory exists
mkdirSync(dataDir, { recursive: true });

// List contents of data directory
try {
  const files = readdirSync(dataDir);
  console.log('Files in data directory:', files);
  files.forEach(f => {
    const stats = statSync(join(dataDir, f));
    console.log(`  ${f}: ${stats.size} bytes, modified ${stats.mtime}`);
  });
} catch (e) {
  console.log('Could not list data directory:', e.message);
}

// Initialize SQL.js
const SQL = await initSqlJs();

// Load existing database or create new one
let db;
if (existsSync(dbPath)) {
  console.log('Loading existing database from:', dbPath);
  const buffer = readFileSync(dbPath);
  console.log('Database file size:', buffer.length, 'bytes');
  db = new SQL.Database(buffer);
} else {
  console.log('Creating new database (file does not exist)');
  db = new SQL.Database();
}

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.run(schema);

// Log existing data count
try {
  const ordersResult = db.exec("SELECT COUNT(*) as count FROM orders");
  const familiesResult = db.exec("SELECT COUNT(*) as count FROM families");
  console.log('Orders in database:', ordersResult[0]?.values[0]?.[0] || 0);
  console.log('Families in database:', familiesResult[0]?.values[0]?.[0] || 0);
} catch (e) {
  console.log('Could not count records:', e.message);
}
console.log('=== END DATABASE INITIALIZATION ===');

// Migration: Add cash_paid and check_paid columns if they don't exist
try {
  const cols = db.exec("PRAGMA table_info(orders)");
  const colNames = cols[0]?.values?.map(v => v[1]) || [];

  if (colNames.includes('amount_paid') && !colNames.includes('cash_paid')) {
    // Rename amount_paid to cash_paid and add check_paid
    db.run("ALTER TABLE orders RENAME COLUMN amount_paid TO cash_paid");
    db.run("ALTER TABLE orders ADD COLUMN check_paid REAL DEFAULT 0");
  } else if (!colNames.includes('cash_paid')) {
    db.run("ALTER TABLE orders ADD COLUMN cash_paid REAL DEFAULT 0");
  }
  if (!colNames.includes('check_paid')) {
    db.run("ALTER TABLE orders ADD COLUMN check_paid REAL DEFAULT 0");
  }
} catch (e) {
  // Migration may fail if columns already exist, which is fine
}

// Save database to file
const saveDb = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
};

// Wrapper to mimic better-sqlite3 API
const wrapper = {
  prepare: (sql) => ({
    run: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();
      // Get last insert rowid BEFORE saving (which might reset it)
      const lastRowStmt = db.prepare("SELECT last_insert_rowid() as id");
      lastRowStmt.step();
      const lastInsertRowid = lastRowStmt.getAsObject().id;
      lastRowStmt.free();
      saveDb();
      return { lastInsertRowid };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  }),
  exec: (sql) => {
    db.run(sql);
    saveDb();
  }
};

export default wrapper;
