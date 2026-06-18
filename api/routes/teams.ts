import { Router, Request, Response } from 'express';
import { creditService } from '../services/creditService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const teams = creditService.getAllTeams();
  res.json({ success: true, data: teams });
});

router.post('/', (req: Request, res: Response) => {
  const { name, initialCredits = 0 } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: '团队名称不能为空' });
  }

  const team = creditService.createTeam(name, Number(initialCredits));
  res.status(201).json({ success: true, data: team });
});

router.get('/:id', (req: Request, res: Response) => {
  const team = creditService.getTeamById(req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: '团队不存在' });
  }
  res.json({ success: true, data: team });
});

router.get('/:id/credits', (req: Request, res: Response) => {
  const credits = creditService.getTeamCredits(req.params.id);
  if (!credits) {
    return res.status(404).json({ success: false, error: '团队不存在' });
  }
  res.json({ success: true, data: credits });
});

router.post('/:id/credits/recharge', async (req: Request, res: Response) => {
  const { amount, description } = req.body;
  
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: '充值金额必须大于0' });
  }

  const team = await creditService.rechargeCredits(
    req.params.id,
    Number(amount),
    description
  );
  
  if (!team) {
    return res.status(404).json({ success: false, error: '团队不存在' });
  }
  
  res.json({ success: true, data: team });
});

router.get('/:id/credit-logs', (req: Request, res: Response) => {
  const { limit } = req.query;
  const logs = creditService.getCreditLogs(
    req.params.id,
    limit ? Number(limit) : 50
  );
  res.json({ success: true, data: logs });
});

export default router;
