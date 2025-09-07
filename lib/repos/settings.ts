// lib/repos/settings.ts
'use client';

export type Targets = {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number; // derived
};

const TARGETS_KEY = 'cm_targets_v1';

// kcal factors
const KCAL_P = 4;
const KCAL_C = 4;
const KCAL_F = 9;

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) as T : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export function calcCaloriesFromMacros(p_g: number, c_g: number, f_g: number) {
  return Math.round(p_g * KCAL_P + c_g * KCAL_C + f_g * KCAL_F);
}

export async function getTargets(): Promise<Targets> {
  const t = loadJSON<Targets>(TARGETS_KEY, {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    calories: 0
  });
  // ensure calories is consistent
  const kcal = calcCaloriesFromMacros(t.protein_g, t.carbs_g, t.fat_g);
  if (kcal !== t.calories) {
    t.calories = kcal;
    saveJSON(TARGETS_KEY, t);
  }
  return t;
}

// Save grams; calories auto-derived
export async function saveTargets(p_g: number, c_g: number, f_g: number) {
  const calories = calcCaloriesFromMacros(p_g, c_g, f_g);
  const t: Targets = { protein_g: p_g, carbs_g: c_g, fat_g: f_g, calories };
  saveJSON(TARGETS_KEY, t);
  return t;
}
