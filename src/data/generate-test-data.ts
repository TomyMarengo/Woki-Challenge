import { v4 as uuidv4 } from "uuid";
import { addMinutes } from "date-fns";
import type { Reservation, ReservationStatus, Priority } from "@/types";

const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Emily",
  "David",
  "Sarah",
  "Robert",
  "Lisa",
  "James",
  "Mary",
  "William",
  "Patricia",
  "Richard",
  "Jennifer",
  "Thomas",
  "Linda",
  "Charles",
  "Barbara",
  "Daniel",
  "Susan",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
];

const statuses: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "FINISHED",
  "NO_SHOW",
  "CANCELLED",
];
const priorities: Priority[] = ["STANDARD", "VIP", "LARGE_GROUP"];
const sources = ["phone", "web", "walkin", "app"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber(): string {
  return `+1 ${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(
    1000,
    9999
  )}`;
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
}

/**
 * Generate random reservations for testing performance
 * @param tableIds - Array of table IDs to assign reservations to
 * @param count - Number of reservations to generate
 * @param date - Date string in format 'YYYY-MM-DD'
 * @returns Array of generated reservations
 */
export function generateTestReservations(
  tableIds: string[],
  count: number,
  date: string = "2025-10-22"
): Reservation[] {
  const reservations: Reservation[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const tableId = randomChoice(tableIds);

    // Random start time between 11:00 and 23:00 (on 15-minute boundaries)
    const startHour = randomInt(11, 22);
    const startMinute = randomChoice([0, 15, 30, 45]);

    // Random duration between 60 and 180 minutes (in 15-minute increments)
    const durationMinutes = randomChoice([
      60, 75, 90, 105, 120, 135, 150, 165, 180,
    ]);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = addMinutes(startTime, durationMinutes);

    // Adjust timezone to match seed data (Buenos Aires -03:00)
    const formatWithTZ = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
    };

    const partySize = randomInt(1, 10);
    const status = randomChoice(statuses);
    const priority = partySize >= 6 ? "LARGE_GROUP" : randomChoice(priorities);

    const createdAt = new Date(date);
    createdAt.setDate(createdAt.getDate() - randomInt(0, 7));
    createdAt.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);

    reservations.push({
      id: `RES_GEN_${uuidv4()}`,
      tableId,
      customer: {
        name: `${firstName} ${lastName}`,
        phone: generatePhoneNumber(),
        email:
          Math.random() > 0.3 ? generateEmail(firstName, lastName) : undefined,
        notes:
          Math.random() > 0.8
            ? "Special request: " +
              randomChoice([
                "Window seat",
                "Quiet area",
                "Birthday",
                "Anniversary",
              ])
            : undefined,
      },
      partySize,
      startTime: formatWithTZ(startTime),
      endTime: formatWithTZ(endTime),
      durationMinutes,
      status,
      priority,
      notes:
        Math.random() > 0.7
          ? randomChoice([
              "VIP guest",
              "Regular customer",
              "First time visitor",
              "Corporate client",
            ])
          : undefined,
      source: randomChoice(sources),
      createdAt: formatWithTZ(createdAt),
      updatedAt: formatWithTZ(createdAt),
    });
  }

  return reservations;
}

/**
 * Generate a specific number of reservations distributed across time slots
 * Attempts to minimize conflicts by spreading reservations across available tables and times
 */
export function generateBalancedReservations(
  tableIds: string[],
  count: number,
  date: string = "2025-10-22"
): Reservation[] {
  const reservations: Reservation[] = [];
  const timeSlots = [];

  // Generate time slots from 11:00 to 23:00 in 15-minute increments
  for (let hour = 11; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }

  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const tableId = tableIds[i % tableIds.length]; // Distribute across tables

    const timeSlot = timeSlots[i % timeSlots.length]; // Distribute across time slots
    const durationMinutes = 90; // Standard duration

    const startTime = new Date(date);
    startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

    const endTime = addMinutes(startTime, durationMinutes);

    const formatWithTZ = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
    };

    const partySize = randomInt(2, 6);
    const createdAt = new Date(date);
    createdAt.setDate(createdAt.getDate() - 1);

    reservations.push({
      id: `RES_BAL_${uuidv4()}`,
      tableId,
      customer: {
        name: `${firstName} ${lastName}`,
        phone: generatePhoneNumber(),
        email: generateEmail(firstName, lastName),
      },
      partySize,
      startTime: formatWithTZ(startTime),
      endTime: formatWithTZ(endTime),
      durationMinutes,
      status: "CONFIRMED",
      priority: "STANDARD",
      source: "web",
      createdAt: formatWithTZ(createdAt),
      updatedAt: formatWithTZ(createdAt),
    });
  }

  return reservations;
}
