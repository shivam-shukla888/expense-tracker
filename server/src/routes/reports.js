import { Router } from 'express';
import { ReportService } from '../services/reportService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/reports/monthly?months=6
router.get('/monthly', (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const data = ReportService.getMonthlyReport(req.user.id, months);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/categories?startDate=...&endDate=...
router.get('/categories', (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = ReportService.getCategoryReport(req.user.id, startDate, endDate);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

export default router;
