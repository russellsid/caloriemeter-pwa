// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number; // grams for whole recipe
  calories: number;       // kcal for whole recipe

  /** Canonical macros in grams (preferred going forward) */
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;

  /** Back-compat fields in mg (many pages still read these) */
  protein_mg?: number;
  carbs_mg?: number;
  fat_mg?: number;

  /** Optional fiber (grams); back-compat mg will be computed if needed */
  fiber_g?: number;
  fiber_mg?: number;

  created_at_ms: number;
};

const RECIPES_KEY  = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

function defaultProfileId(): string {
  const profiles = loadJSON<{ id: string; name: string; created_at_ms: number }[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}
export function getDefaultProfileId(): string { return defaultProfileId(); }

/** Normalize a recipe object to include BOTH grams and mg fields (computed). */
function normalizeRecipe(r: any): Recipe {
  const protein_g = Number.isFinite(r?.protein_g) ? Number(r.protein_g)
                    : Number.isFinite(r?.protein_mg) ? Number(r.protein_mg) / 1000 : 0;
  const carbs_g   = Number.isFinite(r?.carbs_g)   ? Number(r.carbs_g)
                    : Number.isFinite(r?.carbs_mg)   ? Number(r.carbs_mg)   / 1000 : 0;
  const fat_g     = Number.isFinite(r?.fat_g)     ? Number(r.fat_g)
                    : Number.isFinite(r?.fat_mg)     ? Number(r.fat_mg)     / 1000 : 0;
  const fiber_g   = Number.isFinite(r?.fiber_g)   ? Number(r.fiber_g)
                    : Number.isFinite(r?.fiber_mg)   ? Number(r.fiber_mg)   / 1000 : 0;

  const out: Recipe = {
    id: String(r.id),
    profile_id: String(r.profile_id || defaultProfileId()),
    name: String(r.name || ''),
    total_weight_g: Number(r.total_weight_g) || 100,
    calories: Math.round(Number(r.calories) || 0),
    protein_g, carbs_g, fat_g, fiber_g,
    protein_mg: Math.round(protein_g * 1000),
    carbs_mg:   Math.round(carbs_g   * 1000),
    fat_mg:     Math.round(fat_g     * 1000),
    fiber_mg:   Math.round(fiber_g   * 1000),
    created_at_ms: Number(r.created_at_ms) || Date.now(),
  };
  return out;
}

/** Return all recipes for a profile, newest first (normalized with g + mg) */
export async function listRecipes(profileId?: string): Promise<Recipe[]> {
  const all = loadJSON<any[]>(RECIPES_KEY, []);
  const pid = profileId || defaultProfileId();
  return all
    .filter(r => (r.profile_id || defaultProfileId()) === pid)
    .map(normalizeRecipe)
    .sort((a, b) => b.created_at_ms - a.created_at_ms);
}

/**
 * Search by name.
 * Supports: searchRecipes("apple")  OR  searchRecipes(profileId, "apple")
 */
export async function searchRecipes(...args: any[]): Promise<Recipe[]> {
  const all = loadJSON<any[]>(RECIPES_KEY, []);

  let pid = defaultProfileId();
  let q = '';
  if (args.length === 1) q = String(args[0] ?? '');
  else { pid = String(args[0] ?? pid); q = String(args[1] ?? ''); }

  const base = all.filter(r => (r.profile_id || defaultProfileId()) === pid).map(normalizeRecipe);
  const s = q.trim().toLowerCase();
  if (!s) return base;
  return base.filter(r => r.name?.toLowerCase().includes(s));
}

/** Find one (normalized) */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = loadJSON<any[]>(RECIPES_KEY, []);
  const raw = all.find(r => String(r.id) === String(id));
  return raw ? normalizeRecipe(raw) : null;
}

/** Optional helper if you create/update recipes elsewhere (accepts g or mg). */
export async function upsertRecipe(input: Partial<Recipe> & { id: string }): Promise<void> {
  const all = loadJSON<any[]>(RECIPES_KEY, []);
  const idx = all.findIndex(r => String(r.id) === String(input.id));

  // Canonicalize to grams first, then store (also include mg for back-compat)
  const normalized = normalizeRecipe({
    ...all[idx],
    ...input,
    // If caller supplied only g, mg will be recomputed by normalizeRecipe and saved.
    // If caller supplied only mg, g will be derived.
  });

  // Store both g and mg fields so old UI keeps working
  const toStore = {
    id: normalized.id,
    profile_id: normalized.profile_id,
    name: normalized.name,
    total_weight_g: normalized.total_weight_g,
    calories: normalized.calories,
    protein_g: normalized.protein_g,
    carbs_g: normalized.carbs_g,
    fat_g: normalized.fat_g,
    fiber_g: normalized.fiber_g,
    protein_mg: normalized.protein_mg,
    carbs_mg: normalized.carbs_mg,
    fat_mg: normalized.fat_mg,
    fiber_mg: normalized.fiber_mg,
    created_at_ms: normalized.created_at_ms,
  };

  if (idx >= 0) all[idx] = toStore; else all.unshift(toStore);
  saveJSON(RECIPES_KEY, all);
}
