// lib/repos/diary.ts
'use client';

import { diaryDayLocalFromUtcMs } from '../utils/dayBoundary';
import { getRecipeById } from './recipes';

export type DiaryEntry = {
  id: string;
  profile_id: string;
  logged_at_utc_ms: number;
  recipe_id?: string | null;
  label?: string | null;
  amount_weight_g?: number | null;
  calories: number;
  protein_mg: number;
  carbs_mg: number;
  fat_mg: number;
  fiber_mg: number;     // ✅ NEW
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
    label: r.name || null,
    amount_weight_g: amountWeightG,
    calories: Math.round(r.calories * scale),
    protein_mg: Math.round((r.protein_g * 1000) * scale),
    carbs_mg: Math.round((r.carbs_g * 1000) * scale),
    fat_mg: Math.round((r.fat_g * 1000) * scale),
    fiber_mg: Math.round((r.fiber_g * 1000) * scale),   // ✅ NEW
    diary_day_local: diaryDayLocalFromUtcMs(loggedAtUtcMs, 2),
    created_at_ms: Date.now()
  };

  const entries = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);
  entries.unshift(entry);
  saveJSON(ENTRIES_KEY, entries);
  return entry.id;
}

export async function listByDay(profileId: string, diaryDayLocal: string) {
  const entries = loadJSON<DiaryEntry[]>(ENTRIES_KEY, []);
  return entries
    .filter(e => e.profile_id === (profileId || defaultProfileId()) && e.diary_day_local === diaryDayLocal)
    .sort((a,b)=>b.created_at_ms - a.created_at_ms);
}

export async function sumTotals(entries: DiaryEntry[]) {
  let c=0,p=0,carb=0,f=0,fib=0;
  for (const e of entries) { c+=e.calories; p+=e.protein_mg; carb+=e.carbs_mg; f+=e.fat_mg; fib+=e.fiber_mg; }
  return { 
    calories:c, 
    protein_g:(p/1000), 
    carbs_g:(carb/1000), 
    fat_g:(f/1000),
    fiber_g:(fib/1000)   // ✅ NEW
  };
}
