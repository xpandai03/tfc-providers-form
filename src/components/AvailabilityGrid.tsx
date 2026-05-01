import { useCallback, useEffect, useRef, useState } from "react";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  SLOTS_PER_DAY,
  cellKey,
  slotIndexToLabel,
} from "@/lib/availability";
import { WEEKDAYS, type WeekdayKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AvailabilityGridProps {
  selection: Set<string>;
  onChange: (next: Set<string>) => void;
}

type DragMode = "add" | "remove" | null;

export function AvailabilityGrid({ selection, onChange }: AvailabilityGridProps) {
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const draftRef = useRef<Set<string> | null>(null);

  const applyToCell = useCallback(
    (key: string, mode: DragMode) => {
      if (!mode) return;
      const next = new Set(draftRef.current ?? selection);
      if (mode === "add") next.add(key);
      else next.delete(key);
      draftRef.current = next;
      onChange(next);
    },
    [onChange, selection],
  );

  useEffect(() => {
    if (dragMode === null) return;
    const handleUp = () => {
      setDragMode(null);
      draftRef.current = null;
    };
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragMode]);

  const handleCellDown = (day: WeekdayKey, slot: number) => {
    const key = cellKey(day, slot);
    const isSelected = selection.has(key);
    const mode: DragMode = isSelected ? "remove" : "add";
    setDragMode(mode);
    draftRef.current = new Set(selection);
    applyToCell(key, mode);
  };

  const handleCellEnter = (day: WeekdayKey, slot: number) => {
    if (!dragMode) return;
    applyToCell(cellKey(day, slot), dragMode);
  };

  // Render hour labels every 2 slots (every full hour)
  const hourLabels: { slot: number; label: string }[] = [];
  for (let s = 0; s <= SLOTS_PER_DAY; s += 2) {
    hourLabels.push({ slot: s, label: slotIndexToLabel(s) });
  }

  return (
    <div
      className="select-none touch-none"
      role="grid"
      aria-label={`Availability grid, ${GRID_START_HOUR}:00 to ${GRID_END_HOUR}:00, Monday through Friday`}
    >
      <div
        className="grid border border-border rounded-md overflow-hidden bg-card"
        style={{ gridTemplateColumns: "auto repeat(5, minmax(0, 1fr))" }}
      >
        {/* Header row */}
        <div className="bg-muted/40 border-b border-border" />
        {WEEKDAYS.map(({ key, label }) => (
          <div
            key={key}
            className="bg-muted/40 border-b border-l border-border py-2 text-center text-xs font-semibold text-foreground/80"
          >
            {label}
          </div>
        ))}

        {/* Time rows */}
        {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => slot).map((slot) => {
          const isHourMark = slot % 2 === 0;
          return (
            <div key={`row-${slot}`} className="contents">
              <div
                className={cn(
                  "px-2 py-0 text-[10px] text-muted-foreground text-right border-l-0",
                  isHourMark ? "border-t border-border" : "border-t border-dashed border-border/40",
                )}
                style={{ minHeight: 18, lineHeight: "18px" }}
              >
                {isHourMark ? slotIndexToLabel(slot) : ""}
              </div>
              {WEEKDAYS.map(({ key }) => {
                const k = cellKey(key, slot);
                const selected = selection.has(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                      handleCellDown(key, slot);
                    }}
                    onPointerEnter={() => handleCellEnter(key, slot)}
                    aria-label={`${key} ${slotIndexToLabel(slot)}${selected ? " selected" : ""}`}
                    aria-pressed={selected}
                    className={cn(
                      "border-l border-border transition-colors cursor-pointer",
                      isHourMark ? "border-t border-border" : "border-t border-dashed border-border/40",
                      selected
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-card hover:bg-primary/10",
                    )}
                    style={{ minHeight: 18 }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Footer / end-of-day boundary so users see the closing hour */}
        <div
          className="px-2 text-[10px] text-muted-foreground text-right border-t border-border"
          style={{ minHeight: 18, lineHeight: "18px" }}
        >
          {hourLabels[hourLabels.length - 1]?.label}
        </div>
        {WEEKDAYS.map(({ key }) => (
          <div
            key={`end-${key}`}
            className="border-l border-t border-border"
            style={{ minHeight: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
