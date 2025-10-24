"use client";

import { useTimelineStore } from "@/store/timeline-store";
import { TIMELINE_CONFIG } from "@/lib/constants";
import type { Sector, Table, Reservation } from "@/types";
import TableRow from "./TableRow";

interface SectorGroupProps {
  sector: Sector;
  tables: Table[];
  reservations: Reservation[];
  isCollapsed: boolean;
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

export default function SectorGroup({
  sector,
  tables,
  reservations,
  isCollapsed,
  slotWidth,
  rowHeight,
  onContextMenu,
  onDoubleClick,
  onCreateReservation,
}: SectorGroupProps) {
  const { toggleSectorCollapse } = useTimelineStore();

  return (
    <div className="border-b-2 border-gray-300">
      {/* Sector Header */}
      <div
        className="sticky left-0 z-10 flex cursor-pointer items-center gap-2 border-b border-gray-200 bg-linear-to-r from-white to-gray-50 px-4 py-2 shadow-sm transition-colors hover:bg-gray-100"
        style={{
          height: TIMELINE_CONFIG.SECTOR_HEADER_HEIGHT,
          backgroundColor: `${sector.color}15`, // 15 is hex for low opacity
        }}
        onClick={() => toggleSectorCollapse(sector.id)}
      >
        <svg
          className={`h-5 w-5 transition-transform ${
            isCollapsed ? "" : "rotate-90"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <div
          className="h-4 w-4 rounded"
          style={{ backgroundColor: sector.color }}
        />
        <span className="font-semibold text-gray-800">{sector.name}</span>
        <span className="text-sm text-gray-500">({tables.length} tables)</span>
      </div>

      {/* Table Rows */}
      {!isCollapsed &&
        tables.map((table) => {
          const tableReservations = reservations.filter(
            (res) => res.tableId === table.id
          );
          return (
            <TableRow
              key={table.id}
              table={table}
              reservations={tableReservations}
              slotWidth={slotWidth}
              rowHeight={rowHeight}
              onContextMenu={onContextMenu}
              onDoubleClick={onDoubleClick}
              onCreateReservation={onCreateReservation}
            />
          );
        })}
    </div>
  );
}
