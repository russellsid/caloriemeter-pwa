// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;     // kcal for the whole recipe weight
  protein_g: number;    // grams for the whole recipe weight
  carbs_g: number;      // grams for the whole recipe weight
  fat_g: number;        // grams for the whole recipe weight
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

// ---------- helpers ----------
function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; } catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function defaultProfileId(): string {
  const profiles = loadJSON<{ id: string; name: string; created_at_ms: number }[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}

// ---------- reads ----------
export function getDefaultProfileId() {
  return defaultProfileId();
}

export async function listRecipes(profileId?: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const pid = profileId || defaultProfileId();
  return all
    .filter(r => r.profile_id === pid)
    .sort((a, b) => b.created_at_ms - a.created_at_ms);
}

/** case-insensitive contains() on name within a profile */
export async function searchRecipes(profileId: string, q: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const s = (q || '').trim().toLowerCase();
  if (!s) return all.filter(r => r.profile_id === profileId);
  return all.filter(r => r.profile_id === profileId && (r.name || '').toLowerCase().includes(s));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return all.find(r => r.id === id) || null;
}

// ---------- writes ----------
export async function createRecipe(
  profileId: string,
  data: {
    name: string;
    total_weight_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }
): Promise<Recipe> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const rec: Recipe = {
    id: uid(),
    profile_id: profileId,
    name: data.name ?? '',
    total_weight_g: Number(data.total_weight_g) || 0,
    calories: Number(data.calories) || 0,
    protein_g: Number(data.protein_g) || 0,
    carbs_g: Number(data.carbs_g) || 0,
    fat_g: Number(data.fat_g) || 0,
    created_at_ms: Date.now(),
  };
  all.push(rec);
  saveJSON(RECIPES_KEY, all);
  return rec;
}

export async function updateRecipe(
  id: string,
  patch: Partial<Omit<Recipe, 'id' | 'profile_id' | 'created_at_ms'>>
): Promise<Recipe> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const i = all.findIndex(r => r.id === id);
  if (i < 0) throw new Error('Recipe not found');

  const current = all[i];
  const next: Recipe = {
    ...current,
    ...patch,
    // coerce numeric fields if they are provided in patch
    total_weight_g: patch.total_weight_g !== undefined ? Number(patch.total_weight_g) : current.total_weight_g,
    calories:      patch.calories       !== undefined ? Number(patch.calories)       : current.calories,
    protein_g:     patch.protein_g      !== undefined ? Number(patch.protein_g)      : current.protein_g,
    carbs_g:       patch.carbs_g        !== undefined ? Number(patch.carbs_g)        : current.carbs_g,
    fat_g:         patch.fat_g          !== undefined ? Number(patch.fat_g)          : current.fat_g,
  };

  all[i] = next;
  saveJSON(RECIPES_KEY, all);
  return next;
}
