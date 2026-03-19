const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'meshcore.db');

const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL,
    lng REAL,
    hardware TEXT,
    firmware TEXT,
    last_heard TEXT,
    raw_json TEXT,
    updated_at TEXT,
    is_mine INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS my_repeater_details (
    node_id TEXT PRIMARY KEY REFERENCES nodes(id),
    callsign TEXT,
    frequency REAL,
    offset REAL,
    ctcss TEXT,
    dcs TEXT,
    power_watts INTEGER,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate existing nodes table if is_mine column doesn't exist
try {
  db.exec(`ALTER TABLE nodes ADD COLUMN is_mine INTEGER DEFAULT 0`);
} catch (e) {
  // Column already exists, ignore
}

module.exports = db;
