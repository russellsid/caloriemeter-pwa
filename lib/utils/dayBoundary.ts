// lib/utils/dayBoundary.ts
'use client';

function pad(n: number) { return n < 10 ? '0' + n : String(n); }
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Return diary "day" (YYYY-MM-DD) for a given timestamp, using a local
 * start-of-day boundary (e.g. 2 means day runs 02:00 → next 02:00 local time).
 *
 * Logic: shift the time back by boundary hours, then take the local date.
 */
export function diaryDayLocalFromUtcMs(utcMs: number, startHourLocal: number) {
  const shifted = new Date(utcMs - startHourLocal * 60 * 60 * 1000);
  return ymd(shifted); // local date string
}

/** Convenience: today's diary day using the given local boundary hour. */
export function todayDiaryDay(startHourLocal: number) {
  return diaryDayLocalFromUtcMs(Date.now(), startHourLocal);
}
