// Domain Types for Reservation Timeline

export type ReservationStatus =
  | "PENDING" // Awaiting confirmation
  | "CONFIRMED" // Confirmed, not yet seated
  | "SEATED" // Currently at the table
  | "FINISHED" // Completed
  | "NO_SHOW" // Didn't arrive
  | "CANCELLED"; // Cancelled

export type Priority = "STANDARD" | "VIP" | "LARGE_GROUP";

export interface Sector {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Table {
  id: string;
  sectorId: string;
  name: string;
  capacity: {
    min: number;
    max: number;
  };
  sortOrder: number; // for Y-axis ordering
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  tableId: string;
  customer: Customer;
  partySize: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ReservationStatus;
  priority: Priority;
  notes?: string;
  source?: string; // 'phone', 'web', 'walkin', 'app'
  createdAt: string;
  updatedAt: string;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingReservationIds: string[];
  reason?: "overlap" | "capacity_exceeded" | "outside_service_hours";
}
