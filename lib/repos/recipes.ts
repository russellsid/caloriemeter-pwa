// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;   // kcal for the whole recipe
  protein_g: number;  // grams for the whole recipe
  carbs_g: number;    // grams for the whole recipe
  fat_g: number;      // grams for the whole recipe
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

// ---------- storage helpers ----------
function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// ---------- profile helper ----------
function defaultProfileId(): string {
  const profiles = loadJSON<{ id: string; name: string; created_at_ms: number }[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}
export function getDefaultProfileId(): string {
  return defaultProfileId();
}

// ---------- reads ----------
export async function listRecipes(profileId?: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const pid = profileId || defaultProfileId();
  return all
    .filter(r => r.profile_id === pid)
    .sort((a, b) => b.created_at_ms - a.created_at_ms);
}

/** Simple case-insensitive name search scoped to profile */
export async function searchRecipes(profileId: string, q: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const s = (q || '').trim().toLowerCase();
  return all
    .filter(r => r.profile_id === (profileId || defaultProfileId()))
    .filter(r => !s || (r.name || '').toLowerCase().includes(s))
    .sort((a, b) => b.created_at_ms - a.created_at_ms);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return all.find(r => r.id === id) || null;
}

// ---------- writes ----------
export async function createRecipe(input: {
  profile_id?: string;
  name: string;
  total_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}): Promise<string> {
  const id =
    (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as any).randomUUID()
      : String(Date.now());

  const recipe: Recipe = {
    id,
    profile_id: input.profile_id || defaultProfileId(),
    name: String(input.name || '').trim(),
    total_weight_g: Number(input.total_weight_g) || 0,
    calories: Math.round(Number(input.calories) || 0),
    protein_g: Number(input.protein_g) || 0,
    carbs_g: Number(input.carbs_g) || 0,
    fat_g: Number(input.fat_g) || 0,
    created_at_ms: Date.now(),
  };

  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  all.unshift(recipe);
  saveJSON(RECIPES_KEY, all);
  return id;
}

export async function updateRecipe(id: string, patch: Partial<{
  name: string;
  total_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}>): Promise<boolean> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return false;

  const r = all[idx];
  const next: Recipe = {
    ...r,
    ...(patch.name !== undefined ? { name: String(patch.name) } : {}),
    ...(patch.total_weight_g !== undefined ? { total_weight_g: Number(patch.total_weight_g) || 0 } : {}),
    ...(patch.calories !== undefined ? { calories: Math.round(Number(patch.calories) || 0) } : {}),
    ...(patch.protein_g !== undefined ? { protein_g: Number(patch.protein_g) || 0 } : {}),
    ...(patch.carbs_g !== undefined ? { carbs_g: Number(patch.carbs_g) || 0 } : {}),
    ...(patch.fat_g !== undefined ? { fat_g: Number(patch.fat_g) || 0 } : {}),
  };

  all[idx] = next;
  saveJSON(RECIPES_KEY, all);
  return true;
}
