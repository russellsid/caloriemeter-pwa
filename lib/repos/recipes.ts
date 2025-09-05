// lib/repos/recipes.ts
'use client';

// ---- localStorage helpers ----
export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;
  protein_mg: number;
  carbs_mg: number;
  fat_mg: number;
  version: number;
  created_at_ms: number;
  updated_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) as T : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// Ensure a default profile exists
function ensureDefaultProfile(): string {
  const profiles = loadJSON<{id:string,name:string,created_at_ms:number}[]>(PROFILES_KEY, []);
  if (profiles.length) return profiles[0].id;
  const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? (globalThis.crypto as any).randomUUID()
    : String(Date.now());
  profiles.push({ id, name: 'Sid', created_at_ms: Date.now() });
  saveJSON(PROFILES_KEY, profiles);
  return id;
}

export async function getDefaultProfileId(): Promise<string> {
  return ensureDefaultProfile();
}

// ---- Recipes API ----
export async function createRecipe(
  profileId: string,
  r: Omit<Recipe,'id'|'version'|'created_at_ms'|'updated_at_ms'|'profile_id'>
) {
  const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? (globalThis.crypto as any).randomUUID()
    : String(Date.now());
  const now = Date.now();

  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  list.push({
    id,
    profile_id: profileId || ensureDefaultProfile(),
    name: r.name,
    total_weight_g: r.total_weight_g,
    calories: r.calories,
    protein_mg: r.protein_mg,
    carbs_mg: r.carbs_mg,
    fat_mg: r.fat_mg,
    version: 1,
    created_at_ms: now,
    updated_at_ms: now
  });
  saveJSON(RECIPES_KEY, list);
  return id;
}

export async function searchRecipes(profileId: string, prefix: string) {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const q = prefix.trim().toLowerCase();
  return list
    .filter(r => (r.profile_id === (profileId || ensureDefaultProfile())) &&
                 r.name.toLowerCase().includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name))
    .slice(0,50);
}

export async function listRecipes(profileId: string) {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return list
    .filter(r => r.profile_id === (profileId || ensureDefaultProfile()))
    .sort((a,b)=>b.updated_at_ms - a.updated_at_ms)
    .slice(0,200);
}

// NEW: fetch a single recipe by id (used for editing entries)
export async function getRecipeById(recipeId: string): Promise<Recipe | undefined> {
  const list = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return list.find(r => r.id === recipeId);
}
