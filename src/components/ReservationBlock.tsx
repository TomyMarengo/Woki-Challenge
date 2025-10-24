"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Reservation } from "@/types";
import {
  isoToSlotIndex,
  formatTimeRange,
  formatTime,
  slotToISODateTime,
} from "@/lib/time-utils";
import {
  STATUS_COLORS,
  STATUS_TEXT_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  TIMELINE_CONFIG,
} from "@/lib/constants";
import { useTimelineStore } from "@/store/timeline-store";
import {
  checkReservationConflict,
  validatePartySize,
} from "@/lib/conflict-detection";

interface ReservationBlockProps {
  reservation: Reservation;
  slotWidth: number;
  rowHeight: number;
  onContextMenu: (e: React.MouseEvent, reservation: Reservation) => void;
  onDoubleClick: (reservation: Reservation) => void;
}

export default function ReservationBlock({
  reservation,
  slotWidth,
  rowHeight,
  onContextMenu,
  onDoubleClick,
}: ReservationBlockProps) {
  const {
    selectedReservationIds,
    selectReservation,
    reservations,
    tables,
    updateReservation,
    currentDate,
  } = useTimelineStore();

  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [hoveringHandle, setHoveringHandle] = useState<"left" | "right" | null>(
    null
  );
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    originalDuration: number;
    originalStart: number;
  } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: reservation.id,
    });

  // Calculate position and size
  const startSlot = isoToSlotIndex(reservation.startTime);
  const endSlot = isoToSlotIndex(reservation.endTime);
  const slots = endSlot - startSlot;

  const left = startSlot * slotWidth;
  const width = slots * slotWidth - 4; // Subtract border width (2px * 2)

  const isSelected = selectedReservationIds.includes(reservation.id);
  const backgroundColor = STATUS_COLORS[reservation.status] || "#9CA3AF";
  const textColor = STATUS_TEXT_COLORS[reservation.status] || "#1F2937";
  const priorityLabel = PRIORITY_LABELS[reservation.priority];
  const priorityColor = PRIORITY_COLORS[reservation.priority];

  // Check for conflicts
  const conflictCheck = useMemo(() => {
    return checkReservationConflict(
      reservation.tableId,
      reservation.startTime,
      reservation.endTime,
      reservations,
      reservation.id
    );
  }, [reservation, reservations]);

  // Check capacity
  const table = tables.find((t) => t.id === reservation.tableId);
  const capacityIssue = table
    ? validatePartySize(reservation.partySize, table).hasConflict
    : false;

  const hasIssue = conflictCheck.hasConflict || capacityIssue;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isResizing) {
      const isMultiSelect = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Windows
      selectReservation(reservation.id, isMultiSelect);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, edge: "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();

    // Set resizing state - useEffect will handle event listeners
    setIsResizing(edge);
    setResizeStart({
      x: e.clientX,
      originalDuration: reservation.durationMinutes,
      originalStart: startSlot,
    });
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeStart) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaSlots = Math.round(deltaX / slotWidth);

      if (deltaSlots === 0) return; // No change

      if (isResizing === "right") {
        // Resize end time - extending/shrinking duration
        const newDuration = Math.max(
          TIMELINE_CONFIG.MIN_DURATION_MINUTES,
          Math.min(
            TIMELINE_CONFIG.MAX_DURATION_MINUTES,
            resizeStart.originalDuration + deltaSlots * 15
          )
        );

        if (newDuration !== reservation.durationMinutes) {
          const newEndSlot =
            resizeStart.originalStart + Math.round(newDuration / 15);
          const newEndISO = slotToISODateTime(currentDate, newEndSlot);

          updateReservation(reservation.id, {
            endTime: newEndISO,
            durationMinutes: newDuration,
          });
        }
      } else if (isResizing === "left") {
        // Resize start time - changing start, keeping end fixed
        const endSlot = isoToSlotIndex(reservation.endTime);
        const newStartSlot = Math.max(
          0,
          Math.min(endSlot - 2, resizeStart.originalStart + deltaSlots)
        ); // min 2 slots (30 min)
        const newDuration = (endSlot - newStartSlot) * 15;

        if (
          newDuration >= TIMELINE_CONFIG.MIN_DURATION_MINUTES &&
          newDuration <= TIMELINE_CONFIG.MAX_DURATION_MINUTES &&
          newStartSlot !== startSlot
        ) {
          const newStartISO = slotToISODateTime(currentDate, newStartSlot);

          updateReservation(reservation.id, {
            startTime: newStartISO,
            durationMinutes: newDuration,
          });
        }
      }
    },
    [
      isResizing,
      resizeStart,
      slotWidth,
      reservation,
      currentDate,
      updateReservation,
      startSlot,
    ]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
    setResizeStart(null);
  }, []);

  // Manage event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);

      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const getBorderColor = () => {
    if (hasIssue) return "#EF4444"; // Red for conflicts
    if (isSelected) return "#3B82F6"; // Blue for selected
    return backgroundColor;
  };

  const style = transform
    ? {
        left,
        width,
        height: rowHeight - 8,
        backgroundColor,
        borderColor: getBorderColor(),
        color: textColor,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : {
        left,
        width,
        height: rowHeight - 8,
        backgroundColor,
        borderColor: getBorderColor(),
        color: textColor,
      };

  // Build tooltip text
  let tooltipText = `${reservation.customer.name} - ${formatTimeRange(
    reservation.startTime,
    reservation.endTime
  )}`;
  if (conflictCheck.hasConflict) {
    tooltipText +=
      conflictCheck.reason === "overlap"
        ? "\n⚠️ Conflict: Overlaps with another reservation"
        : "\n⚠️ Conflict: Outside service hours";
  }
  if (capacityIssue) {
    tooltipText += `\n⚠️ Warning: Party size exceeds table capacity`;
  }

  return (
    <div
      ref={setNodeRef}
      {...(isResizing || hoveringHandle ? {} : listeners)}
      {...attributes}
      className={`reservation-block absolute top-1 rounded border-2 px-2 py-1 shadow-sm transition-all hover:shadow-md ${
        isResizing || hoveringHandle
          ? "cursor-col-resize"
          : "cursor-grab active:cursor-grabbing"
      } ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${
        hasIssue ? "ring-2 ring-red-500" : ""
      }`}
      style={style}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, reservation)}
      onDoubleClick={() => onDoubleClick(reservation)}
      title={tooltipText}
    >
      <div className="flex h-full flex-col justify-between overflow-hidden text-xs">
        {/* Top Section - Customer & Party Size */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 truncate">
            {hasIssue && (
              <svg
                className="h-3 w-3 shrink-0 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="truncate font-semibold">
              {reservation.customer.name}
            </span>
          </div>
          <div className="flex items-center gap-0.5 whitespace-nowrap">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>{reservation.partySize}</span>
          </div>
        </div>

        {/* Middle Section - Time Range */}
        <div className="truncate text-[10px] opacity-90">
          {formatTime(reservation.startTime)} -{" "}
          {formatTime(reservation.endTime)}
        </div>

        {/* Bottom Section - Priority Badge */}
        {priorityLabel && (
          <div
            className="mt-0.5 w-fit rounded px-1 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: priorityColor }}
          >
            {priorityLabel}
          </div>
        )}
      </div>

      {/* Resize Handles */}
      {!isDragging && !isResizing && (
        <>
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 z-30 w-3 cursor-col-resize"
            onMouseDownCapture={(e) => {
              e.stopPropagation();
              handleResizeStart(e, "left");
            }}
            onMouseEnter={() => setHoveringHandle("left")}
            onMouseLeave={() => setHoveringHandle(null)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded-l transition-all"
              style={{
                width: hoveringHandle === "left" ? "4px" : "2px",
                backgroundColor:
                  hoveringHandle === "left" ? "#3B82F6" : "transparent",
              }}
            />
          </div>
          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 z-30 w-3 cursor-col-resize"
            onMouseDownCapture={(e) => {
              e.stopPropagation();
              handleResizeStart(e, "right");
            }}
            onMouseEnter={() => setHoveringHandle("right")}
            onMouseLeave={() => setHoveringHandle(null)}
          >
            <div
              className="absolute right-0 top-0 bottom-0 rounded-r transition-all"
              style={{
                width: hoveringHandle === "right" ? "4px" : "2px",
                backgroundColor:
                  hoveringHandle === "right" ? "#3B82F6" : "transparent",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
