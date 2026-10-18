import { Router } from 'express';
import { getDatabase } from '../db/database.js';

const router = Router();

router.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('SELECT 1').get();

    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

export default router;
