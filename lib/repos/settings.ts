// lib/repos/settings.ts
'use client';

export type Targets = {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  // calories is derived but we keep it so UI can show a fixed target
  calories?: number;
};

const TARGETS_KEY = 'cm_targets_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

/** kcal = 4*protein + 4*carbs + 9*fat */
export function calcCaloriesFromMacros(protein_g: number, carbs_g: number, fat_g: number): number {
  const p = Number(protein_g) || 0;
  const c = Number(carbs_g) || 0;
  const f = Number(fat_g) || 0;
  return Math.round(4 * p + 4 * c + 9 * f);
}

export async function getTargets(): Promise<Targets> {
  const t = loadJSON<Targets | null>(TARGETS_KEY, null);
  if (!t) {
    // sensible empty defaults
    return { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0 };
  }
  // backfill calories if missing
  if (t.calories == null) {
    t.calories = calcCaloriesFromMacros(t.protein_g, t.carbs_g, t.fat_g);
  }
  return t;
}

export async function saveTargets(t: Targets): Promise<Targets> {
  const out: Targets = {
    protein_g: Number(t.protein_g) || 0,
    carbs_g: Number(t.carbs_g) || 0,
    fat_g: Number(t.fat_g) || 0,
  };
  out.calories = calcCaloriesFromMacros(out.protein_g, out.carbs_g, out.fat_g);
  saveJSON(TARGETS_KEY, out);
  return out;
}
