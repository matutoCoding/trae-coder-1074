import { store, generateId, formatDate } from '../data/store';
import { creditService } from './creditService';
import { occupancyService } from './occupancyService';
import { equipmentService } from './equipmentService';
import { wallLocks } from '../utils/lock';
import type { Booking, CreateBookingRequest, CreateBookingResponse } from '../../shared/types';

const calculateCredits = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  return hours * 10;
};

const resolvePackageBooking = (data: CreateBookingRequest): {
  creditsCost: number;
  equipmentRentals: { equipmentId: string; quantity: number }[];
  description: string;
} => {
  if (!data.packageId) {
    return {
      creditsCost: calculateCredits(data.startTime, data.endTime),
      equipmentRentals: data.equipmentRentals || [],
      description: '',
    };
  }

  const pkg = store.packages.find(p => p.id === data.packageId);
  if (!pkg) {
    return {
      creditsCost: calculateCredits(data.startTime, data.endTime),
      equipmentRentals: data.equipmentRentals || [],
      description: '',
    };
  }

  const peopleCount = data.peopleCount || pkg.peopleCount;
  const baseCredits = pkg.creditsPerPerson * peopleCount;
  const discountAmount = Math.round(baseCredits * pkg.creditDiscount);
  const creditsCost = baseCredits - discountAmount;

  const equipmentRentals = pkg.equipmentCombos.map(combo => ({
    equipmentId: combo.equipmentId,
    quantity: combo.quantityPerPerson * peopleCount,
  }));

  return {
    creditsCost,
    equipmentRentals,
    description: ` [${pkg.name} x${peopleCount}人]`,
  };
};

