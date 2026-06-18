import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { period, date } = req.query;
  const p = (period === 'week' || period === 'month') ? period : 'day';
  const analytics = analyticsService.getAnalytics(p, date ? String(date) : undefined);
  res.json({ success: true, data: analytics });
});

export default router;
