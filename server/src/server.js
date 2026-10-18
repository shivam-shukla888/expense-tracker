import { createApp } from './app.js';
import { config } from './config/env.js';
import { getDatabase, closeDatabase } from './db/database.js';
import { seedDemoData } from './db/seed.js';
import { logger } from './utils/logger.js';

const app = createApp();

// Ensure DB initialization
const db = getDatabase();

// In development, automatically seed demo user with synthetic data if desired
if (config.env === 'development') {
  seedDemoData(db).catch(err => {
    logger.error('Error during demo seeding on startup', err);
  });
}

const server = app.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on http://localhost:${config.port}`);
  logger.info(`CORS allowed origin: ${config.corsOrigin}`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  logger.info(`${signal} signal received. Closing HTTP server and database...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    closeDatabase();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  // Force exit if hanging
  setTimeout(() => {
    logger.error('Forcefully terminating process after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
