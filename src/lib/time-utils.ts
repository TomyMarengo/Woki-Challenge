import { parseISO, format, setHours, setMinutes } from "date-fns";
import { TIMELINE_CONFIG, TOTAL_SLOTS } from "./constants";

/**
 * Convert a time string (HH:mm) to slot index
 * Example: "12:00" -> slot 4 (if start is 11:00)
 */
export function timeToSlotIndex(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = TIMELINE_CONFIG.START_HOUR * 60;
  const slotIndex = Math.floor(
    (totalMinutes - startMinutes) / TIMELINE_CONFIG.SLOT_MINUTES
  );
  return Math.max(0, Math.min(slotIndex, TOTAL_SLOTS - 1));
}

/**
 * Convert slot index to time string (HH:mm)
 */
export function slotIndexToTime(slotIndex: number): string {
  const totalMinutes =
    TIMELINE_CONFIG.START_HOUR * 60 + slotIndex * TIMELINE_CONFIG.SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

/**
 * Convert ISO datetime to slot index
 */
export function isoToSlotIndex(isoDateTime: string): number {
  const date = parseISO(isoDateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
  return timeToSlotIndex(time);
}

/**
 * Format ISO datetime to display time (HH:mm)
 */
export function formatTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), "HH:mm");
}

/**
 * Format ISO datetime to display date
 */
export function formatDate(isoDateTime: string): string {
  return format(parseISO(isoDateTime), "MMM dd, yyyy");
}

/**
 * Format time range
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Create ISO datetime from date string and slot index
 */
export function slotToISODateTime(date: string, slotIndex: number): string {
  const baseDate = new Date(date + "T00:00:00-03:00");
  const totalMinutes =
    TIMELINE_CONFIG.START_HOUR * 60 + slotIndex * TIMELINE_CONFIG.SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const result = setMinutes(setHours(baseDate, hours), minutes);

  return format(result, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

/**
 * Check if a time is within service hours
 */
export function isWithinServiceHours(slotIndex: number): boolean {
  return slotIndex >= 0 && slotIndex < TOTAL_SLOTS;
}

/**
 * Get current time slot index
 */
export function getCurrentSlotIndex(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours < TIMELINE_CONFIG.START_HOUR) return -1;
  if (hours >= TIMELINE_CONFIG.END_HOUR) return TOTAL_SLOTS;

  const totalMinutes = hours * 60 + minutes;
  const startMinutes = TIMELINE_CONFIG.START_HOUR * 60;
  return Math.floor(
    (totalMinutes - startMinutes) / TIMELINE_CONFIG.SLOT_MINUTES
  );
}

/**
 * Snap duration to valid range
 */
export function snapDuration(durationMinutes: number): number {
  return Math.max(
    TIMELINE_CONFIG.MIN_DURATION_MINUTES,
    Math.min(
      TIMELINE_CONFIG.MAX_DURATION_MINUTES,
      Math.round(durationMinutes / TIMELINE_CONFIG.SLOT_MINUTES) *
        TIMELINE_CONFIG.SLOT_MINUTES
    )
  );
}
