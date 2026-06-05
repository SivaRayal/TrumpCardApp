import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('trumpcard.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      biometric_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      card_index INTEGER NOT NULL,
      quote_index INTEGER NOT NULL,
      revealed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS quote_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quote_index INTEGER NOT NULL,
      used_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  biometric_enabled: number;
  created_at: string;
}

export interface DailySelection {
  id: number;
  user_id: number;
  date: string;
  card_index: number;
  quote_index: number;
  revealed_at: string;
}

export function hashPassword(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) + hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const database = await getDb();
  const hash = hashPassword(password);
  const result = await database.runAsync(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username.trim().toLowerCase(), email.trim().toLowerCase(), hash]
  );
  const user = await database.getFirstAsync<User>(
    'SELECT * FROM users WHERE id = ?',
    [result.lastInsertRowId]
  );
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const database = await getDb();
  return database.getFirstAsync<User>(
    'SELECT * FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const database = await getDb();
  return database.getFirstAsync<User>(
    'SELECT * FROM users WHERE username = ?',
    [username.trim().toLowerCase()]
  );
}

export async function validateLogin(
  emailOrUsername: string,
  password: string
): Promise<User | null> {
  const database = await getDb();
  const hash = hashPassword(password);
  const lower = emailOrUsername.trim().toLowerCase();
  return database.getFirstAsync<User>(
    'SELECT * FROM users WHERE (email = ? OR username = ?) AND password_hash = ?',
    [lower, lower, hash]
  );
}

export async function setBiometricEnabled(userId: number, enabled: boolean): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE users SET biometric_enabled = ? WHERE id = ?',
    [enabled ? 1 : 0, userId]
  );
}

export async function getTodaySelection(userId: number): Promise<DailySelection | null> {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  return database.getFirstAsync<DailySelection>(
    'SELECT * FROM daily_selections WHERE user_id = ? AND date = ?',
    [userId, today]
  );
}

export async function saveSelection(
  userId: number,
  cardIndex: number,
  quoteIndex: number
): Promise<DailySelection> {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = await database.runAsync(
    'INSERT OR REPLACE INTO daily_selections (user_id, date, card_index, quote_index) VALUES (?, ?, ?, ?)',
    [userId, today, cardIndex, quoteIndex]
  );
  await database.runAsync(
    'INSERT INTO quote_history (user_id, quote_index) VALUES (?, ?)',
    [userId, quoteIndex]
  );
  const selection = await database.getFirstAsync<DailySelection>(
    'SELECT * FROM daily_selections WHERE id = ?',
    [result.lastInsertRowId]
  );
  if (!selection) throw new Error('Failed to save selection');
  return selection;
}

export async function getUsedQuoteIndices(userId: number): Promise<number[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ quote_index: number }>(
    'SELECT quote_index FROM quote_history WHERE user_id = ?',
    [userId]
  );
  return rows.map(r => r.quote_index);
}
