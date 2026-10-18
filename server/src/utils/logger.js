/**
 * Safe logging utility that suppresses sensitive fields
 */

const SENSITIVE_FIELDS = new Set(['password', 'password_hash', 'token', 'secret', 'cookie', 'sessionId']);

export function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info: (msg, meta) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
    }
  },
  warn: (msg, meta) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
  },
  error: (msg, err) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err ? (err.stack || err.message || err) : '');
  }
};