export const bookingService = {
  getAllBookings: (): Booking[] => {
    return [...store.bookings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getBookingById: (id: string): Booking | undefined => {
    return store.bookings.find(b => b.id === id);
  },

  getBookingsByTeam: (teamId: string): Booking[] => {
    return store.bookings
      .filter(b => b.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getBookingsByWall: (wallId: string): Booking[] => {
    return store.bookings
      .filter(b => b.wallId === wallId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  createBooking: async (
    data: CreateBookingRequest): Promise<{ success: boolean; data?: CreateBookingResponse; error?: string }> => {
    const teamId = data.teamId;
    const wallId = data.wallId;
    const startTime = data.startTime;
    const endTime = data.endTime;

    if (new Date(startTime) >= new Date(endTime)) {
      return { success: false, error: '结束时间必须晚于开始时间' };
    }

    const wall = store.walls.find(w => w.id === wallId);
    if (!wall) {
      return { success: false, error: '岩壁道不存在' };
    }
    if (wall.status !== 'active') {
      return { success: false, error: '该岩壁道当前不可预约' };
    }

    const team = store.teams.find(t => t.id === teamId);
    if (!team) {
      return { success: false, error: '团队不存在' };
    }

    const resolved = resolvePackageBooking(data);
    const creditsCost = resolved.creditsCost;
    const equipmentRentals = resolved.equipmentRentals;

    const wallRelease = await wallLocks.acquire(wallId);
    try {
      const hasOverlap = occupancyService.hasOverlap(
        wallId,
        new Date(startTime),
        new Date(endTime)
      );
      if (hasOverlap) {
        return { success: false, error: '该时段已被占用' };
      }

      const deductSuccess = await creditService.deductCredits(
        teamId,
        creditsCost,
        undefined,
        `预约 ${wall.name}${resolved.description}`
      );
      if (!deductSuccess) {
        return { success: false, error: '团队额度不足' };
      }

      try {
        const booking: Booking = {
          id: generateId(),
          teamId,
          wallId,
          startTime,
          endTime,
          creditsCost,
          status: 'confirmed',
          createdAt: formatDate(new Date()),
        };
        store.bookings.push(booking);

        const occupancy = occupancyService.createOccupancy(
          wallId,
          teamId,
          startTime,
          endTime,
          booking.id
        );

        let rentals;
        if (equipmentRentals.length > 0) {
          const rentResult = await equipmentService.batchRentEquipment(
            equipmentRentals,
            booking.id,
            teamId
          );
          if (!rentResult.success) {
            await creditService.refundCredits(teamId, creditsCost, booking.id, '装备不足退款');
            occupancyService.splitOccupancyByBooking(booking.id);
            const bookingIndex = store.bookings.findIndex(b => b.id === booking.id);
            if (bookingIndex !== -1) store.bookings.splice(bookingIndex, 1);
            return { success: false, error: rentResult.error || '装备租赁失败' };
          }
          rentals = rentResult.rentals;
        }

        return {
          success: true,
          data: { booking, occupancy, rentals },
        };
      } catch (err) {
        await creditService.refundCredits(teamId, creditsCost, undefined, '预约失败退款');
        throw err;
      }
    } finally {
      wallRelease();
    }
  },

  cancelBooking: async (
    bookingId: string
  ): Promise<{ success: boolean; data?: { refundAmount: number; newOccupancies: any[] }; error?: string }> => {
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: '预约不存在' };
    }
    if (booking.status === 'cancelled') {
      return { success: false, error: '预约已取消' };
    }

    const wallRelease = await wallLocks.acquire(booking.wallId);
    try {
      booking.status = 'cancelled';

      const newOccupancies = occupancyService.splitOccupancyByBooking(bookingId);

      await creditService.refundCredits(
        booking.teamId,
        booking.creditsCost,
        bookingId,
        '取消预约退款'
      );

      await equipmentService.batchReturnByBooking(bookingId);

      return {
        success: true,
        data: {
          refundAmount: booking.creditsCost,
          newOccupancies,
        },
      };
    } finally {
      wallRelease();
    }
  },

  getStats: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const confirmedBookings = store.bookings.filter(b => b.status === 'confirmed');

    const todayBookings = confirmedBookings.filter(b => {
      const start = new Date(b.startTime);
      return start >= today && start < tomorrow;
    });

    const weekBookings = confirmedBookings.filter(b => {
      const start = new Date(b.startTime);
      return start >= startOfWeek && start < endOfWeek;
    });

    const todayHours = todayBookings.reduce((sum, b) => {
      const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const weekHours = weekBookings.reduce((sum, b) => {
      const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const activeWalls = store.walls.filter(w => w.status === 'active');
    const todayWallCapacity = activeWalls.length * 13;
    const weekWallCapacity = activeWalls.length * 13 * 7;

    const todayUtilization = todayWallCapacity > 0 ? Math.round((todayHours / todayWallCapacity) * 100) : 0;
    const weekUtilization = weekWallCapacity > 0 ? Math.round((weekHours / weekWallCapacity) * 100) : 0;

    const wallBookingCount: Record<string, { count: number; hours: number; name: string }> = {};
    for (const b of confirmedBookings) {
      if (!wallBookingCount[b.wallId]) {
        const wall = store.walls.find(w => w.id === b.wallId);
        wallBookingCount[b.wallId] = { count: 0, hours: 0, name: wall?.name || '未知' };
      }
      wallBookingCount[b.wallId].count++;
      wallBookingCount[b.wallId].hours += (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
    }
    const popularWalls = Object.entries(wallBookingCount)
      .map(([wallId, data]) => ({ wallId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const teamConsumption: Record<string, { teamId: string; name: string; usedCredits: number; totalCredits: number }> = {};
    for (const t of store.teams) {
      teamConsumption[t.id] = { teamId: t.id, name: t.name, usedCredits: t.usedCredits, totalCredits: t.totalCredits };
    }
    const teamRanking = Object.values(teamConsumption)
      .sort((a, b) => b.usedCredits - a.usedCredits);

    const totalRentedOut = store.equipmentRentals.filter(r => !r.returnedAt)
      .reduce((sum, r) => sum + r.quantity, 0);

    const activeRentals = store.equipmentRentals.filter(r => !r.returnedAt).length;

    const totalCreditsUsed = store.teams.reduce((sum, t) => sum + t.usedCredits, 0);
    const totalCredits = store.teams.reduce((sum, t) => sum + t.totalCredits, 0);

    return {
      todayBookings: todayBookings.length,
      weekBookings: weekBookings.length,
      totalBookings: store.bookings.length,
      totalTeams: store.teams.length,
      activeWalls: activeWalls.length,
      totalCredits,
      usedCredits: totalCreditsUsed,
      availableCredits: totalCredits - totalCreditsUsed,
      activeRentals,
      todayUtilization,
      weekUtilization,
      popularWalls,
      teamRanking,
      totalRentedOut,
    };
  },
};
