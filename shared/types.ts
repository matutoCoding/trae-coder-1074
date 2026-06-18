export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type WallType = 'bouldering' | 'lead' | 'top-rope' | 'speed';

export interface Wall {
  id: string;
  name: string;
  difficulty: DifficultyLevel;
  height: number;
  type: WallType;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface Team {
  id: string;
  name: string;
  totalCredits: number;
  usedCredits: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type CreditLogType = 'consume' | 'recharge' | 'refund';

export interface CreditLog {
  id: string;
  teamId: string;
  amount: number;
  type: CreditLogType;
  bookingId?: string;
  description: string;
  createdAt: string;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  teamId: string;
  wallId: string;
  startTime: string;
  endTime: string;
  creditsCost: number;
  status: BookingStatus;
  createdAt: string;
}

export interface Occupancy {
  id: string;
  wallId: string;
  teamId: string;
  startTime: string;
  endTime: string;
  bookingIds: string[];
  isMerged: boolean;
}

export type EquipmentType = 'harness' | 'shoes' | 'helmet' | 'chalk-bag' | 'rope';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  total: number;
  available: number;
  status: 'active' | 'maintenance';
}

export interface EquipmentRental {
  id: string;
  equipmentId: string;
  bookingId: string;
  teamId: string;
  quantity: number;
  rentedAt: string;
  returnedAt?: string;
}

export interface CreateBookingRequest {
  teamId: string;
  wallId: string;
  startTime: string;
  endTime: string;
  equipmentRentals?: { equipmentId: string; quantity: number }[];
}

export interface CreateBookingResponse {
  booking: Booking;
  occupancy: Occupancy;
  rentals?: EquipmentRental[];
}
