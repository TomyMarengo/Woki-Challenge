import type { Sector, Table, Reservation } from '@/types';

export const SEED_DATE = '2025-10-22';

export const sectors: Sector[] = [
  { id: 'S1', name: 'Main Hall', color: '#3B82F6', sortOrder: 0 },
  { id: 'S2', name: 'Terrace', color: '#10B981', sortOrder: 1 },
  { id: 'S3', name: 'Private Room', color: '#F59E0B', sortOrder: 2 },
];

export const tables: Table[] = [
  // Main Hall
  { id: 'T1', sectorId: 'S1', name: 'Table 1', capacity: { min: 2, max: 2 }, sortOrder: 0 },
  { id: 'T2', sectorId: 'S1', name: 'Table 2', capacity: { min: 2, max: 4 }, sortOrder: 1 },
  { id: 'T3', sectorId: 'S1', name: 'Table 3', capacity: { min: 4, max: 6 }, sortOrder: 2 },
  { id: 'T4', sectorId: 'S1', name: 'Table 4', capacity: { min: 2, max: 4 }, sortOrder: 3 },
  { id: 'T5', sectorId: 'S1', name: 'Table 5', capacity: { min: 4, max: 6 }, sortOrder: 4 },
  
  // Terrace
  { id: 'T6', sectorId: 'S2', name: 'Table 6', capacity: { min: 2, max: 4 }, sortOrder: 0 },
  { id: 'T7', sectorId: 'S2', name: 'Table 7', capacity: { min: 4, max: 8 }, sortOrder: 1 },
  { id: 'T8', sectorId: 'S2', name: 'Table 8', capacity: { min: 2, max: 2 }, sortOrder: 2 },
  
  // Private Room
  { id: 'T9', sectorId: 'S3', name: 'Table 9', capacity: { min: 6, max: 10 }, sortOrder: 0 },
  { id: 'T10', sectorId: 'S3', name: 'Table 10', capacity: { min: 8, max: 12 }, sortOrder: 1 },
];

export const initialReservations: Reservation[] = [
  {
    id: 'RES_001',
    tableId: 'T1',
    customer: { name: 'John Doe', phone: '+1 555-0101', email: 'john@example.com' },
    partySize: 2,
    startTime: '2025-10-22T12:00:00-03:00',
    endTime: '2025-10-22T13:30:00-03:00',
    durationMinutes: 90,
    status: 'CONFIRMED',
    priority: 'STANDARD',
    source: 'web',
    createdAt: '2025-10-21T10:00:00-03:00',
    updatedAt: '2025-10-21T10:00:00-03:00',
  },
  {
    id: 'RES_002',
    tableId: 'T3',
    customer: { name: 'Jane Smith', phone: '+1 555-0102', email: 'jane@example.com' },
    partySize: 6,
    startTime: '2025-10-22T13:00:00-03:00',
    endTime: '2025-10-22T14:30:00-03:00',
    durationMinutes: 90,
    status: 'SEATED',
    priority: 'VIP',
    notes: 'Birthday celebration',
    source: 'phone',
    createdAt: '2025-10-22T12:30:00-03:00',
    updatedAt: '2025-10-22T13:05:00-03:00',
  },
  {
    id: 'RES_003',
    tableId: 'T7',
    customer: { name: 'Robert Johnson', phone: '+1 555-0103' },
    partySize: 8,
    startTime: '2025-10-22T20:00:00-03:00',
    endTime: '2025-10-22T21:30:00-03:00',
    durationMinutes: 90,
    status: 'CONFIRMED',
    priority: 'LARGE_GROUP',
    source: 'app',
    createdAt: '2025-10-20T14:00:00-03:00',
    updatedAt: '2025-10-20T14:00:00-03:00',
  },
  {
    id: 'RES_004',
    tableId: 'T2',
    customer: { name: 'Emily Davis', phone: '+1 555-0104', email: 'emily@example.com' },
    partySize: 4,
    startTime: '2025-10-22T19:00:00-03:00',
    endTime: '2025-10-22T20:30:00-03:00',
    durationMinutes: 90,
    status: 'PENDING',
    priority: 'STANDARD',
    source: 'web',
    createdAt: '2025-10-22T08:00:00-03:00',
    updatedAt: '2025-10-22T08:00:00-03:00',
  },
  {
    id: 'RES_005',
    tableId: 'T9',
    customer: { name: 'Michael Brown', phone: '+1 555-0105' },
    partySize: 10,
    startTime: '2025-10-22T21:00:00-03:00',
    endTime: '2025-10-22T23:00:00-03:00',
    durationMinutes: 120,
    status: 'CONFIRMED',
    priority: 'LARGE_GROUP',
    notes: 'Corporate dinner',
    source: 'phone',
    createdAt: '2025-10-19T16:00:00-03:00',
    updatedAt: '2025-10-19T16:00:00-03:00',
  },
];


