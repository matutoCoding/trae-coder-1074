import { Router, Request, Response } from 'express';
import { occupancyService } from '../services/occupancyService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { wallId, teamId, date } = req.query;
  
  let occupancies;
  
  if (wallId && date) {
    occupancies = occupancyService.getOccupanciesByWallAndDate(
      String(wallId),
      new Date(String(date))
    );
  } else if (wallId) {
    occupancies = occupancyService.getOccupanciesByWall(String(wallId));
  } else if (teamId) {
    occupancies = occupancyService.getOccupanciesByTeam(String(teamId));
  } else {
    occupancies = occupancyService.getAllOccupancies();
  }
  
  res.json({ success: true, data: occupancies });
});

router.get('/check', (req: Request, res: Response) => {
  const { wallId, startTime, endTime } = req.query;
  
  if (!wallId || !startTime || !endTime) {
    return res.status(400).json({ success: false, error: '缺少必填参数' });
  }
  
  const hasOverlap = occupancyService.hasOverlap(
    String(wallId),
    new Date(String(startTime)),
    new Date(String(endTime))
  );
  
  res.json({ success: true, data: { available: !hasOverlap } });
});

router.get('/available-slots', (req: Request, res: Response) => {
  const { wallId, date, duration } = req.query;
  
  if (!wallId || !date) {
    return res.status(400).json({ success: false, error: '缺少必填参数' });
  }
  
  const slots = occupancyService.getAvailableSlots(
    String(wallId),
    new Date(String(date)),
    Number(duration) || 1
  );
  
  res.json({ success: true, data: slots });
});

export default router;
