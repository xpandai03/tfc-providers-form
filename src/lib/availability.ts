import type { AvailabilityWeek, WeekdayKey } from "./types";
import { WEEKDAYS } from "./types";

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 20;
export const SLOT_MINUTES = 30;

export const SLOTS_PER_DAY = ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES;

export function slotIndexToTime(slot: number): string {
  const totalMinutes = GRID_START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotIndexToLabel(slot: number): string {
  const totalMinutes = GRID_START_HOUR * 60 + slot * SLOT_MINUTES;
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0
    ? `${h12} ${period}`
    : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function cellKey(day: WeekdayKey, slot: number): string {
  return `${day}:${slot}`;
}

/**
 * Convert a Set of selected "day:slot" cell keys into the AvailabilityWeek
 * shape, grouping contiguous selected slots per day into {start, end} ranges.
 * end = the time boundary just past the last selected slot (exclusive).
 */
export function selectionToWeek(selection: Set<string>): AvailabilityWeek {
  const week: AvailabilityWeek = { mon: [], tue: [], wed: [], thu: [], fri: [] };

  for (const { key: day } of WEEKDAYS) {
    const slots: number[] = [];
    for (let s = 0; s < SLOTS_PER_DAY; s++) {
      if (selection.has(cellKey(day, s))) slots.push(s);
    }
    if (slots.length === 0) continue;

    let runStart = slots[0]!;
    let prev = slots[0]!;
    for (let i = 1; i < slots.length; i++) {
      const cur = slots[i]!;
      if (cur === prev + 1) {
        prev = cur;
        continue;
      }
      week[day].push({
        start: slotIndexToTime(runStart),
        end: slotIndexToTime(prev + 1),
      });
      runStart = cur;
      prev = cur;
    }
    week[day].push({
      start: slotIndexToTime(runStart),
      end: slotIndexToTime(prev + 1),
    });
  }

  return week;
}

export function isWeekEmpty(week: AvailabilityWeek): boolean {
  return WEEKDAYS.every(({ key }) => week[key].length === 0);
}

export function formatBlockLabel(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h24 = Number(hStr);
  const m = Number(mStr);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
