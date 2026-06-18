import { Router, Request, Response } from 'express';
import { equipmentService } from '../services/equipmentService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { type } = req.query;
  
  let equipment;
  if (type) {
    equipment = equipmentService.getEquipmentByType(type as any);
  } else {
    equipment = equipmentService.getAllEquipment();
  }
  
  res.json({ success: true, data: equipment });
});

router.get('/:id', (req: Request, res: Response) => {
  const equipment = equipmentService.getEquipmentById(req.params.id);
  if (!equipment) {
    return res.status(404).json({ success: false, error: '装备不存在' });
  }
  res.json({ success: true, data: equipment });
});

router.post('/', (req: Request, res: Response) => {
  const { name, type, total, status } = req.body;
  
  if (!name || !type || total === undefined) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  const equipment = equipmentService.createEquipment({
    name,
    type,
    total: Number(total),
    available: Number(total),
    status: status || 'active',
  });
  
  res.status(201).json({ success: true, data: equipment });
});

router.put('/:id', (req: Request, res: Response) => {
  const equipment = equipmentService.updateEquipment(req.params.id, req.body);
  if (!equipment) {
    return res.status(404).json({ success: false, error: '装备不存在' });
  }
  res.json({ success: true, data: equipment });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = equipmentService.deleteEquipment(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: '装备不存在' });
  }
  res.json({ success: true });
});

router.get('/rentals/active', (req: Request, res: Response) => {
  const rentals = equipmentService.getActiveRentals();
  res.json({ success: true, data: rentals });
});

router.get('/rentals/all', (req: Request, res: Response) => {
  const { teamId, equipmentType, status } = req.query;
  const rentals = equipmentService.getAllRentals({
    teamId: teamId ? String(teamId) : undefined,
    equipmentType: equipmentType ? String(equipmentType) : undefined,
    status: status ? String(status) : undefined,
  });
  res.json({ success: true, data: rentals });
});

router.post('/rentals', async (req: Request, res: Response) => {
  const { equipmentId, bookingId, teamId, quantity } = req.body;
  
  if (!equipmentId || !bookingId || !teamId || !quantity) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  const rental = await equipmentService.rentEquipment(
    equipmentId,
    bookingId,
    teamId,
    Number(quantity)
  );
  
  if (!rental) {
    return res.status(400).json({ success: false, error: '装备库存不足' });
  }
  
  res.status(201).json({ success: true, data: rental });
});

router.post('/rentals/:id/return', async (req: Request, res: Response) => {
  const rental = await equipmentService.returnEquipment(req.params.id);
  if (!rental) {
    return res.status(404).json({ success: false, error: '租赁记录不存在或已归还' });
  }
  res.json({ success: true, data: rental });
});

router.get('/rentals/booking/:bookingId', (req: Request, res: Response) => {
  const rentals = equipmentService.getRentalsByBooking(req.params.bookingId);
  res.json({ success: true, data: rentals });
});

router.get('/rentals/team/:teamId', (req: Request, res: Response) => {
  const rentals = equipmentService.getRentalsByTeam(req.params.teamId);
  res.json({ success: true, data: rentals });
});

export default router;
