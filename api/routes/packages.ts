import { Router, Request, Response } from 'express';
import { packageService } from '../services/packageService';

const router = Router();

router.get('/active', (req: Request, res: Response) => {
  const packages = packageService.getActivePackages();
  res.json({ success: true, data: packages });
});

router.get('/:id', (req: Request, res: Response) => {
  const pkg = packageService.getPackageById(req.params.id);
  if (!pkg) {
    return res.status(404).json({ success: false, error: '套餐不存在' });
  }
  res.json({ success: true, data: pkg });
});

router.get('/', (req: Request, res: Response) => {
  const packages = packageService.getAllPackages();
  res.json({ success: true, data: packages });
});

router.post('/', (req: Request, res: Response) => {
  const { name, durationHours, creditsPerPerson } = req.body;

  if (!name || durationHours === undefined || creditsPerPerson === undefined) {
    return res.status(400).json({ success: false, error: '缺少必填字段: name, durationHours, creditsPerPerson' });
  }

  const pkg = packageService.createPackage({
    name,
    description: req.body.description || '',
    durationHours: Number(durationHours),
    creditsPerPerson: Number(creditsPerPerson),
    creditDiscount: req.body.creditDiscount ? Number(req.body.creditDiscount) : 0,
    peopleCount: req.body.peopleCount ? Number(req.body.peopleCount) : 1,
    equipmentCombos: req.body.equipmentCombos || [],
    status: req.body.status || 'active',
  });

  res.status(201).json({ success: true, data: pkg });
});

router.put('/:id', (req: Request, res: Response) => {
  const pkg = packageService.updatePackage(req.params.id, req.body);
  if (!pkg) {
    return res.status(404).json({ success: false, error: '套餐不存在' });
  }
  res.json({ success: true, data: pkg });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = packageService.deletePackage(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: '套餐不存在' });
  }
  res.json({ success: true });
});

export default router;
