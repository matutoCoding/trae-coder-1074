import type { Wall, Team, Booking, Occupancy, CreditLog, Equipment, EquipmentRental } from '../../shared/types';

export interface DataStore {
  walls: Wall[];
  teams: Team[];
  bookings: Booking[];
  occupancies: Occupancy[];
  creditLogs: CreditLog[];
  equipment: Equipment[];
  equipmentRentals: EquipmentRental[];
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const today = new Date();
const formatDate = (date: Date): string => date.toISOString();

const getDateStr = (daysFromNow: number, hour: number, minute = 0): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return formatDate(d);
};

const initialWalls: Wall[] = [
  { id: generateId(), name: '先锋墙 A', difficulty: 'intermediate', height: 12, type: 'lead', status: 'active' },
  { id: generateId(), name: '先锋墙 B', difficulty: 'advanced', height: 15, type: 'lead', status: 'active' },
  { id: generateId(), name: '抱石墙 1号', difficulty: 'beginner', height: 4.5, type: 'bouldering', status: 'active' },
  { id: generateId(), name: '抱石墙 2号', difficulty: 'expert', height: 5, type: 'bouldering', status: 'active' },
  { id: generateId(), name: '速度墙', difficulty: 'intermediate', height: 15, type: 'speed', status: 'maintenance' },
  { id: generateId(), name: '顶绳墙 C', difficulty: 'beginner', height: 10, type: 'top-rope', status: 'active' },
];

const initialTeams: Team[] = [
  { id: generateId(), name: '晨星攀岩俱乐部', totalCredits: 500, usedCredits: 120, status: 'active', createdAt: formatDate(today) },
  { id: generateId(), name: '顶峰企业团建', totalCredits: 200, usedCredits: 80, status: 'active', createdAt: formatDate(today) },
  { id: generateId(), name: '岩舞者小队', totalCredits: 100, usedCredits: 0, status: 'active', createdAt: formatDate(today) },
];

const initialBookings: Booking[] = [];

const initialOccupancies: Occupancy[] = [];

const initialCreditLogs: CreditLog[] = [
  { id: generateId(), teamId: initialTeams[0].id, amount: 500, type: 'recharge', description: '初始充值', createdAt: formatDate(today) },
  { id: generateId(), teamId: initialTeams[1].id, amount: 200, type: 'recharge', description: '初始充值', createdAt: formatDate(today) },
  { id: generateId(), teamId: initialTeams[2].id, amount: 100, type: 'recharge', description: '初始充值', createdAt: formatDate(today) },
];

const initialEquipment: Equipment[] = [
  { id: generateId(), name: '攀岩安全带', type: 'harness', total: 30, available: 30, status: 'active' },
  { id: generateId(), name: '攀岩鞋 (38-42码)', type: 'shoes', total: 50, available: 50, status: 'active' },
  { id: generateId(), name: '安全头盔', type: 'helmet', total: 20, available: 20, status: 'active' },
  { id: generateId(), name: '镁粉袋', type: 'chalk-bag', total: 40, available: 40, status: 'active' },
  { id: generateId(), name: '动力绳 60m', type: 'rope', total: 10, available: 10, status: 'active' },
];

const initialEquipmentRentals: EquipmentRental[] = [];

export const store: DataStore = {
  walls: initialWalls,
  teams: initialTeams,
  bookings: initialBookings,
  occupancies: initialOccupancies,
  creditLogs: initialCreditLogs,
  equipment: initialEquipment,
  equipmentRentals: initialEquipmentRentals,
};

export { generateId, formatDate, getDateStr };
