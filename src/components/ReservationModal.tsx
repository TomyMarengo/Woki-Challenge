"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Reservation, ReservationStatus, Priority } from "@/types";
import { useTimelineStore } from "@/store/timeline-store";
import { slotToISODateTime, isoToSlotIndex } from "@/lib/time-utils";
import {
  validatePartySize,
  validateDuration,
  checkReservationConflict,
} from "@/lib/conflict-detection";
import { TIMELINE_CONFIG } from "@/lib/constants";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation; // If provided, edit mode; otherwise create mode
  initialTableId?: string;
  initialStartSlot?: number;
  initialDuration?: number;
}

export default function ReservationModal({
  isOpen,
  onClose,
  reservation,
  initialTableId,
  initialStartSlot,
  initialDuration = TIMELINE_CONFIG.DEFAULT_DURATION_MINUTES,
}: ReservationModalProps) {
  const {
    addReservation,
    updateReservation,
    tables,
    currentDate,
    reservations,
  } = useTimelineStore();

  const getInitialState = () => {
    if (reservation) {
      return {
        customerName: reservation.customer.name,
        phone: reservation.customer.phone,
        email: reservation.customer.email || "",
        partySize: reservation.partySize,
        tableId: reservation.tableId,
        durationMinutes: reservation.durationMinutes,
        status: reservation.status,
        priority: reservation.priority,
        notes: reservation.notes || "",
      };
    }
    return {
      customerName: "",
      phone: "",
      email: "",
      partySize: 2,
      tableId: initialTableId || tables[0]?.id || "",
      durationMinutes: initialDuration,
      status: "CONFIRMED" as ReservationStatus,
      priority: "STANDARD" as Priority,
      notes: "",
    };
  };

  const [formState, setFormState] = useState(getInitialState);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormState(getInitialState());
      setErrors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reservation?.id]);

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!formState.customerName.trim()) {
      newErrors.push("Customer name is required");
    }
    if (!formState.phone.trim()) {
      newErrors.push("Phone number is required");
    }
    if (!formState.tableId) {
      newErrors.push("Table selection is required");
    }

    const table = tables.find((t) => t.id === formState.tableId);
    if (table) {
      const capacityCheck = validatePartySize(formState.partySize, table);
      if (capacityCheck.hasConflict) {
        newErrors.push(
          `Party size must be between ${table.capacity.min} and ${table.capacity.max} for this table`
        );
      }
    }

    if (!validateDuration(formState.durationMinutes)) {
      newErrors.push(
        `Duration must be between ${TIMELINE_CONFIG.MIN_DURATION_MINUTES} and ${TIMELINE_CONFIG.MAX_DURATION_MINUTES} minutes`
      );
    }

    // Check for conflicts (only for new reservations or if time/table changed)
    if (!reservation || initialStartSlot !== undefined) {
      const startSlot =
        initialStartSlot ?? isoToSlotIndex(reservation!.startTime);
      const startTime = slotToISODateTime(currentDate, startSlot);
      const endTime = slotToISODateTime(
        currentDate,
        startSlot + Math.round(formState.durationMinutes / 15)
      );

      const conflictCheck = checkReservationConflict(
        formState.tableId,
        startTime,
        endTime,
        reservations,
        reservation?.id
      );

      if (conflictCheck.hasConflict) {
        if (conflictCheck.reason === "outside_service_hours") {
          newErrors.push("Reservation is outside service hours");
        } else if (conflictCheck.reason === "overlap") {
          newErrors.push("This time slot conflicts with another reservation");
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();

    if (reservation) {
      // Update existing reservation
      updateReservation(reservation.id, {
        customer: {
          name: formState.customerName,
          phone: formState.phone,
          email: formState.email || undefined,
        },
        partySize: formState.partySize,
        tableId: formState.tableId,
        durationMinutes: formState.durationMinutes,
        status: formState.status,
        priority: formState.priority,
        notes: formState.notes || undefined,
      });
    } else {
      // Create new reservation
      const startSlot = initialStartSlot ?? 0;
      const startTime = slotToISODateTime(currentDate, startSlot);
      const endTime = slotToISODateTime(
        currentDate,
        startSlot + Math.round(formState.durationMinutes / 15)
      );

      const newReservation: Reservation = {
        id: uuidv4(),
        tableId: formState.tableId,
        customer: {
          name: formState.customerName,
          phone: formState.phone,
          email: formState.email || undefined,
        },
        partySize: formState.partySize,
        startTime,
        endTime,
        durationMinutes: formState.durationMinutes,
        status: formState.status,
        priority: formState.priority,
        notes: formState.notes || undefined,
        source: "app",
        createdAt: now,
        updatedAt: now,
      };

      addReservation(newReservation);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          {reservation ? "Edit Reservation" : "Create Reservation"}
        </h2>

        {errors.length > 0 && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <ul className="list-disc pl-5 text-sm text-red-700">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.customerName}
              onChange={(e) =>
                setFormState({ ...formState, customerName: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formState.phone}
              onChange={(e) =>
                setFormState({ ...formState, phone: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) =>
                setFormState({ ...formState, email: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Party Size & Table */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Party Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formState.partySize}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    partySize: parseInt(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table <span className="text-red-500">*</span>
              </label>
              <select
                value={formState.tableId}
                onChange={(e) =>
                  setFormState({ ...formState, tableId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.capacity.min}-{table.capacity.max}{" "}
                    guests)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={TIMELINE_CONFIG.MIN_DURATION_MINUTES}
              max={TIMELINE_CONFIG.MAX_DURATION_MINUTES}
              step={15}
              value={formState.durationMinutes}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  durationMinutes: parseInt(e.target.value),
                })
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formState.status}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    status: e.target.value as ReservationStatus,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SEATED">Seated</option>
                <option value="FINISHED">Finished</option>
                <option value="NO_SHOW">No Show</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={formState.priority}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    priority: e.target.value as Priority,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="VIP">VIP</option>
                <option value="LARGE_GROUP">Large Group</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formState.notes}
              onChange={(e) =>
                setFormState({ ...formState, notes: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {reservation ? "Update" : "Create"} Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
