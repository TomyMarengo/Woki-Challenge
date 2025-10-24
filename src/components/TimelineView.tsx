"use client";

import TimelineToolbar from "./TimelineToolbar";
import TimelineGrid from "./TimelineGrid";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function TimelineView() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-full flex-col">
      <TimelineToolbar />
      <div className="flex-1 overflow-hidden">
        <TimelineGrid />
      </div>
    </div>
  );
}
