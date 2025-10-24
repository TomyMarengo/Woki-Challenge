"use client";

import { useTimelineStore } from "@/store/timeline-store";
import { STATUS_COLORS } from "@/lib/constants";

export default function TimelineToolbar() {
  const {
    currentDate,
    setDate,
    zoom,
    setZoom,
    selectedSectorIds,
    setSectorFilter,
    selectedStatuses,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    clearFilters,
    sectors,
    loadTestData,
    resetToInitial,
    reservations,
  } = useTimelineStore();

  const statuses = [
    "PENDING",
    "CONFIRMED",
    "SEATED",
    "FINISHED",
    "NO_SHOW",
    "CANCELLED",
  ];
  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5];

  const activeFiltersCount =
    selectedSectorIds.length + selectedStatuses.length + (searchQuery ? 1 : 0);

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sectors:</label>
          <select
            value={selectedSectorIds[0] || ""}
            onChange={(e) => {
              setSectorFilter(e.target.value ? [e.target.value] : []);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Sectors</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={selectedStatuses[0] || ""}
            onChange={(e) => {
              setStatusFilter(e.target.value ? [e.target.value] : []);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              backgroundColor: selectedStatuses[0]
                ? STATUS_COLORS[selectedStatuses[0]]
                : "white",
              color: selectedStatuses[0] ? "white" : "#111827",
              fontWeight: selectedStatuses[0] ? "600" : "400",
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => {
              const formatted =
                status.charAt(0) +
                status.slice(1).toLowerCase().replace("_", " ");
              return (
                <option
                  key={status}
                  value={status}
                  style={{
                    backgroundColor: STATUS_COLORS[status],
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {formatted}
                </option>
              );
            })}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Customer name or phone..."
            className="w-64 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <div className="flex gap-1">
            {zoomLevels.map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  zoom === level
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {level * 100}%
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Clear Filters ({activeFiltersCount})
          </button>
        )}

        {/* Test Data Controls */}
        <div className="ml-auto flex items-center gap-2 border-l border-gray-300 pl-3">
          <span className="text-sm text-gray-600">
            {reservations.length} reservations
          </span>
          <button
            onClick={() => loadTestData(200)}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Load 200
          </button>
          <button
            onClick={resetToInitial}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
