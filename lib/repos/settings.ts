// lib/repos/settings.ts
'use client';

/** Targets that power the home screen bars (per day) — all in grams except calories */
export type Targets = {
  calories?: number;   // kcal (optional; derived if missing)
  protein_g: number;   // grams
  carbs_g: number;     // grams
  fat_g: number;       // grams
  fiber_g: number;     // grams
};

const TARGETS_KEY = 'cm_targets_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; } catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

/** 4/4/9 rule (expects grams) */
export function calcCaloriesFromMacros(p_g: number, c_g: number, f_g: number): number {
  const p = Number(p_g) || 0, c = Number(c_g) || 0, f = Number(f_g) || 0;
  return Math.round(4 * p + 4 * c + 9 * f);
}

/** Defaults (in grams) */
const DEFAULTS: Targets = {
  protein_g: 120,
  carbs_g:   160,
  fat_g:     60,
  fiber_g:   25,
  calories:  calcCaloriesFromMacros(120, 160, 60),
};

/** Read current targets; backfill calories if missing */
export function getTargets(): Targets {
  const t = loadJSON<Targets>(TARGETS_KEY, DEFAULTS);
  const kcal = Number.isFinite(t.calories) ? Number(t.calories) : calcCaloriesFromMacros(t.protein_g, t.carbs_g, t.fat_g);
  return { ...t, calories: kcal };
}

/** Persist targets (normalize to numbers; (re)derive calories if absent) */
export function saveTargets(next: Targets) {
  const clean: Targets = {
    protein_g: Number(next.protein_g) || 0,
    carbs_g:   Number(next.carbs_g)   || 0,
    fat_g:     Number(next.fat_g)     || 0,
    fiber_g:   Number(next.fiber_g)   || 0,
    calories:  Number.isFinite(next.calories)
      ? Number(next.calories)
      : calcCaloriesFromMacros(next.protein_g, next.carbs_g, next.fat_g),
  };
  saveJSON(TARGETS_KEY, clean);
}
