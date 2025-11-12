import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

export let db;
const DB_DIR = process.env.QUEUECTL_DATA || path.join(process.cwd(), '.queuectl');
const DB_PATH = path.join(DB_DIR, 'queue.db');

export function ensureDb(){
  fs.ensureDirSync(DB_DIR);
  if(!db){
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    migrate();
  }
}

function migrate(){
  db.exec(`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    run_at TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    locked_by TEXT,
    locked_at TEXT,
    output TEXT
  );`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_state_runat ON jobs(state, run_at);`);
  db.exec(`CREATE TABLE IF NOT EXISTS dlq (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    attempts INTEGER NOT NULL,
    max_retries INTEGER NOT NULL,
    failed_at TEXT NOT NULL,
    last_error TEXT
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`);
  // defaults
  const get = db.prepare('SELECT value FROM config WHERE key=?');
  if(!get.get('backoff_base')) db.prepare('INSERT INTO config(key,value) VALUES(?,?)').run('backoff_base','2');
  if(!get.get('max_retries_default')) db.prepare('INSERT INTO config(key,value) VALUES(?,?)').run('max_retries_default','3');
  db.exec(`CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    pid INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    status TEXT NOT NULL
  );`);
}

export const nowIso = ()=> new Date().toISOString();
