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

/**
 * Shift a YYYY-MM-DD string forward/backward by `deltaDays` and
 * return a new YYYY-MM-DD string.
 */
export function shiftDay(day: string, deltaDays: number): string {
  // Parse defensively
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  dt.setDate(dt.getDate() + deltaDays);
  return ymd(dt);
}
