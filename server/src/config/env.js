import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 5001;
const SESSION_SECRET = process.env.SESSION_SECRET || (
  NODE_ENV === 'production'
    ? (() => {
        throw new Error('FATAL: SESSION_SECRET must be set in production!');
      })()
    : 'dev-insecure-secret-key-change-in-production-min-32-chars!'
);

if (NODE_ENV === 'production' && SESSION_SECRET.length < 32) {
  throw new Error('FATAL: SESSION_SECRET must be at least 32 characters long in production!');
}

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = [
  CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../storage/expense_tracker.db');

export const config = {
  env: NODE_ENV,
  isProd: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  port: PORT,
  sessionSecret: SESSION_SECRET,
  corsOrigin: CORS_ORIGIN,
  allowedOrigins: ALLOWED_ORIGINS,
  dbPath: DB_PATH,
  cookieName: 'et_session_id',
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000 // 7 days
};
