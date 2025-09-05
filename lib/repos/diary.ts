// lib/repos/diary.ts
'use client';
import { diaryDayLocalFromUtcMs } from '../utils/dayBoundary';

export type DiaryEntry = {
  id: string;
  profile_id: string;
  logged_at_utc_ms: number;
  recipe_id?: string | null;
  label?: string | null;              // recipe name (stored for display)
  amount_weight_g?: number | null;
  calories: number;
  protein_mg: number;
  carbs_mg: number;
  fat_mg: number;
  diary_day_local: string;
  created_at_ms: number;
};

const RECIPES_KEY = 'cm_recipes_v1';
const ENTRIES_KEY = 'cm_entries_v1';
const PROFILES_KEY = 'cm_profiles_v1';

function loadJSON<T>(k: string, def: T): T {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) as T : def; }
  catch { return def; }
}
function saveJSON<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
function defaultProfileId(): string {
  const profiles = loadJSON<{id:string,name:string,created_at_ms:number}[]>(PROFILES_KEY, []);
  return profiles[0]?.id || 'default';
}
function recipeNameById(recipeId: string | null | undefined): string | null {
  if (!recipeId) return null;
  const recipes = loadJSON<any[]>(RECIPES_KEY, []);
  const r = recipes.find(x => x.id === recipeId);
  return r ? r.name as string : null;
}

// Create entry from recipe (used by +Add)
export async function addEntryFromRecipe(
  profileId: string, recipeId: string, amountWeightG: number, loggedAtUtcMs: number
) {
  const recipes = loadJSON<any[]>(RECIPES_KEY, []);
  const r = recipes.find(x => x.id === recipeId);
  if (!r) throw new Error('Recipe not found');

  const scale = amountWeightG / r.total_weight_g;
  const entry: DiaryEntry = {
    id: (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? (globalThis.crypto as any).randomUUID() : String(Date.now()),
    profile_id: profileId || defaultProfileId(),
    logged_at_utc_ms: loggedAtUtcMs,
    recipe_id: recipeId,
    label: r.name,                    // <-- store the recipe name
    amount_weight_g: amountWeightG,
    calories: Math.round(r.calories * scale),
    protein_mg: Math.round(r.protein_mg * scale),
    carbs_mg: Math.round(r.carbs_mg * scale),
    fat_mg: Math.round(r.fat_mg * scale),
    diary_day_local: diaryDayLocalFromUtcMs(loggedAtUtcMs, 2),
    created_at_ms: Date.now()
  };

  const entries = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);
  entries.unshift(entry);
  saveJSON(ENTRIES_KEY, entries);
  return entry.id;
}

// List entries for a given day (also backfill missing labels)
export async function listByDay(profileId: string, diaryDayLocal: string) {
  const all = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);

  // Backfill labels for any older entries that missed the recipe name
  let mutated = false;
  for (const e of all) {
    if (!e.label && e.recipe_id) {
      const nm = recipeNameById(e.recipe_id);
      if (nm) { e.label = nm; mutated = true; }
    }
  }
  if (mutated) saveJSON(ENTRIES_KEY, all);

  // Return entries for the requested day/profile
  return all
    .filter(e => e.profile_id === (profileId || defaultProfileId()) && e.diary_day_local === diaryDayLocal)
    .sort((a,b)=>b.created_at_ms - a.created_at_ms);
}

// Totals helper
export async function sumTotals(entries: DiaryEntry[]) {
  let c=0,p=0,carb=0,f=0;
  for (const e of entries) { c+=e.calories; p+=e.protein_mg; carb+=e.carbs_mg; f+=e.fat_mg; }
  return { calories:c, protein_g:(p/1000), carbs_g:(carb/1000), fat_g:(f/1000) };
}

// Delete an entry by id
export async function deleteEntry(entryId: string) {
  const entries = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);
  const next = entries.filter(e => e.id !== entryId);
  saveJSON(ENTRIES_KEY, next);
  return entries.length !== next.length; // true if something was deleted
}

// Edit entry grams (recompute frozen totals)
// - Keeps original time/day (does NOT move across days)
// - Only for recipe-based entries
export async function updateEntryWeight(entryId: string, newWeightG: number) {
  if (!Number.isFinite(newWeightG) || newWeightG <= 0) throw new Error('Weight must be a positive number');

  const entries = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);
  const idx = entries.findIndex(e => e.id === entryId);
  if (idx === -1) throw new Error('Entry not found');

  const entry = entries[idx];
  if (!entry.recipe_id) throw new Error('Only recipe-based entries can be edited');

  const recipes = loadJSON<any[]>(RECIPES_KEY, []);
  const r = recipes.find(x => x.id === entry.recipe_id);
  if (!r) throw new Error('Recipe not found for this entry');

  const scale = newWeightG / r.total_weight_g;
  entry.amount_weight_g = newWeightG;
  entry.calories = Math.round(r.calories * scale);
  entry.protein_mg = Math.round(r.protein_mg * scale);
  entry.carbs_mg = Math.round(r.carbs_mg * scale);
  entry.fat_mg = Math.round(r.fat_mg * scale);
  if (!entry.label) entry.label = r.name;   // ensure label exists after edit

  entries[idx] = entry;
  saveJSON(ENTRIES_KEY, entries);
  return true;
}
