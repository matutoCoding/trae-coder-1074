import { store, generateId } from '../data/store';
import type { Occupancy, Booking } from '../../shared/types';

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const isContinuous = (end1: Date, start2: Date): boolean => {
  return Math.abs(end1.getTime() - start2.getTime()) < 1000;
};

const sortByStartTime = (occupancies: Occupancy[]): Occupancy[] => {
  return [...occupancies].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
};

const mergeAdjacentOccupancies = (wallId: string, teamId: string): void => {
  const wallTeamOccs = store.occupancies.filter(
    o => o.wallId === wallId && o.teamId === teamId
  );
  
  if (wallTeamOccs.length < 2) return;
  
  const sorted = sortByStartTime(wallTeamOccs);
  const merged: Occupancy[] = [];
  let current = { ...sorted[0] };
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const currentEnd = new Date(current.endTime);
    const nextStart = new Date(next.startTime);
    
    if (isContinuous(currentEnd, nextStart) || currentEnd > nextStart) {
      current.endTime = new Date(
        Math.max(new Date(current.endTime).getTime(), new Date(next.endTime).getTime())
      ).toISOString();
      current.bookingIds = [...new Set([...current.bookingIds, ...next.bookingIds])];
      current.isMerged = true;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  
  store.occupancies = store.occupancies.filter(
    o => !(o.wallId === wallId && o.teamId === teamId)
  );
  store.occupancies.push(...merged);
};

export const occupancyService = {
  getAllOccupancies: (): Occupancy[] => {
    return [...store.occupancies];
  },

  getOccupanciesByWall: (wallId: string): Occupancy[] => {
    return store.occupancies.filter(o => o.wallId === wallId);
  },

  getOccupanciesByDate: (date: Date): Occupancy[] => {
    return store.occupancies.filter(o => 
      isSameDay(new Date(o.startTime), date)
    );
  },

  getOccupanciesByWallAndDate: (wallId: string, date: Date): Occupancy[] => {
    return store.occupancies.filter(o => 
      o.wallId === wallId && isSameDay(new Date(o.startTime), date)
    );
  },

  getOccupanciesByTeam: (teamId: string): Occupancy[] => {
    return store.occupancies.filter(o => o.teamId === teamId);
  },

  hasOverlap: (
    wallId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeBookingIds: string[] = []
  ): boolean => {
    const occupancies = store.occupancies.filter(o => {
      if (o.wallId !== wallId) return false;
      if (excludeBookingIds.length > 0 && o.bookingIds.every(id => excludeBookingIds.includes(id))) {
        return false;
      }
      
      const oStart = new Date(o.startTime);
      const oEnd = new Date(o.endTime);
      
      return startTime < oEnd && endTime > oStart;
    });
    
    return occupancies.length > 0;
  },

  createOccupancy: (
    wallId: string,
    teamId: string,
    startTime: string,
    endTime: string,
    bookingId: string
  ): Occupancy => {
    const occupancy: Occupancy = {
      id: generateId(),
      wallId,
      teamId,
      startTime,
      endTime,
      bookingIds: [bookingId],
      isMerged: false,
    };
    store.occupancies.push(occupancy);
    
    mergeAdjacentOccupancies(wallId, teamId);
    
    const merged = store.occupancies.find(o => 
      o.wallId === wallId && o.teamId === teamId && o.bookingIds.includes(bookingId)
    );
    
    return merged || occupancy;
  },

  splitOccupancyByBooking: (bookingId: string): Occupancy[] => {
    const occupancy = store.occupancies.find(o => o.bookingIds.includes(bookingId));
    if (!occupancy) return [];
    
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) return [];
    
    if (!occupancy.isMerged || occupancy.bookingIds.length === 1) {
      const index = store.occupancies.findIndex(o => o.id === occupancy.id);
      if (index !== -1) {
        store.occupancies.splice(index, 1);
      }
      return [];
    }
    
    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);
    
    const otherBookings = store.bookings.filter(
      b => b.id !== bookingId && occupancy.bookingIds.includes(b.id)
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    const segments: { start: Date; end: Date; bookingIds: string[] }[] = [];
    let currentSegment: { start: Date; end: Date; bookingIds: string[] } | null = null;
    
    for (const b of otherBookings) {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      
      if (bStart >= bookingEnd || bEnd <= bookingStart) {
        if (!currentSegment) {
          currentSegment = { start: bStart, end: bEnd, bookingIds: [b.id] };
        } else if (isContinuous(currentSegment.end, bStart)) {
          currentSegment.end = bEnd;
          currentSegment.bookingIds.push(b.id);
        } else {
          segments.push(currentSegment);
          currentSegment = { start: bStart, end: bEnd, bookingIds: [b.id] };
        }
      }
    }
    
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    const index = store.occupancies.findIndex(o => o.id === occupancy.id);
    if (index !== -1) {
      store.occupancies.splice(index, 1);
    }
    
    const newOccupancies: Occupancy[] = segments.map(seg => ({
      id: generateId(),
      wallId: occupancy.wallId,
      teamId: occupancy.teamId,
      startTime: seg.start.toISOString(),
      endTime: seg.end.toISOString(),
      bookingIds: seg.bookingIds,
      isMerged: seg.bookingIds.length > 1,
    }));
    
    store.occupancies.push(...newOccupancies);
    
    return newOccupancies;
  },

  removeOccupancy: (id: string): boolean => {
    const index = store.occupancies.findIndex(o => o.id === id);
    if (index === -1) return false;
    store.occupancies.splice(index, 1);
    return true;
  },

  getOccupancyByBookingId: (bookingId: string): Occupancy | undefined => {
    return store.occupancies.find(o => o.bookingIds.includes(bookingId));
  },
};
