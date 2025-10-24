import { parseISO } from "date-fns";
import type { Reservation, ConflictCheck, Table } from "@/types";
import { isWithinServiceHours, isoToSlotIndex } from "./time-utils";
import { TIMELINE_CONFIG } from "./constants";

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);

  // Ranges overlap if: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
}

/**
 * Check for conflicts when creating or moving a reservation
 */
export function checkReservationConflict(
  tableId: string,
  startTime: string,
  endTime: string,
  existingReservations: Reservation[],
  excludeReservationId?: string
): ConflictCheck {
  // Check if within service hours
  const startSlot = isoToSlotIndex(startTime);
  const endSlot = isoToSlotIndex(endTime);

  if (!isWithinServiceHours(startSlot) || !isWithinServiceHours(endSlot)) {
    return {
      hasConflict: true,
      conflictingReservationIds: [],
      reason: "outside_service_hours",
    };
  }

  // Find overlapping reservations on the same table
  const conflictingReservations = existingReservations.filter((res) => {
    // Skip if it's the same reservation (for updates)
    if (excludeReservationId && res.id === excludeReservationId) {
      return false;
    }

    // Check if on same table and times overlap
    return (
      res.tableId === tableId &&
      timeRangesOverlap(startTime, endTime, res.startTime, res.endTime)
    );
  });

  return {
    hasConflict: conflictingReservations.length > 0,
    conflictingReservationIds: conflictingReservations.map((r) => r.id),
    reason: conflictingReservations.length > 0 ? "overlap" : undefined,
  };
}

/**
 * Validate party size against table capacity
 */
export function validatePartySize(
  partySize: number,
  table: Table
): ConflictCheck {
  if (partySize < table.capacity.min || partySize > table.capacity.max) {
    return {
      hasConflict: true,
      conflictingReservationIds: [],
      reason: "capacity_exceeded",
    };
  }

  return {
    hasConflict: false,
    conflictingReservationIds: [],
  };
}

/**
 * Validate reservation duration
 */
export function validateDuration(durationMinutes: number): boolean {
  return (
    durationMinutes >= TIMELINE_CONFIG.MIN_DURATION_MINUTES &&
    durationMinutes <= TIMELINE_CONFIG.MAX_DURATION_MINUTES &&
    durationMinutes % TIMELINE_CONFIG.SLOT_MINUTES === 0
  );
}

/**
 * Check if a reservation can be dropped at a specific position
 */
export function canDropReservation(
  reservation: Reservation,
  newTableId: string,
  newStartTime: string,
  newEndTime: string,
  allReservations: Reservation[],
  tables: Table[]
): { canDrop: boolean; reason?: string } {
  // Find the table
  const table = tables.find((t) => t.id === newTableId);
  if (!table) {
    return { canDrop: false, reason: "Table not found" };
  }

  // Validate capacity
  const capacityCheck = validatePartySize(reservation.partySize, table);
  if (capacityCheck.hasConflict) {
    return {
      canDrop: false,
      reason: `Party size ${reservation.partySize} exceeds table capacity (${table.capacity.min}-${table.capacity.max})`,
    };
  }

  // Check for conflicts
  const conflictCheck = checkReservationConflict(
    newTableId,
    newStartTime,
    newEndTime,
    allReservations,
    reservation.id
  );

  if (conflictCheck.hasConflict) {
    if (conflictCheck.reason === "outside_service_hours") {
      return { canDrop: false, reason: "Outside service hours" };
    }
    return {
      canDrop: false,
      reason: "Time slot conflicts with another reservation",
    };
  }

  return { canDrop: true };
}
