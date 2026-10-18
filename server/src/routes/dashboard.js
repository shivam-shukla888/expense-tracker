import { Router } from 'express';
import { ReportService } from '../services/reportService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/dashboard/summary
router.get('/summary', (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = ReportService.getDashboardSummary(req.user.id, startDate, endDate);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
});

export default router;
