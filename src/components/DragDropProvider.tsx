"use client";

import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { useState } from "react";
import type { Reservation } from "@/types";
import { useTimelineStore } from "@/store/timeline-store";
import {
  slotToISODateTime,
  isoToSlotIndex,
  formatTimeRange,
} from "@/lib/time-utils";
import { canDropReservation } from "@/lib/conflict-detection";
import {
  STATUS_COLORS,
  STATUS_TEXT_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/constants";

interface DragDropProviderProps {
  children: React.ReactNode;
  slotWidth: number;
}

export default function DragDropProvider({
  children,
  slotWidth,
}: DragDropProviderProps) {
  const { reservations, tables, updateReservation, currentDate } =
    useTimelineStore();
  const [activeReservation, setActiveReservation] =
    useState<Reservation | null>(null);
  const [dragPreviewTimes, setDragPreviewTimes] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const reservation = reservations.find((r) => r.id === active.id);
    if (reservation) {
      setActiveReservation(reservation);
      setDragPreviewTimes(null);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!activeReservation) return;

    const { delta } = event;
    const deltaSlots = Math.round(delta.x / slotWidth);

    if (deltaSlots !== 0) {
      // Calculate new times based on drag position
      const currentStartSlot = isoToSlotIndex(activeReservation.startTime);
      const newStartSlot = currentStartSlot + deltaSlots;
      const durationSlots = Math.round(activeReservation.durationMinutes / 15);

      const newStartISO = slotToISODateTime(currentDate, newStartSlot);
      const newEndISO = slotToISODateTime(
        currentDate,
        newStartSlot + durationSlots
      );

      setDragPreviewTimes({ start: newStartISO, end: newEndISO });
    } else {
      setDragPreviewTimes(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta, over } = event;

    if (!activeReservation) return;

    // Calculate new position based on delta (horizontal movement only for now)
    const deltaSlots = Math.round(delta.x / slotWidth);

    if (deltaSlots === 0 && !over) {
      // No movement
      setActiveReservation(null);
      return;
    }

    // Calculate new time based on slots moved
    const currentStartSlot = isoToSlotIndex(activeReservation.startTime);
    const newStartSlot = currentStartSlot + deltaSlots;
    const durationSlots = Math.round(activeReservation.durationMinutes / 15);
    const newEndSlot = newStartSlot + durationSlots;

    // Convert back to ISO datetime
    const newStartISO = slotToISODateTime(currentDate, newStartSlot);
    const newEndISO = slotToISODateTime(currentDate, newEndSlot);

    // Determine target table
    let targetTableId = activeReservation.tableId;
    if (over && typeof over.id === "string" && over.id.startsWith("table-")) {
      targetTableId = over.id.replace("table-", "");
    }

    // Validate the drop
    const validation = canDropReservation(
      activeReservation,
      targetTableId,
      newStartISO,
      newEndISO,
      reservations,
      tables
    );

    // Always allow the drop - conflicts will show visual warnings
    updateReservation(activeReservation.id, {
      tableId: targetTableId,
      startTime: newStartISO,
      endTime: newEndISO,
    });

    if (!validation.canDrop) {
      // Log warning for debugging
      console.warn("Drop created conflict:", validation.reason);
    }

    setActiveReservation(null);
    setDragPreviewTimes(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeReservation &&
          (() => {
            const backgroundColor =
              STATUS_COLORS[activeReservation.status] ||
              STATUS_COLORS.CONFIRMED;
            const textColor =
              STATUS_TEXT_COLORS[activeReservation.status] ||
              STATUS_TEXT_COLORS.CONFIRMED;
            const priorityLabel = PRIORITY_LABELS[activeReservation.priority];
            const priorityColor = PRIORITY_COLORS[activeReservation.priority];

            const displayTime = dragPreviewTimes
              ? formatTimeRange(dragPreviewTimes.start, dragPreviewTimes.end)
              : formatTimeRange(
                  activeReservation.startTime,
                  activeReservation.endTime
                );

            return (
              <div
                className="cursor-grabbing rounded border-2 px-2 py-1 shadow-lg"
                style={{
                  backgroundColor,
                  borderColor: backgroundColor,
                  color: textColor,
                  width: "300px",
                  opacity: 0.95,
                }}
              >
                <div className="flex h-full flex-col justify-between overflow-hidden text-xs">
                  {/* Top Section - Customer & Party Size */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate font-semibold">
                        {activeReservation.customer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        {activeReservation.partySize}
                      </span>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center gap-1 font-medium">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{displayTime}</span>
                  </div>

                  {/* Priority Badge */}
                  {priorityLabel && (
                    <div
                      className="mt-0.5 inline-block self-start rounded px-1 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: priorityColor }}
                    >
                      {priorityLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </DragOverlay>
    </DndContext>
  );
}
