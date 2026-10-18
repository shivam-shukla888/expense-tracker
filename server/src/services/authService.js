import argon2 from 'argon2';
import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import { config } from '../config/env.js';

// Pre-computed dummy hash to mitigate timing attacks on non-existent accounts
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$b04X1xS7GzT72L8eKqW4rg$L0QYvA5fM4i94FzQ0Yy+5F8bZqZ3G8v2/hW2V7v5/7g';

export class AuthService {
  static async registerUser({ name, email, password }) {
    const db = getDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already taken
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      const error = new Error('An account with this email already exists.');
      error.status = 409;
      throw error;
    }

    // Secure Argon2id hashing
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2
    });

    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    );
    const result = insertUser.run(name.trim(), normalizedEmail, passwordHash);
    const userId = result.lastInsertRowid;

    // Create session
    const session = this.createSession(userId);

    return {
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail
      },
      session
    };
  }

  static async loginUser({ email, password }) {
    const db = getDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?'
    ).get(normalizedEmail);

    let isValid = false;
    if (user) {
      isValid = await argon2.verify(user.password_hash, password);
    } else {
      // Run dummy verification to keep timing identical
      await argon2.verify(DUMMY_HASH, password).catch(() => {});
    }

    if (!user || !isValid) {
      const error = new Error('Invalid email or password.');
      error.status = 401;
      throw error;
    }

    const session = this.createSession(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      session
    };
  }

  static createSession(userId) {
    const db = getDatabase();
    const sid = crypto.randomBytes(32).toString('hex');
    const csrfSecret = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + config.sessionMaxAgeMs;

    db.prepare(
      'INSERT INTO sessions (sid, user_id, csrf_secret, expires_at) VALUES (?, ?, ?, ?)'
    ).run(sid, userId, csrfSecret, expiresAt);

    return {
      sid,
      csrfSecret,
      expiresAt
    };
  }

  static logoutUser(sid) {
    if (!sid) return;
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
  }

  static getUserById(userId) {
    const db = getDatabase();
    return db.prepare(
      'SELECT id, name, email, created_at FROM users WHERE id = ?'
    ).get(userId);
  }
}
