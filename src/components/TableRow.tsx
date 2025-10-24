"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Table, Reservation } from "@/types";
import ReservationBlock from "./ReservationBlock";

interface TableRowProps {
  table: Table;
  reservations: Reservation[];
  slotWidth: number;
  rowHeight: number;
  onContextMenu: (e: React.MouseEvent, reservation: Reservation) => void;
  onDoubleClick: (reservation: Reservation) => void;
  onCreateReservation: (
    tableId: string,
    startSlot: number,
    duration: number
  ) => void;
}

export default function TableRow({
  table,
  reservations,
  slotWidth,
  rowHeight,
  onContextMenu,
  onDoubleClick,
  onCreateReservation,
}: TableRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<{
    slot: number;
    x: number;
  } | null>(null);
  const [createEnd, setCreateEnd] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start creating if clicking on empty space (not on a reservation block)
    if ((e.target as HTMLElement).closest(".reservation-block")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 128; // Subtract table label width
    const slot = Math.floor(x / slotWidth);

    if (slot >= 0) {
      setIsCreating(true);
      setCreateStart({ slot, x });
      setCreateEnd(slot);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCreating || !createStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 128;
    const slot = Math.floor(x / slotWidth);

    if (slot >= createStart.slot) {
      setCreateEnd(slot);
    }
  };

  const handleMouseUp = () => {
    if (isCreating && createStart && createEnd !== null) {
      const startSlot = createStart.slot;
      const endSlot = createEnd;
      const durationMinutes = (endSlot - startSlot + 1) * 15;

      if (durationMinutes >= 30) {
        // Minimum 30 minutes
        onCreateReservation(table.id, startSlot, durationMinutes);
      }
    }

    setIsCreating(false);
    setCreateStart(null);
    setCreateEnd(null);
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative border-b border-gray-200 transition-colors ${
        isOver ? "bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
      style={{ height: rowHeight }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Table Label (Sticky) */}
      <div className="absolute left-0 top-0 z-10 flex h-full w-32 items-center border-r border-gray-200 bg-white px-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">
            {table.name}
          </span>
          <span className="text-xs text-gray-500">
            {table.capacity.min}-{table.capacity.max} guests
          </span>
        </div>
      </div>

      {/* Reservation Blocks */}
      <div className="absolute left-32 top-0 right-0 h-full">
        {reservations.map((reservation) => (
          <ReservationBlock
            key={reservation.id}
            reservation={reservation}
            slotWidth={slotWidth}
            rowHeight={rowHeight}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
          />
        ))}

        {/* Create Preview */}
        {isCreating && createStart && createEnd !== null && (
          <div
            className="absolute top-1 rounded border-2 border-dashed border-blue-400 bg-blue-100 opacity-50"
            style={{
              left: createStart.slot * slotWidth,
              width: (createEnd - createStart.slot + 1) * slotWidth - 4,
              height: rowHeight - 8,
            }}
          >
            <div className="flex h-full items-center justify-center text-xs font-medium text-blue-700">
              {(createEnd - createStart.slot + 1) * 15} min
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
