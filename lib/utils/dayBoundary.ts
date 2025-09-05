// utils/dayBoundary.ts
export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// Returns 'YYYY-MM-DD' according to 2 AM boundary in local timezone.
export function diaryDayLocalFromUtcMs(utcMs: number, boundaryHour = 2): string {
  const d = new Date(utcMs);
  // convert to local millis
  const localMs = d.getTime() + (new Date().getTimezoneOffset() * -60000);
  const shifted = new Date(localMs - boundaryHour*3600*1000);
  return formatYMD(shifted);
}

// 'today' according to 2 AM boundary.
export function todayDiaryDay(boundaryHour = 2): string {
  const now = Date.now();
  return diaryDayLocalFromUtcMs(now, boundaryHour);
}
