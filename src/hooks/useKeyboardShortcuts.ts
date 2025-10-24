import { useEffect } from "react";
import { useTimelineStore } from "@/store/timeline-store";
import type { Reservation } from "@/types";

export function useKeyboardShortcuts() {
  const {
    selectedReservationIds,
    reservations,
    deleteReservation,
    addReservation,
  } = useTimelineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected reservations
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedReservationIds.length > 0 && !isInputFocused()) {
          e.preventDefault();
          const count = selectedReservationIds.length;
          if (confirm(`Delete ${count} reservation${count > 1 ? "s" : ""}?`)) {
            selectedReservationIds.forEach((id) => {
              deleteReservation(id);
            });
          }
        }
      }

      // Copy (Ctrl/Cmd + C)
      if (isCtrlOrCmd && e.key === "c") {
        if (selectedReservationIds.length > 0 && !isInputFocused()) {
          e.preventDefault();
          const selectedReservations = reservations.filter((r) =>
            selectedReservationIds.includes(r.id)
          );
          // Store in sessionStorage for paste
          sessionStorage.setItem(
            "copiedReservations",
            JSON.stringify(selectedReservations)
          );
          console.log(`Copied ${selectedReservations.length} reservation(s)`);
        }
      }

      // Paste (Ctrl/Cmd + V)
      if (isCtrlOrCmd && e.key === "v") {
        if (!isInputFocused()) {
          e.preventDefault();
          const copied = sessionStorage.getItem("copiedReservations");
          if (copied) {
            try {
              const copiedReservations: Reservation[] = JSON.parse(copied);
              // Paste 30 minutes later
              copiedReservations.forEach((res) => {
                const startDate = new Date(res.startTime);
                const endDate = new Date(res.endTime);
                startDate.setMinutes(startDate.getMinutes() + 30);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const newReservation = {
                  ...res,
                  id: crypto.randomUUID(),
                  startTime: startDate.toISOString(),
                  endTime: endDate.toISOString(),
                  status: "PENDING" as const,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                addReservation(newReservation);
              });
              console.log(`Pasted ${copiedReservations.length} reservation(s)`);
            } catch (err) {
              console.error("Error pasting reservations:", err);
            }
          }
        }
      }

      // Duplicate (Ctrl/Cmd + D)
      if (isCtrlOrCmd && e.key === "d") {
        if (selectedReservationIds.length > 0 && !isInputFocused()) {
          e.preventDefault();
          const selectedReservations = reservations.filter((r) =>
            selectedReservationIds.includes(r.id)
          );
          selectedReservations.forEach((res) => {
            const startDate = new Date(res.startTime);
            const endDate = new Date(res.endTime);
            startDate.setMinutes(startDate.getMinutes() + 30);
            endDate.setMinutes(endDate.getMinutes() + 30);

            const duplicated = {
              ...res,
              id: crypto.randomUUID(),
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              status: "PENDING" as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            addReservation(duplicated);
          });
          console.log(
            `Duplicated ${selectedReservations.length} reservation(s)`
          );
        }
      }
    };

    // Helper to check if an input is focused
    function isInputFocused(): boolean {
      const activeElement = document.activeElement;
      return (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement as HTMLElement)?.isContentEditable
      );
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedReservationIds, reservations, deleteReservation, addReservation]);
}
