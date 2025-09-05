// lib/db/sql.ts
'use client';

let _initSqlJs: any;
async function loadSqlJs() {
  if (!_initSqlJs) {
    const m = await import('sql.js');
    _initSqlJs = m.default || m;
  }
  return _initSqlJs;
}

type SQL = any;
let dbPromise: Promise<{ SQL: SQL; db: any; persist: () => Promise<void> }> | null = null;

const DB_FILENAME = 'calorie-meter.db';
const LOCALSTORAGE_KEY = 'calorie-meter-db-bytes-v1';

async function loadFromOPFS(): Promise<Uint8Array | null> {
  try {
    // @ts-ignore
    const root = await (navigator as any).storage.getDirectory();
    const handle = await root.getFileHandle(DB_FILENAME).catch(() => null);
    if (!handle) return null;
    const file = await handle.getFile();
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
  } catch { return null; }
}
async function saveToOPFS(bytes: Uint8Array): Promise<void> {
  try {
    // @ts-ignore
    const root = await (navigator as any).storage.getDirectory();
    const handle = await root.getFileHandle(DB_FILENAME, { create: true });
    const writable = await handle.createWritable();
    await writable.write(bytes);
    await writable.close();
  } catch {}
}
function loadFromLocalStorage(): Uint8Array | null {
  try {
    const b64 = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!b64) return null;
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i=0;i<raw.length;i++) arr[i] = raw.charCodeAt(i);
    return arr;
  } catch { return null; }
}
function saveToLocalStorage(bytes: Uint8Array) {
  try {
    let s = ''; for (let i=0;i<bytes.length;i++) s += String.fromCharCode(bytes[i]);
    localStorage.setItem(LOCALSTORAGE_KEY, btoa(s));
  } catch {}
}

export function rows(res: any[]) {
  if (!res || !res[0]) return [];
  const { columns, values } = res[0];
  return values.map((row: any[]) => Object.fromEntries(row.map((v,i)=>[columns[i], v])));
}

async function initDbInternal() {
  const initSqlJs = await loadSqlJs();
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`,
  });

  let dbBytes = await loadFromOPFS();
  if (!dbBytes) dbBytes = loadFromLocalStorage();
  const db = dbBytes ? new SQL.Database(dbBytes) : new SQL.Database();

  db.exec(`
    PRAGMA journal_mode=MEMORY;

    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_setting (
      id INTEGER PRIMARY KEY,
      day_boundary_hour INTEGER NOT NULL DEFAULT 2,
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata'
    );
    CREATE TABLE IF NOT EXISTS recipe (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      total_weight_g INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      protein_mg INTEGER NOT NULL,
      carbs_mg INTEGER NOT NULL,
      fat_mg INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recipe_profile_name ON recipe(profile_id, name);
    CREATE TABLE IF NOT EXISTS diary_entry (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      logged_at_utc_ms INTEGER NOT NULL,
      recipe_id TEXT,
      label TEXT,
      amount_weight_g INTEGER,
      calories INTEGER NOT NULL,
      protein_mg INTEGER NOT NULL,
      carbs_mg INTEGER NOT NULL,
      fat_mg INTEGER NOT NULL,
      diary_day_local TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_diary_day ON diary_entry(profile_id, diary_day_local);
    CREATE INDEX IF NOT EXISTS idx_diary_logged ON diary_entry(profile_id, logged_at_utc_ms);
  `);

  const s = db.exec(`SELECT COUNT(*) FROM app_setting`);
  if (!s[0] || s[0].values[0][0] === 0) {
    db.run(`INSERT INTO app_setting(id, day_boundary_hour, timezone) VALUES (1, 2, 'Asia/Kolkata')`);
  }
  const p = db.exec(`SELECT COUNT(*) FROM profile`);
  if (!p[0] || p[0].values[0][0] === 0) {
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as any).randomUUID()
      : String(Date.now());
    db.run(`INSERT INTO profile(id, name, created_at_ms) VALUES (?,?,?)`, [id, 'Sid', Date.now()]);
  }

  async function persist() {
    const bytes: Uint8Array = db.export();
    await saveToOPFS(bytes);
    saveToLocalStorage(bytes);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => { void persist(); });
  }

  return { SQL, db, persist };
}

export async function getDb() {
  if (!dbPromise) dbPromise = initDbInternal();
  return dbPromise;
}

// NEW: allow callers to proactively wake the DB before user actions
export async function warmup() {
  return getDb();
}
