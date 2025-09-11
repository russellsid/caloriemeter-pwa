// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;      // total calories for whole recipe
  protein_mg: number;    // totals in mg (matches your existing app)
  carbs_mg: number;
  fat_mg: number;
  tags?: string[] | null;
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

/** Default to the first profile in local storage, else 'default' */
export function getDefaultProfileId(): string {
  const profiles = loadJSON<{ id: string; name: string; created_at_ms: number }[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}

/** Return all recipes (newest first) for the active profile */
export async function listRecipes(profileId?: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const pid = profileId || getDefaultProfileId();
  return all.filter(r => r.profile_id === pid).sort((a, b) => b.created_at_ms - a.created_at_ms);
}

/** Lightweight text search on name and tags */
export async function searchRecipes(q: string): Promise<Recipe[]> {
  const s = (q || '').trim().toLowerCase();
  if (!s) return listRecipes();
  const all = await listRecipes();
  return all.filter(r =>
    r.name.toLowerCase().includes(s) ||
    (r.tags || []).some(t => (t || '').toLowerCase().includes(s))
  );
}

/** Find one recipe by id (in current profile) */
export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  if (!id) return undefined;
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const pid = getDefaultProfileId();
  return all.find(r => r.id === id && r.profile_id === pid);
}

/** Save/replace a recipe (helper, optional) */
export async function upsertRecipe(rec: Recipe): Promise<void> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const idx = all.findIndex(r => r.id === rec.id);
  if (idx >= 0) all[idx] = rec; else all.unshift(rec);
  saveJSON(RECIPES_KEY, all);
}
