import { create } from 'zustand';
import type {
  Wall,
  Team,
  Booking,
  Occupancy,
  CreditLog,
  Equipment,
  EquipmentRental,
} from '../../shared/types';
import { api } from '../api';

interface AppState {
  walls: Wall[];
  teams: Team[];
  bookings: Booking[];
  occupancies: Occupancy[];
  equipment: Equipment[];
  rentals: EquipmentRental[];
  allRentals: EquipmentRental[];
  creditLogs: CreditLog[];
  stats: any;
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;

  fetchWalls: () => Promise<void>;
  fetchTeams: () => Promise<void>;
  fetchBookings: (params?: { teamId?: string; wallId?: string }) => Promise<void>;
  fetchOccupancies: (params?: { wallId?: string; teamId?: string; date?: string }) => Promise<void>;
  fetchEquipment: () => Promise<void>;
  fetchRentals: () => Promise<void>;
  fetchAllRentals: (params?: { teamId?: string; equipmentType?: string; status?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCreditLogs: (teamId: string) => Promise<void>;
  fetchAvailableSlots: (wallId: string, date: string, duration?: number) => Promise<{ start: string; end: string }[]>;

  createWall: (data: Omit<Wall, 'id'>) => Promise<Wall>;
  updateWall: (id: string, data: Partial<Wall>) => Promise<Wall | undefined>;
  deleteWall: (id: string) => Promise<boolean>;

  createTeam: (name: string, initialCredits?: number) => Promise<Team>;
  rechargeCredits: (teamId: string, amount: number, description?: string) => Promise<Team | undefined>;

  createBooking: (data: any) => Promise<any>;
  cancelBooking: (id: string) => Promise<{ refundAmount: number } | undefined>;

  createEquipment: (data: Omit<Equipment, 'id'>) => Promise<Equipment>;
  returnRental: (id: string) => Promise<EquipmentRental | undefined>;

  setSelectedTeam: (team: Team | null) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  walls: [],
  teams: [],
  bookings: [],
  occupancies: [],
  equipment: [],
  rentals: [],
  allRentals: [],
  creditLogs: [],
  stats: null,
  selectedTeam: null,
  loading: false,
  error: null,

  fetchWalls: async () => {
    try {
      set({ loading: true });
      const walls = await api.walls.getAll();
      set({ walls });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTeams: async () => {
    try {
      set({ loading: true });
      const teams = await api.teams.getAll();
      const currentSelected = get().selectedTeam;
      let updatedSelected = currentSelected;
      if (currentSelected) {
        const fresh = teams.find((t: Team) => t.id === currentSelected.id);
        if (fresh) {
          updatedSelected = fresh;
        }
      } else if (teams.length > 0) {
        updatedSelected = teams[0];
      }
      set({ teams, selectedTeam: updatedSelected });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchBookings: async (params) => {
    try {
      set({ loading: true });
      const bookings = await api.bookings.getAll(params);
      set({ bookings });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchOccupancies: async (params) => {
    try {
      set({ loading: true });
      const occupancies = await api.occupancies.getAll(params);
      set({ occupancies });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchEquipment: async () => {
    try {
      set({ loading: true });
      const equipment = await api.equipment.getAll();
      set({ equipment });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRentals: async () => {
    try {
      const rentals = await api.equipment.getActiveRentals();
      set({ rentals });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchAllRentals: async (params) => {
    try {
      const allRentals = await api.equipment.getAllRentals(params);
      set({ allRentals });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.bookings.getStats();
      set({ stats });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchCreditLogs: async (teamId) => {
    try {
      const logs = await api.teams.getCreditLogs(teamId);
      set({ creditLogs: logs });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchAvailableSlots: async (wallId, date, duration) => {
    try {
      const slots = await api.occupancies.getAvailableSlots(wallId, date, duration);
      return slots;
    } catch (err: any) {
      set({ error: err.message });
      return [];
    }
  },

  createWall: async (data) => {
    const wall = await api.walls.create(data);
    set((state) => ({ walls: [...state.walls, wall] }));
    return wall;
  },

  updateWall: async (id, data) => {
    const wall = await api.walls.update(id, data);
    if (wall) {
      set((state) => ({
        walls: state.walls.map((w) => (w.id === id ? wall : w)),
      }));
    }
    return wall;
  },

  deleteWall: async (id) => {
    try {
      await api.walls.delete(id);
      set((state) => ({ walls: state.walls.filter((w) => w.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  createTeam: async (name, initialCredits = 0) => {
    const team = await api.teams.create(name, initialCredits);
    set((state) => ({ teams: [...state.teams, team] }));
    return team;
  },

  rechargeCredits: async (teamId, amount, description) => {
    try {
      const team = await api.teams.recharge(teamId, amount, description);
      if (team) {
        set((state) => ({
          teams: state.teams.map((t) => (t.id === teamId ? team : t)),
          selectedTeam: state.selectedTeam?.id === teamId ? team : state.selectedTeam,
        }));
        get().fetchCreditLogs(teamId);
      }
      return team;
    } catch {
      return undefined;
    }
  },

  createBooking: async (data) => {
    const result = await api.bookings.create(data);
    get().fetchBookings();
    get().fetchOccupancies({ wallId: data.wallId });
    get().fetchTeams();
    get().fetchStats();
    get().fetchRentals();
    get().fetchEquipment();
    return result;
  },

  cancelBooking: async (id) => {
    try {
      const result = await api.bookings.cancel(id);
      get().fetchBookings();
      get().fetchOccupancies();
      get().fetchTeams();
      get().fetchStats();
      get().fetchEquipment();
      get().fetchRentals();
      return result;
    } catch {
      return undefined;
    }
  },

  createEquipment: async (data) => {
    const equipment = await api.equipment.create(data);
    set((state) => ({ equipment: [...state.equipment, equipment] }));
    return equipment;
  },

  returnRental: async (id) => {
    try {
      const rental = await api.equipment.returnRental(id);
      get().fetchEquipment();
      get().fetchRentals();
      return rental;
    } catch {
      return undefined;
    }
  },

  setSelectedTeam: (team) => set({ selectedTeam: team }),
  setError: (error) => set({ error }),
}));
