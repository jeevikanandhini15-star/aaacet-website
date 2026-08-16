// db.js — SQLite database setup (file-based, persists in aaacet.db)
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "aaacet.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  register_no TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  venue TEXT,
  fee INTEGER DEFAULT 0,
  seats_total INTEGER DEFAULT 100,
  seats_taken INTEGER DEFAULT 0,
  about TEXT,
  last_date TEXT,
  banner TEXT DEFAULT 'bg1',
  status TEXT DEFAULT 'upcoming',
  created_by_staff_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending_payment', -- pending_payment | pending_verification | verified | cancelled
  seat_no TEXT,
  pass_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  txn_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_date TEXT,
  payment_time TEXT,
  status TEXT DEFAULT 'pending', -- pending | verified | rejected
  verified_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(registration_id) REFERENCES registrations(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT DEFAULT 'all', -- all | student | staff
  title TEXT NOT NULL,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
