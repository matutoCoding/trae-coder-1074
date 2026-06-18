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
    const equipmentRentals = data.equipmentRentals;

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

      const creditsCost = calculateCredits(startTime, endTime);

      const deductSuccess = await creditService.deductCredits(
        teamId,
        creditsCost,
        undefined,
        `预约 ${wall.name}`
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
        if (equipmentRentals && equipmentRentals.length > 0) {
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

    const todayBookings = store.bookings.filter(b => {
      const start = new Date(b.startTime);
      return start >= today && start < tomorrow && b.status === 'confirmed';
    });

    const totalCreditsUsed = store.teams.reduce((sum, t) => sum + t.usedCredits, 0);
    const totalCredits = store.teams.reduce((sum, t) => sum + t.totalCredits, 0);

    const activeWalls = store.walls.filter(w => w.status === 'active').length;

    const activeRentals = store.equipmentRentals.filter(r => !r.returnedAt).length;

    return {
      todayBookings: todayBookings.length,
      totalBookings: store.bookings.length,
      totalTeams: store.teams.length,
      activeWalls,
      totalCredits,
      usedCredits: totalCreditsUsed,
      availableCredits: totalCredits - totalCreditsUsed,
      activeRentals,
    };
  },
};
