// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;     // kcal for the whole recipe weight
  protein_mg: number;   // mg for the whole recipe weight
  carbs_mg: number;     // mg for the whole recipe weight
  fat_mg: number;       // mg for the whole recipe weight
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; } catch { return def; }
}

function defaultProfileId(): string {
  const profiles = loadJSON<{ id: string; name: string; created_at_ms: number }[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}

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

/** Simple name contains() search (case-insensitive) */
export async function searchRecipes(q: string): Promise<Recipe[]> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const s = (q || '').trim().toLowerCase();
  if (!s) return all;
  return all.filter(r => r.name?.toLowerCase().includes(s));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return all.find(r => r.id === id) || null;
}
