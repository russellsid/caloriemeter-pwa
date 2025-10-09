// lib/repos/diary.ts
'use client';

/**
 * Diary repo (LocalStorage).
 * Conventions:
 * - Energy in kcal
 * - Macros stored in milligrams: protein_mg, carbs_mg, fat_mg, fiber_mg (NEW, optional)
 * - amount_weight_g is the grams of the entry actually consumed
 * - "day" is a YYYY-MM-DD-like string from your dayBoundary util (2 AM → 2 AM)
 */

import { todayDiaryDay, shiftDay } from '../utils/dayBoundary';

export type DiaryEntry = {
  id: string;
  profile_id: string;
  day: string; // e.g., 2025-09-16 (2AM boundary logic handled by callers)
  recipe_id?: string;
  label?: string;

  amount_weight_g?: number; // grams of this entry
  calories: number;         // kcal for this entry (already scaled for amount_weight_g)

  protein_mg: number;       // mg for this entry (already scaled)
  carbs_mg: number;         // mg
  fat_mg: number;           // mg
  fiber_mg?: number;        // mg (NEW, optional for backward compatibility)

  created_at_ms: number;
  updated_at_ms?: number;
};

const DIARY_KEY = 'cm_diary_v1';

// ---------------- storage helpers ----------------
function loadAll(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveAll(list: DiaryEntry[]) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(list));
}
function byId(id: string): DiaryEntry | undefined {
  return loadAll().find((e) => e.id === id);
}

// ---------------- queries ----------------
export async function listByDay(profileId: string, day: string): Promise<DiaryEntry[]> {
  return loadAll().filter((e) => e.profile_id === profileId && e.day === day);
}

// Sum totals for a set of entries; returns grams for macros (and kcal)
export async function sumTotals(entries: DiaryEntry[]): Promise<{
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number; // NEW
}> {
  let kcal = 0, pMg = 0, cMg = 0, fMg = 0, fibMg = 0;
  for (const e of entries) {
    kcal += e.calories || 0;
    pMg += e.protein_mg || 0;
    cMg += e.carbs_mg || 0;
    fMg += e.fat_mg || 0;
    fibMg += e.fiber_mg || 0; // NEW
  }
  return {
    calories: Math.max(0, Math.round(kcal)),
    protein_g: round1(pMg / 1000),
    carbs_g:   round1(cMg / 1000),
    fat_g:     round1(fMg / 1000),
    fiber_g:   round1(fibMg / 1000), // NEW
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// ---------------- maintenance ----------------
/**
 * Keep only the most recent `maxDays` worth of diary data (inclusive of "today"),
 * based on the app's day-boundary logic (default 2 AM).
 * Returns the number of entries removed.
 */
export function pruneOldEntries(maxDays: number, startHourLocal = 2): number {
  const list = loadAll();
  if (list.length === 0 || maxDays <= 0) return 0;

  const today = todayDiaryDay(startHourLocal);
  // Example: if maxDays = 30, we keep today and the previous 29 days.
  const keepFromDay = shiftDay(today, -(maxDays - 1));

  // Because YYYY-MM-DD sorts lexicographically by date, plain string compare works.
  const filtered = list.filter((e) => e.day >= keepFromDay);
  const removed = list.length - filtered.length;
  if (removed > 0) saveAll(filtered);
  return removed;
}

// ---------------- mutations ----------------
export async function deleteEntry(id: string): Promise<boolean> {
  const list = loadAll();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  saveAll(list);
  return true;
}

export async function updateEntryWeight(id: string, grams: number): Promise<boolean> {
  const list = loadAll();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return false;

  const cur = list[idx];
  const factor = Math.max(0, grams) / Math.max(1, cur.amount_weight_g || 1);

  const next: DiaryEntry = {
    ...cur,
    amount_weight_g: Math.round(Math.max(1, grams)),
    calories: Math.round((cur.calories || 0) * factor),
    protein_mg: Math.round((cur.protein_mg || 0) * factor),
    carbs_mg: Math.round((cur.carbs_mg || 0) * factor),
    fat_mg: Math.round((cur.fat_mg || 0) * factor),
    fiber_mg: Math.round((cur.fiber_mg || 0) * factor), // NEW
    updated_at_ms: Date.now(),
  };

  list[idx] = next;
  saveAll(list);
  return true;
}

/**
 * Optional helper that many apps use:
 * addEntryFromRecipe(profileId, day, recipe, grams)
 * If your existing code already has this with a different signature, keep that.
 * This version includes fiber_mg handling (defaults to 0 if missing).
 */
export async function addEntryFromRecipe(input: {
  profile_id: string;
  day: string;
  recipe_id?: string;
  label?: string;
  grams: number;
  per100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
}): Promise<DiaryEntry> {
  const list = loadAll();
  const now = Date.now();

  // scale per-100g values to the grams being logged
  const factor = Math.max(0, input.grams) / 100;

  const entry: DiaryEntry = {
    id: cryptoId(),
    profile_id: input.profile_id,
    day: input.day,
    recipe_id: input.recipe_id,
    label: input.label,

    amount_weight_g: Math.round(Math.max(1, input.grams)),
    calories: Math.max(0, Math.round((input.per100g.calories || 0) * factor)),

    protein_mg: Math.max(0, Math.round((input.per100g.protein_g || 0) * 1000 * factor)),
    carbs_mg:   Math.max(0, Math.round((input.per100g.carbs_g   || 0) * 1000 * factor)),
    fat_mg:     Math.max(0, Math.round((input.per100g.fat_g     || 0) * 1000 * factor)),
    fiber_mg:   Math.max(0, Math.round((input.per100g.fiber_g   || 0) * 1000 * factor)), // NEW

    created_at_ms: now,
    updated_at_ms: now,
  };

  list.push(entry);
  saveAll(list);
  return entry;
}

function cryptoId(): string {
  try {
    const arr = new Uint8Array(16);
    (self.crypto || (window as any).crypto).getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
