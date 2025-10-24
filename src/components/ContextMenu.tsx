"use client";

import { useEffect, useRef } from "react";
import type { Reservation, ReservationStatus } from "@/types";
import { useTimelineStore } from "@/store/timeline-store";
import { addMinutes, parseISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface ContextMenuProps {
  reservation: Reservation;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
}

export default function ContextMenu({
  reservation,
  x,
  y,
  onClose,
  onEdit,
}: ContextMenuProps) {
  const {
    updateReservation,
    deleteReservation,
    addReservation,
    selectedReservationIds,
    reservations,
  } = useTimelineStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Get all selected reservations (or just the clicked one if not selected)
  const selectedReservations = selectedReservationIds.includes(reservation.id)
    ? reservations.filter((r) => selectedReservationIds.includes(r.id))
    : [reservation];

  const isMultiSelect = selectedReservations.length > 1;

  const handleStatusChange = (status: ReservationStatus) => {
    selectedReservations.forEach((res) => {
      updateReservation(res.id, { status });
    });
    onClose();
  };

  const handleDelete = () => {
    const count = selectedReservations.length;
    const message =
      count === 1
        ? `Delete reservation for ${reservation.customer.name}?`
        : `Delete ${count} reservations?`;

    if (confirm(message)) {
      selectedReservations.forEach((res) => {
        deleteReservation(res.id);
      });
      onClose();
    }
  };

  const handleCancel = () => {
    selectedReservations.forEach((res) => {
      updateReservation(res.id, { status: "CANCELLED" });
    });
    onClose();
  };

  const handleNoShow = () => {
    selectedReservations.forEach((res) => {
      updateReservation(res.id, { status: "NO_SHOW" });
    });
    onClose();
  };

  const handleDuplicate = () => {
    // Duplicate the reservation 30 minutes later
    const startDate = parseISO(reservation.startTime);
    const endDate = parseISO(reservation.endTime);
    const newStart = addMinutes(startDate, 30);
    const newEnd = addMinutes(endDate, 30);

    const duplicated: Reservation = {
      ...reservation,
      id: uuidv4(),
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReservation(duplicated);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 rounded-md border border-gray-200 bg-white shadow-lg"
      style={{ left: x, top: y }}
    >
      <div className="py-1">
        {/* Header */}
        {isMultiSelect && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-500">
            {selectedReservations.length} SELECTED
          </div>
        )}

        {/* Edit - Only show for single selection */}
        {!isMultiSelect && (
          <>
            <button
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <svg
                className="mr-3 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Details
            </button>

            <div className="my-1 border-t border-gray-100" />
          </>
        )}

        {/* Change Status Submenu */}
        <div className="px-4 py-2 text-xs font-semibold text-gray-500">
          CHANGE STATUS
        </div>

        {(
          ["PENDING", "CONFIRMED", "SEATED", "FINISHED"] as ReservationStatus[]
        ).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 ${
              reservation.status === status
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700"
            }`}
          >
            {reservation.status === status && (
              <svg
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className={reservation.status === status ? "" : "ml-6"}>
              {status.charAt(0) +
                status.slice(1).toLowerCase().replace("_", " ")}
            </span>
          </button>
        ))}

        <div className="my-1 border-t border-gray-100" />

        {/* Mark as No Show */}
        <button
          onClick={handleNoShow}
          className="flex w-full items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
        >
          <svg
            className="mr-3 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Mark as No-Show
        </button>

        {/* Cancel Reservation */}
        <button
          onClick={handleCancel}
          className="flex w-full items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
        >
          <svg
            className="mr-3 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cancel Reservation{isMultiSelect ? "s" : ""}
        </button>

        <div className="my-1 border-t border-gray-100" />

        {/* Duplicate - Only for single selection */}
        {!isMultiSelect && (
          <button
            onClick={handleDuplicate}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg
              className="mr-3 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Duplicate
          </button>
        )}

        <div className="my-1 border-t border-gray-100" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <svg
            className="mr-3 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
