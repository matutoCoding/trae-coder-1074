import { store } from '../data/store';

interface TeamRepurchase {
  teamId: string;
  teamName: string;
  bookingCount: number;
  totalSpent: number;
}

interface WallIdleSlot {
  wallId: string;
  wallName: string;
  totalSlots: number;
  occupiedSlots: number;
  idleSlots: number;
  idleRate: number;
}

interface DailyTrend {
  date: string;
  revenue: number;
  bookings: number;
}

interface AnalyticsResult {
  period: { label: string; start: string; end: string };
  bookingRevenue: number;
  creditsConsumed: number;
  creditsRefunded: number;
  bookingCount: number;
  avgBookingValue: number;
  teamRepurchase: TeamRepurchase[];
  wallIdleSlots: WallIdleSlot[];
  dailyTrend: DailyTrend[];
}

const getPeriodRange = (period: 'day' | 'week' | 'month', dateStr?: string): { start: Date; end: Date; label: string } => {
  const ref = dateStr ? new Date(dateStr) : new Date();
  ref.setHours(0, 0, 0, 0);

  if (period === 'day') {
    const start = new Date(ref);
    const end = new Date(ref);
    end.setDate(end.getDate() + 1);
    return { start, end, label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` };
  }

  if (period === 'week') {
    const dayOfWeek = ref.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = new Date(ref);
    start.setDate(ref.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const month = start.getMonth() + 1;
    const endMonth = new Date(end.getTime() - 1).getMonth() + 1;
    return { start, end, label: `${start.getFullYear()}/${month}-${endMonth}周` };
  }

  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  return { start, end, label: `${start.getFullYear()}年${start.getMonth() + 1}月` };
};

const getDaysInRange = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);
  while (current < end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const analyticsService = {
  getAnalytics: (period: 'day' | 'week' | 'month', dateStr?: string): AnalyticsResult => {
    const { start, end, label } = getPeriodRange(period, dateStr);
    const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const confirmedBookings = store.bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      const bStart = new Date(b.startTime);
      return bStart >= start && bStart < end;
    });

    const bookingRevenue = confirmedBookings.reduce((sum, b) => sum + b.creditsCost, 0);
    const bookingCount = confirmedBookings.length;
    const avgBookingValue = bookingCount > 0 ? Math.round((bookingRevenue / bookingCount) * 100) / 100 : 0;

    const creditLogsInPeriod = store.creditLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= start && logDate < end;
    });

    const creditsConsumed = creditLogsInPeriod
      .filter(log => log.type === 'consume')
      .reduce((sum, log) => sum + log.amount, 0);

    const creditsRefunded = creditLogsInPeriod
      .filter(log => log.type === 'refund')
      .reduce((sum, log) => sum + log.amount, 0);

    const teamBookingMap: Record<string, { bookingCount: number; totalSpent: number }> = {};
    for (const b of confirmedBookings) {
      if (!teamBookingMap[b.teamId]) {
        teamBookingMap[b.teamId] = { bookingCount: 0, totalSpent: 0 };
      }
      teamBookingMap[b.teamId].bookingCount++;
      teamBookingMap[b.teamId].totalSpent += b.creditsCost;
    }

    const teamRepurchase: TeamRepurchase[] = Object.entries(teamBookingMap)
      .filter(([, data]) => data.bookingCount > 1)
      .map(([teamId, data]) => {
        const team = store.teams.find(t => t.id === teamId);
        return {
          teamId,
          teamName: team?.name || '未知团队',
          bookingCount: data.bookingCount,
          totalSpent: data.totalSpent,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const activeWalls = store.walls.filter(w => w.status === 'active');
    const wallIdleSlots: WallIdleSlot[] = activeWalls.map(wall => {
      const totalSlots = 13 * numDays;
      const wallOccupancies = store.occupancies.filter(o => {
        if (o.wallId !== wall.id) return false;
        const oStart = new Date(o.startTime);
        const oEnd = new Date(o.endTime);
        return oStart < end && oEnd > start;
      });
      let occupiedSlots = 0;
      for (const occ of wallOccupancies) {
        const occStart = new Date(Math.max(new Date(occ.startTime).getTime(), start.getTime()));
        const occEnd = new Date(Math.min(new Date(occ.endTime).getTime(), end.getTime()));
        const hours = (occEnd.getTime() - occStart.getTime()) / (1000 * 60 * 60);
        occupiedSlots += Math.round(hours);
      }
      const idleSlots = totalSlots - occupiedSlots;
      const idleRate = totalSlots > 0 ? Math.round((idleSlots / totalSlots) * 10000) / 100 : 0;
      return {
        wallId: wall.id,
        wallName: wall.name,
        totalSlots,
        occupiedSlots,
        idleSlots,
        idleRate,
      };
    });

    const days = getDaysInRange(start, end);
    const dailyTrend: DailyTrend[] = days.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayBookings = confirmedBookings.filter(b => {
        const bStart = new Date(b.startTime);
        return bStart >= day && bStart < nextDay;
      });
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      return {
        date: dateStr,
        revenue: dayBookings.reduce((sum, b) => sum + b.creditsCost, 0),
        bookings: dayBookings.length,
      };
    });

    return {
      period: { label, start: start.toISOString(), end: end.toISOString() },
      bookingRevenue,
      creditsConsumed,
      creditsRefunded,
      bookingCount,
      avgBookingValue,
      teamRepurchase,
      wallIdleSlots,
      dailyTrend,
    };
  },
};
