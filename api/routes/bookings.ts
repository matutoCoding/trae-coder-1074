import { Router, Request, Response } from 'express';
import { bookingService } from '../services/bookingService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { teamId, wallId } = req.query;
  
  let bookings;
  if (teamId) {
    bookings = bookingService.getBookingsByTeam(String(teamId));
  } else if (wallId) {
    bookings = bookingService.getBookingsByWall(String(wallId));
  } else {
    bookings = bookingService.getAllBookings();
  }
  
  res.json({ success: true, data: bookings });
});

router.get('/stats', (req: Request, res: Response) => {
  const stats = bookingService.getStats();
  res.json({ success: true, data: stats });
});

router.get('/:id', (req: Request, res: Response) => {
  const booking = bookingService.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, error: '预约不存在' });
  }
  res.json({ success: true, data: booking });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await bookingService.createBooking(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '创建预约失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '取消预约失败' });
  }
});

export default router;
