import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

const DEFAULT_CATEGORIES = [
  // Income
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Business', type: 'income' },
  { name: 'Investment Returns', type: 'income' },
  { name: 'Other', type: 'income' },
  // Expense
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Rent', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Bills', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Other', type: 'expense' }
];

export function getDatabase(customPath = null) {
  if (customPath) {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  } else if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || config.dbPath;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // WAL mode for improved concurrency and performance
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Initialize schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Seed default categories if not present
  const checkCat = db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_default = 1');
  const { count } = checkCat.get();
  if (count === 0) {
    const insertCat = db.prepare(
      'INSERT OR IGNORE INTO categories (name, type, is_default, user_id) VALUES (?, ?, 1, NULL)'
    );
    const insertMany = db.transaction((categories) => {
      for (const cat of categories) {
        insertCat.run(cat.name, cat.type);
      }
    });
    insertMany(DEFAULT_CATEGORIES);
  }

  // Periodic expired sessions cleanup
  try {
    const now = Date.now();
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  } catch (err) {
    logger.error('Failed to clean up expired sessions on startup', err);
  }

  dbInstance = db;
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
