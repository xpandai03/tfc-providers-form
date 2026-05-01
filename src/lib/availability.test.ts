import { describe, expect, it } from "vitest";
import {
  cellKey,
  GRID_END_HOUR,
  GRID_START_HOUR,
  SLOTS_PER_DAY,
  SLOT_MINUTES,
  selectionToWeek,
  slotIndexToTime,
} from "./availability";

describe("grid constants", () => {
  it("covers the configured hour range in 30-min slots", () => {
    expect(SLOTS_PER_DAY).toBe(((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES);
  });
});

describe("slotIndexToTime", () => {
  it("returns 07:00 for slot 0", () => {
    expect(slotIndexToTime(0)).toBe("07:00");
  });
  it("returns 07:30 for slot 1", () => {
    expect(slotIndexToTime(1)).toBe("07:30");
  });
  it("returns the exclusive end boundary at SLOTS_PER_DAY", () => {
    // last slot's end == grid end hour
    expect(slotIndexToTime(SLOTS_PER_DAY)).toBe("20:00");
  });
});

describe("selectionToWeek", () => {
  it("returns empty arrays for an empty selection", () => {
    const week = selectionToWeek(new Set());
    expect(week).toEqual({ mon: [], tue: [], wed: [], thu: [], fri: [] });
  });

  it("groups two contiguous slots into one block", () => {
    // Mon 09:00-10:00 = slots 4 + 5 (since 7:00 is slot 0)
    // 09:00 is 2 hours past 07:00 = 4 slots in
    const sel = new Set([cellKey("mon", 4), cellKey("mon", 5)]);
    const week = selectionToWeek(sel);
    expect(week.mon).toEqual([{ start: "09:00", end: "10:00" }]);
  });

  it("splits non-contiguous slots into separate blocks", () => {
    // Mon 09:00-09:30 (slot 4) and 11:00-11:30 (slot 8)
    const sel = new Set([cellKey("mon", 4), cellKey("mon", 8)]);
    const week = selectionToWeek(sel);
    expect(week.mon).toEqual([
      { start: "09:00", end: "09:30" },
      { start: "11:00", end: "11:30" },
    ]);
  });

  it("handles selections across multiple days independently", () => {
    const sel = new Set([
      cellKey("mon", 0),
      cellKey("mon", 1),
      cellKey("fri", 10),
    ]);
    const week = selectionToWeek(sel);
    expect(week.mon).toEqual([{ start: "07:00", end: "08:00" }]);
    expect(week.fri).toEqual([{ start: "12:00", end: "12:30" }]);
    expect(week.tue).toEqual([]);
  });

  it("treats a single slot as a 30-minute block", () => {
    const sel = new Set([cellKey("wed", 0)]);
    const week = selectionToWeek(sel);
    expect(week.wed).toEqual([{ start: "07:00", end: "07:30" }]);
  });

  it("handles a full day selection as one block", () => {
    const sel = new Set<string>();
    for (let s = 0; s < SLOTS_PER_DAY; s++) sel.add(cellKey("thu", s));
    const week = selectionToWeek(sel);
    expect(week.thu).toEqual([{ start: "07:00", end: "20:00" }]);
  });
});
