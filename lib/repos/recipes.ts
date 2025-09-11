// lib/repos/recipes.ts
'use client';

export type Recipe = {
  id: string;
  name: string;
  total_weight_g: number;

  calories: number;     // kcal per WHOLE recipe
  protein_mg: number;   // mg per WHOLE recipe
  carbs_mg: number;     // mg per WHOLE recipe
  fat_mg: number;       // mg per WHOLE recipe
  fiber_mg?: number;    // mg per WHOLE recipe (optional for older data)
  
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export async function listRecipes(): Promise<Recipe[]> {
  return loadJSON<Recipe[]>(RECIPES_KEY, []);
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  return all.find(r => r.id === id);
}

export async function createRecipe(r: Omit<Recipe, 'id'|'created_at_ms'>): Promise<string> {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? (globalThis.crypto as any).randomUUID() : String(Date.now());
  const rec: Recipe = { ...r, id, created_at_ms: Date.now() };
  all.unshift(rec);
  saveJSON(RECIPES_KEY, all);
  return id;
}

export async function updateRecipe(updated: Recipe) {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  const i = all.findIndex(r => r.id === updated.id);
  if (i === -1) throw new Error('Recipe not found');
  all[i] = updated;
  saveJSON(RECIPES_KEY, all);
}

export async function deleteRecipe(id: string) {
  const all = loadJSON<Recipe[]>(RECIPES_KEY, []);
  saveJSON(RECIPES_KEY, all.filter(r => r.id !== id));
}
