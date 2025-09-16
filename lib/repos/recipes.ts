// lib/repos/recipes.ts
'use client';

/**
 * LocalStorage-backed Recipes repo.
 * Conventions:
 * - Macros stored in milligrams: protein_mg, carbs_mg, fat_mg, fiber_mg? (NEW)
 * - calories for the whole recipe (kcal)
 * - total_weight_g for the whole recipe (g)
 */

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';
const CURRENT_VERSION = 1;

// ---------- Types ----------
export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;     // kcal (whole recipe)
  protein_mg: number;   // mg (whole recipe)
  carbs_mg: number;     // mg (whole recipe)
  fat_mg: number;       // mg (whole recipe)
  fiber_mg?: number;    // mg (whole recipe) — NEW optional for backward compatibility
  version: number;      // schema/data version
  created_at_ms: number;
  updated_at_ms: number;
};

// ---------- Tiny storage helpers ----------
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Profiles ----------
export function getDefaultProfileIdSync(): string {
  try {
    const raw = loadJSON<any>(PROFILES_KEY, null);
    return raw?.default || 'default';
  } catch {
    return 'default';
  }
}
export async function getDefaultProfileId(): Promise<string> {
  return getDefaultProfileIdSync();
}

// ---------- Queries ----------
export function listRecipes(profileId?: string): Recipe[] {
  const pid = profileId || getDefaultProfileIdSync();
  return loadJSON<Recipe[]>(RECIPES_KEY, []).filter((r) => r.profile_id === pid);
}

export function searchRecipes(q: string, profileId?: string): Recipe[] {
  const s = (q || '').trim().toLowerCase();
  if (!s) return listRecipes(profileId);
  return listRecipes(profileId).filter(
    (r) => r.name.toLowerCase().includes(s) || r.id.includes(s)
  );
}

export function getRecipeById(id: string): Recipe | undefined {
  return loadJSON<Recipe[]>(RECIPES_KEY, []).find((r) => r.id === id);
}

// ---------- Mutations ----------
function cryptoRandomId(): string {
  try {
    const arr = new Uint8Array(16);
    (self.crypto || (window as any).crypto).getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Create a recipe.
 * Input matches your previous signature that used Omit<Recipe, ...>.
 */
export async function createRecipe(
  profileId: string,
  input: Omit<Recipe, 'id' | 'version' | 'created_at_ms' | 'updated_at_ms' | 'profile_id'>
): Promise<Recipe> {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const now = Date.now();

  const rec: Recipe = {
    id: cryptoRandomId(),
    profile_id: profileId || getDefaultProfileIdSync(),
    name: String(input.name || '').trim(),
    total_weight_g: Math.max(1, Math.round(input.total_weight_g)),
    calories: Math.max(0, Math.round(input.calories)),
    protein_mg: Math.max(0, Math.round(input.protein_mg)),
    carbs_mg: Math.max(0, Math.round(input.carbs_mg)),
    fat_mg: Math.max(0, Math.round(input.fat_mg)),
    // NEW — optional; keep undefined if not provided to preserve backwards compatibility
    fiber_mg:
      typeof (input as any).fiber_mg === 'number'
        ? Math.max(0, Math.round((input as any).fiber_mg))
        : undefined,
    version: CURRENT_VERSION,
    created_at_ms: now,
    updated_at_ms: now,
  };

  list.push(rec);
  saveJSON(RECIPES_KEY, list);
  return rec;
}

/**
 * Update a recipe by id (partial fields).
 * Accepts fiber_mg in the patch too (optional).
 */
export async function updateRecipe(
  recipeId: string,
  updates: Partial<
    Omit<Recipe, 'id' | 'profile_id' | 'created_at_ms' | 'version'>
  >
): Promise<boolean> {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx === -1) throw new Error('Recipe not found');

  const current = list[idx];

  const next: Recipe = {
    ...current,
    name: typeof updates.name === 'string' ? updates.name.trim() : current.name,
    total_weight_g: Number.isFinite(updates.total_weight_g!)
      ? Math.max(1, Math.round(updates.total_weight_g!))
      : current.total_weight_g,
    calories: Number.isFinite(updates.calories!)
      ? Math.max(0, Math.round(updates.calories!))
      : current.calories,
    protein_mg: Number.isFinite(updates.protein_mg!)
      ? Math.max(0, Math.round(updates.protein_mg!))
      : current.protein_mg,
    carbs_mg: Number.isFinite(updates.carbs_mg!)
      ? Math.max(0, Math.round(updates.carbs_mg!))
      : current.carbs_mg,
    fat_mg: Number.isFinite(updates.fat_mg!)
      ? Math.max(0, Math.round(updates.fat_mg!))
      : current.fat_mg,
    fiber_mg: Number.isFinite((updates as any).fiber_mg)
      ? Math.max(0, Math.round((updates as any).fiber_mg))
      : current.fiber_mg, // NEW
    updated_at_ms: Date.now(),
  };

  list[idx] = next;
  saveJSON(RECIPES_KEY, list);
  return true;
}

export async function deleteRecipe(recipeId: string): Promise<boolean> {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const idx = list.findIndex((r) => r.id === recipeId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  saveJSON(RECIPES_KEY, list);
  return true;
}
