import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'cookies.db');

// Ensure data directory exists
mkdirSync(dataDir, { recursive: true });

// Initialize SQL.js
const SQL = await initSqlJs();

// Load existing database or create new one
let db;
if (existsSync(dbPath)) {
  const buffer = readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.run(schema);

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
