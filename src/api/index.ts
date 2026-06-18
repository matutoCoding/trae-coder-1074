import type {
  Wall,
  Team,
  Booking,
  Occupancy,
  CreditLog,
  Equipment,
  EquipmentRental,
  CreateBookingRequest,
  CreateBookingResponse,
} from '../../shared/types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data: ApiResponse<T> = await res.json();
  
  if (!data.success || !res.ok) {
    throw new Error(data.error || '请求失败');
  }
  
  return data.data as T;
}

export const api = {
  walls: {
    getAll: () => request<Wall[]>('/walls'),
    getById: (id: string) => request<Wall>(`/walls/${id}`),
    create: (data: Omit<Wall, 'id'>) => 
      request<Wall>('/walls', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Wall>) =>
      request<Wall>(`/walls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/walls/${id}`, { method: 'DELETE' }),
  },

  bookings: {
    getAll: (params?: { teamId?: string; wallId?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request<Booking[]>(`/bookings${query}`);
    },
    getById: (id: string) => request<Booking>(`/bookings/${id}`),
    getStats: () => request<any>('/bookings/stats'),
    create: (data: CreateBookingRequest) =>
      request<CreateBookingResponse>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancel: (id: string) =>
      request<{ refundAmount: number }>(`/bookings/${id}`, { method: 'DELETE' }),
  },

  occupancies: {
    getAll: (params?: { wallId?: string; teamId?: string; date?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request<Occupancy[]>(`/occupancies${query}`);
    },
    checkAvailability: (wallId: string, startTime: string, endTime: string) =>
      request<{ available: boolean }>(
        `/occupancies/check?wallId=${wallId}&startTime=${startTime}&endTime=${endTime}`
      ),
    getAvailableSlots: (wallId: string, date: string, duration?: number) =>
      request<{ start: string; end: string }[]>(
        `/occupancies/available-slots?wallId=${wallId}&date=${date}&duration=${duration || 1}`
      ),
  },

  teams: {
    getAll: () => request<Team[]>('/teams'),
    getById: (id: string) => request<Team>(`/teams/${id}`),
    create: (name: string, initialCredits: number = 0) =>
      request<Team>('/teams', {
        method: 'POST',
        body: JSON.stringify({ name, initialCredits }),
      }),
    getCredits: (id: string) =>
      request<{ total: number; used: number; available: number }>(`/teams/${id}/credits`),
    recharge: (id: string, amount: number, description?: string) =>
      request<Team>(`/teams/${id}/credits/recharge`, {
        method: 'POST',
        body: JSON.stringify({ amount, description }),
      }),
    getCreditLogs: (id: string, limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return request<CreditLog[]>(`/teams/${id}/credit-logs${query}`);
    },
  },

  equipment: {
    getAll: (params?: { type?: string }) => {
      const query = params?.type ? `?type=${params.type}` : '';
      return request<Equipment[]>(`/equipment${query}`);
    },
    getById: (id: string) => request<Equipment>(`/equipment/${id}`),
    create: (data: Omit<Equipment, 'id'>) =>
      request<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Equipment>) =>
      request<Equipment>(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/equipment/${id}`, { method: 'DELETE' }),
    getActiveRentals: () => request<EquipmentRental[]>('/equipment/rentals/active'),
    getAllRentals: (params?: { teamId?: string; equipmentType?: string; status?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request<EquipmentRental[]>(`/equipment/rentals/all${query}`);
    },
    rent: (data: { equipmentId: string; bookingId: string; teamId: string; quantity: number }) =>
      request<EquipmentRental>('/equipment/rentals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    returnRental: (id: string) =>
      request<EquipmentRental>(`/equipment/rentals/${id}/return`, { method: 'POST' }),
    getRentalsByBooking: (bookingId: string) =>
      request<EquipmentRental[]>(`/equipment/rentals/booking/${bookingId}`),
    getRentalsByTeam: (teamId: string) =>
      request<EquipmentRental[]>(`/equipment/rentals/team/${teamId}`),
  },
};
