import { create } from "zustand";
import type { Reservation, Table, Sector } from "@/types";
import {
  sectors as initialSectors,
  tables as initialTables,
  initialReservations,
  SEED_DATE,
} from "@/data/seed-data";

interface TimelineState {
  // Data
  reservations: Reservation[];
  tables: Table[];
  sectors: Sector[];

  // View state
  currentDate: string;
  selectedReservationIds: string[];
  zoom: number;
  collapsedSectorIds: string[];

  // Filters
  selectedSectorIds: string[];
  selectedStatuses: string[];
  searchQuery: string;

  // Actions - Reservations
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;

  // Actions - Selection
  selectReservation: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;

  // Actions - View
  setDate: (date: string) => void;
  setZoom: (zoom: number) => void;
  toggleSectorCollapse: (sectorId: string) => void;

  // Actions - Filters
  setSectorFilter: (sectorIds: string[]) => void;
  setStatusFilter: (statuses: string[]) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Utility
  getReservationsByTable: (tableId: string) => Reservation[];
  getTableById: (tableId: string) => Table | undefined;
  getSectorById: (sectorId: string) => Sector | undefined;
  loadTestData: (count: number) => void;
  resetToInitial: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  // Initial state
  reservations: initialReservations,
  tables: initialTables,
  sectors: initialSectors,

  currentDate: SEED_DATE,
  selectedReservationIds: [],
  zoom: 1,
  collapsedSectorIds: [],

  selectedSectorIds: [],
  selectedStatuses: [],
  searchQuery: "",

  // Reservation actions
  addReservation: (reservation) => {
    set((state) => ({
      reservations: [...state.reservations, reservation],
    }));
  },

  updateReservation: (id, updates) => {
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, ...updates, updatedAt: new Date().toISOString() }
          : res
      ),
    }));
  },

  deleteReservation: (id) => {
    set((state) => ({
      reservations: state.reservations.filter((res) => res.id !== id),
      selectedReservationIds: state.selectedReservationIds.filter(
        (resId) => resId !== id
      ),
    }));
  },

  // Selection actions
  selectReservation: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const isSelected = state.selectedReservationIds.includes(id);
        return {
          selectedReservationIds: isSelected
            ? state.selectedReservationIds.filter((resId) => resId !== id)
            : [...state.selectedReservationIds, id],
        };
      }
      return { selectedReservationIds: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedReservationIds: [] });
  },

  // View actions
  setDate: (date) => {
    set({ currentDate: date });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.5, Math.min(1.5, zoom)) });
  },

  toggleSectorCollapse: (sectorId) => {
    set((state) => ({
      collapsedSectorIds: state.collapsedSectorIds.includes(sectorId)
        ? state.collapsedSectorIds.filter((id) => id !== sectorId)
        : [...state.collapsedSectorIds, sectorId],
    }));
  },

  // Filter actions
  setSectorFilter: (sectorIds) => {
    set({ selectedSectorIds: sectorIds });
  },

  setStatusFilter: (statuses) => {
    set({ selectedStatuses: statuses });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearFilters: () => {
    set({
      selectedSectorIds: [],
      selectedStatuses: [],
      searchQuery: "",
    });
  },

  // Utility functions
  getReservationsByTable: (tableId) => {
    return get().reservations.filter((res) => res.tableId === tableId);
  },

  getTableById: (tableId) => {
    return get().tables.find((table) => table.id === tableId);
  },

  getSectorById: (sectorId) => {
    return get().sectors.find((sector) => sector.id === sectorId);
  },

  loadTestData: (count) => {
    const { tables, currentDate } = get();
    const tableIds = tables.map((t) => t.id);
    // Use dynamic import to avoid bundling the generator in production
    import("@/data/generate-test-data").then(({ generateTestReservations }) => {
      const testReservations = generateTestReservations(
        tableIds,
        count,
        currentDate
      );
      set({ reservations: testReservations });
    });
  },

  resetToInitial: () => {
    set({ reservations: initialReservations });
  },
}));
