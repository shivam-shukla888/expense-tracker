import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-session-secret-key-that-is-at-least-32-chars-long!';
  
  // Use in-memory database for isolated, lightning-fast tests
  const db = getDatabase(':memory:');
  const app = createApp();

  return { app, db, request: request(app) };
}

export function teardownTestEnvironment() {
  closeDatabase();
}
