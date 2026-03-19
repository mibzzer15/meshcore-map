const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'meshcore.db');

// Ensure data directory exists
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
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS my_repeaters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    callsign TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    frequency REAL,
    offset REAL,
    ctcss TEXT,
    dcs TEXT,
    power_watts INTEGER,
    hardware TEXT,
    notes TEXT,
    node_id TEXT REFERENCES nodes(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
