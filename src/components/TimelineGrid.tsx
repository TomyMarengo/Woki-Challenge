"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { Reservation } from "@/types";
import { useTimelineStore } from "@/store/timeline-store";
import { TIMELINE_CONFIG, TOTAL_SLOTS } from "@/lib/constants";
import { getCurrentSlotIndex } from "@/lib/time-utils";
import TimelineHeader from "./TimelineHeader";
import SectorGroup from "./SectorGroup";
import DragDropProvider from "./DragDropProvider";
import ContextMenu from "./ContextMenu";
import ReservationModal from "./ReservationModal";

export default function TimelineGrid() {
  // Prevent hydration mismatch by only enabling DnD on client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This is intentional to prevent hydration mismatch with @dnd-kit
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);
  const {
    tables,
    sectors,
    reservations,
    zoom,
    collapsedSectorIds,
    selectedSectorIds,
    selectedStatuses,
    searchQuery,
  } = useTimelineStore();

  const gridRef = useRef<HTMLDivElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    reservation: Reservation;
    x: number;
    y: number;
  } | null>(null);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reservation?: Reservation;
  }>({ isOpen: false });

  // Calculate dimensions based on zoom
  const slotWidth = TIMELINE_CONFIG.SLOT_WIDTH * zoom;
  const rowHeight = TIMELINE_CONFIG.ROW_HEIGHT;
  const totalWidth = 128 + TOTAL_SLOTS * slotWidth; // 128px for table label column

  // Filter tables based on sector filter
  const visibleTables = useMemo(() => {
    if (selectedSectorIds.length === 0) {
      return tables;
    }
    return tables.filter((table) => selectedSectorIds.includes(table.sectorId));
  }, [tables, selectedSectorIds]);

  // Filter reservations
  const visibleReservations = useMemo(() => {
    let filtered = reservations;

    // Filter by sector (through table)
    if (selectedSectorIds.length > 0) {
      const visibleTableIds = new Set(visibleTables.map((t) => t.id));
      filtered = filtered.filter((res) => visibleTableIds.has(res.tableId));
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((res) =>
        selectedStatuses.includes(res.status)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.customer.name.toLowerCase().includes(query) ||
          res.customer.phone.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [
    reservations,
    visibleTables,
    selectedStatuses,
    searchQuery,
    selectedSectorIds,
  ]);

  // Group tables by sector
  const sectorGroups = useMemo(() => {
    const groups = new Map<string, typeof tables>();

    sectors
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((sector) => {
        const sectorTables = visibleTables
          .filter((table) => table.sectorId === sector.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (sectorTables.length > 0) {
          groups.set(sector.id, sectorTables);
        }
      });

    return groups;
  }, [sectors, visibleTables]);

  // Get current time slot for the time indicator
  const currentSlot = getCurrentSlotIndex();
  const currentTimeLeft =
    currentSlot >= 0 && currentSlot < TOTAL_SLOTS
      ? currentSlot * slotWidth
      : null;

  // Event handlers
  const handleContextMenu = (e: React.MouseEvent, reservation: Reservation) => {
    e.preventDefault();
    setContextMenu({
      reservation,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDoubleClick = (reservation: Reservation) => {
    setModalState({ isOpen: true, reservation });
  };

  const handleEdit = (reservation: Reservation) => {
    setModalState({ isOpen: true, reservation });
  };

  const handleCreateReservation = (
    tableId: string,
    startSlot: number,
    durationMinutes: number
  ) => {
    setModalState({
      isOpen: true,
      reservation: undefined, // Create mode
    });
    // Store the initial values for the modal
    if (typeof window !== "undefined") {
      (
        window as Window & { __tempReservationData?: Record<string, unknown> }
      ).__tempReservationData = {
        tableId,
        startSlot,
        durationMinutes,
      };
    }
  };

  const gridContent = (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-gray-50">
        {/* Scrollable Grid Area */}
        <div ref={gridRef} className="flex-1 overflow-auto">
          <div className="relative" style={{ width: totalWidth }}>
            {/* Timeline Header - Sticky inside scroll */}
            <div className="sticky top-0 z-30">
              <TimelineHeader slotWidth={slotWidth} totalWidth={totalWidth} />
            </div>
            {/* Vertical grid lines */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: TOTAL_SLOTS + 1 }).map((_, i) => {
                const isHour = i % 4 === 0; // Every hour (4 slots)
                const isHalfHour = i % 2 === 0; // Every 30 minutes
                return (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 ${
                      isHour
                        ? "border-l-2 border-gray-300"
                        : isHalfHour
                        ? "border-l border-gray-200"
                        : "border-l border-gray-100"
                    }`}
                    style={{ left: 128 + i * slotWidth }}
                  />
                );
              })}
            </div>

            {/* Current time indicator */}
            {currentTimeLeft !== null && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-500"
                style={{ left: 128 + currentTimeLeft }}
              >
                <div className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-red-500" />
              </div>
            )}

            {/* Sector Groups */}
            {Array.from(sectorGroups.entries()).map(
              ([sectorId, sectorTables]) => {
                const sector = sectors.find((s) => s.id === sectorId)!;
                const isCollapsed = collapsedSectorIds.includes(sectorId);

                return (
                  <SectorGroup
                    key={sectorId}
                    sector={sector}
                    tables={sectorTables}
                    reservations={visibleReservations}
                    isCollapsed={isCollapsed}
                    slotWidth={slotWidth}
                    rowHeight={rowHeight}
                    onContextMenu={handleContextMenu}
                    onDoubleClick={handleDoubleClick}
                    onCreateReservation={handleCreateReservation}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          reservation={contextMenu.reservation}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={() => handleEdit(contextMenu.reservation)}
        />
      )}

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState({ isOpen: false });
          if (typeof window !== "undefined") {
            delete (
              window as Window & {
                __tempReservationData?: Record<string, unknown>;
              }
            ).__tempReservationData;
          }
        }}
        reservation={modalState.reservation}
        initialTableId={
          typeof window !== "undefined"
            ? (
                window as Window & {
                  __tempReservationData?: { tableId?: string };
                }
              ).__tempReservationData?.tableId
            : undefined
        }
        initialStartSlot={
          typeof window !== "undefined"
            ? (
                window as Window & {
                  __tempReservationData?: { startSlot?: number };
                }
              ).__tempReservationData?.startSlot
            : undefined
        }
        initialDuration={
          typeof window !== "undefined"
            ? (
                window as Window & {
                  __tempReservationData?: { durationMinutes?: number };
                }
              ).__tempReservationData?.durationMinutes
            : undefined
        }
      />
    </>
  );

  return isClient ? (
    <DragDropProvider slotWidth={slotWidth}>{gridContent}</DragDropProvider>
  ) : (
    gridContent
  );
}
