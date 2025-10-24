"use client";

import { TIMELINE_CONFIG, TOTAL_SLOTS } from "@/lib/constants";
import { slotIndexToTime } from "@/lib/time-utils";

interface TimelineHeaderProps {
  slotWidth: number;
  totalWidth: number;
}

export default function TimelineHeader({
  slotWidth,
  totalWidth,
}: TimelineHeaderProps) {
  // Calculate number of hours (every 4 slots = 1 hour)
  const numberOfHours = Math.ceil(TOTAL_SLOTS / 4);

  return (
    <div className="border-b border-gray-300 bg-white shadow-sm">
      <div className="flex" style={{ width: totalWidth }}>
        {/* Spacer for table label column */}
        <div
          className="w-32 shrink-0 border-r border-gray-200"
          style={{ height: TIMELINE_CONFIG.HEADER_HEIGHT }}
        />

        {/* Time slots */}
        {Array.from({ length: numberOfHours }).map((_, hourIndex) => {
          const slotIndex = hourIndex * 4;
          const time = slotIndexToTime(slotIndex);

          return (
            <div
              key={slotIndex}
              className="shrink-0 border-r border-gray-200 px-2 py-2"
              style={{
                width: slotWidth * 4,
                height: TIMELINE_CONFIG.HEADER_HEIGHT,
              }}
            >
              <div className="text-sm font-semibold text-gray-700">{time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
