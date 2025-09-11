// lib/repos/settings.ts
'use client';

export type Targets = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;        // ← NEW
};

export type Settings = {
  targets: Targets;
  // (add other global settings here if needed)
};

const SETTINGS_KEY = 'cm_settings_v2'; // bump to v2 because we added fiber

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

const DEFAULTS: Settings = {
  targets: {
    calories_kcal: 1900,
    protein_g: 162,
    carbs_g: 133,
    fat_g: 80,
    fiber_g: 25,    // pick your preferred default; you can edit in Targets screen later
  }
};

export async function getSettings(): Promise<Settings> {
  const s = loadJSON<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    targets: { ...DEFAULTS.targets, ...(s.targets || {}) },
  };
}

export async function updateTargets(partial: Partial<Targets>) {
  const current = await getSettings();
  const next: Settings = { targets: { ...current.targets, ...partial } };
  saveJSON(SETTINGS_KEY, next);
  return next.targets;
}
