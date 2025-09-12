// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number; // grams (whole recipe)
  calories: number;       // kcal (whole recipe)
  protein_g: number;      // grams
  carbs_g: number;        // grams
  fat_g: number;          // grams
  fiber_g: number;        // grams ✅ NEW
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; } catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
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

export async function createRecipe(input: Omit<Recipe, 'id' | 'created_at_ms' | 'profile_id'>) {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const r: Recipe = {
    ...input,
    id: (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? (globalThis.crypto as any).randomUUID() : String(Date.now()),
    created_at_ms: Date.now(),
    profile_id: defaultProfileId(),
  };
  all.unshift(r);
  saveJSON(RECIPES_KEY, all);
  return r.id;
}

export async function updateRecipe(id: string, patch: Partial<Recipe>) {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Recipe not found');
  const next = { ...all[idx], ...patch, id: all[idx].id, profile_id: all[idx].profile_id };
  all[idx] = next;
  saveJSON(RECIPES_KEY, all);
  return true;
}
