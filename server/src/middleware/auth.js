import { getDatabase } from '../db/database.js';
import { config } from '../config/env.js';

export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.[config.cookieName] || req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }

  const db = getDatabase();
  const now = Date.now();

  const session = db.prepare(
    `SELECT s.sid, s.user_id, s.csrf_secret, s.expires_at, u.id, u.name, u.email
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.sid = ? AND s.expires_at > ?`
  ).get(sessionId, now);

  if (!session) {
    // Clear invalid or expired cookie
    res.clearCookie(config.cookieName, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      path: '/'
    });
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid. Please log in again.'
    });
  }

  // Bind securely to request object - never trust client-supplied userId
  req.user = {
    id: session.id,
    name: session.name,
    email: session.email
  };
  req.session = {
    sid: session.sid,
    csrfSecret: session.csrf_secret,
    expiresAt: session.expires_at
  };

  next();
}
