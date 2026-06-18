import { Router, Request, Response } from 'express';
import { wallService } from '../services/wallService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const walls = wallService.getAllWalls();
  res.json({ success: true, data: walls });
});

router.get('/:id', (req: Request, res: Response) => {
  const wall = wallService.getWallById(req.params.id);
  if (!wall) {
    return res.status(404).json({ success: false, error: '岩壁道不存在' });
  }
  res.json({ success: true, data: wall });
});

router.post('/', (req: Request, res: Response) => {
  const { name, difficulty, height, type, status } = req.body;
  
  if (!name || !difficulty || !height || !type) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  const wall = wallService.createWall({
    name,
    difficulty,
    height: Number(height),
    type,
    status: status || 'active',
  });
  
  res.status(201).json({ success: true, data: wall });
});

router.put('/:id', (req: Request, res: Response) => {
  const wall = wallService.updateWall(req.params.id, req.body);
  if (!wall) {
    return res.status(404).json({ success: false, error: '岩壁道不存在' });
  }
  res.json({ success: true, data: wall });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = wallService.deleteWall(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: '岩壁道不存在' });
  }
  res.json({ success: true });
});

export default router;
