import { store, generateId, formatDate } from '../data/store';
import { equipmentLocks } from '../utils/lock';
import type { Equipment, EquipmentRental, EquipmentType } from '../../shared/types';

export const equipmentService = {
  getAllEquipment: (): Equipment[] => {
    return [...store.equipment];
  },

  getEquipmentById: (id: string): Equipment | undefined => {
    return store.equipment.find(e => e.id === id);
  },

  getEquipmentByType: (type: EquipmentType): Equipment[] => {
    return store.equipment.filter(e => e.type === type && e.status === 'active');
  },

  createEquipment: (data: Omit<Equipment, 'id'>): Equipment => {
    const equipment: Equipment = {
      ...data,
      id: generateId(),
    };
    store.equipment.push(equipment);
    return equipment;
  },

  updateEquipment: (id: string, data: Partial<Omit<Equipment, 'id'>>): Equipment | undefined => {
    const index = store.equipment.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    store.equipment[index] = { ...store.equipment[index], ...data };
    return store.equipment[index];
  },

  deleteEquipment: (id: string): boolean => {
    const index = store.equipment.findIndex(e => e.id === id);
    if (index === -1) return false;
    store.equipment.splice(index, 1);
    return true;
  },

  checkAvailability: (equipmentId: string, quantity: number): boolean => {
    const equipment = store.equipment.find(e => e.id === equipmentId);
    if (!equipment) return false;
    return equipment.available >= quantity;
  },

  rentEquipment: async (
    equipmentId: string,
    bookingId: string,
    teamId: string,
    quantity: number
  ): Promise<EquipmentRental | null> => {
    const release = await equipmentLocks.acquire(equipmentId);
    try {
      const equipment = store.equipment.find(e => e.id === equipmentId);
      if (!equipment || equipment.available < quantity) {
        return null;
      }

      equipment.available -= quantity;

      const rental: EquipmentRental = {
        id: generateId(),
        equipmentId,
        bookingId,
        teamId,
        quantity,
        rentedAt: formatDate(new Date()),
      };
      store.equipmentRentals.push(rental);

      return rental;
    } finally {
      release();
    }
  },

  returnEquipment: async (rentalId: string): Promise<EquipmentRental | null> => {
    const rental = store.equipmentRentals.find(r => r.id === rentalId);
    if (!rental || rental.returnedAt) return null;

    const release = await equipmentLocks.acquire(rental.equipmentId);
    try {
      const equipment = store.equipment.find(e => e.id === rental.equipmentId);
      if (!equipment) return null;

      equipment.available = Math.min(equipment.total, equipment.available + rental.quantity);
      rental.returnedAt = formatDate(new Date());

      return rental;
    } finally {
      release();
    }
  },

  getRentalsByBooking: (bookingId: string): EquipmentRental[] => {
    return store.equipmentRentals.filter(r => r.bookingId === bookingId);
  },

  getRentalsByTeam: (teamId: string): EquipmentRental[] => {
    return store.equipmentRentals.filter(r => r.teamId === teamId);
  },

  getActiveRentals: (): EquipmentRental[] => {
    return store.equipmentRentals.filter(r => !r.returnedAt);
  },

  batchRentEquipment: async (
    items: { equipmentId: string; quantity: number }[],
    bookingId: string,
    teamId: string
  ): Promise<{ success: boolean; rentals?: EquipmentRental[]; error?: string }> => {
    for (const item of items) {
      const equipment = store.equipment.find(e => e.id === item.equipmentId);
      if (!equipment || equipment.available < item.quantity) {
        return {
          success: false,
          error: `装备 ${equipment?.name || item.equipmentId} 库存不足`,
        };
      }
    }

    const rentals: EquipmentRental[] = [];
    for (const item of items) {
      const release = await equipmentLocks.acquire(item.equipmentId);
      try {
        const equipment = store.equipment.find(e => e.id === item.equipmentId);
        if (!equipment || equipment.available < item.quantity) {
          continue;
        }

        equipment.available -= item.quantity;

        const rental: EquipmentRental = {
          id: generateId(),
          equipmentId: item.equipmentId,
          bookingId,
          teamId,
          quantity: item.quantity,
          rentedAt: formatDate(new Date()),
        };
        store.equipmentRentals.push(rental);
        rentals.push(rental);
      } finally {
        release();
      }
    }

    return { success: true, rentals };
  },

  batchReturnByBooking: async (bookingId: string): Promise<EquipmentRental[]> => {
    const rentals = store.equipmentRentals.filter(r => r.bookingId === bookingId && !r.returnedAt);
    const returned: EquipmentRental[] = [];
    
    for (const rental of rentals) {
      const release = await equipmentLocks.acquire(rental.equipmentId);
      try {
        const equipment = store.equipment.find(e => e.id === rental.equipmentId);
        if (!equipment) continue;

        equipment.available = Math.min(equipment.total, equipment.available + rental.quantity);
        rental.returnedAt = formatDate(new Date());
        returned.push(rental);
      } finally {
        release();
      }
    }
    
    return returned;
  },
};
