import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    });
  }

  // SQLite constraints
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      error: 'A record with that unique value already exists'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = (process.env.NODE_ENV === 'production' && statusCode === 500)
    ? 'An unexpected internal server error occurred'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}
