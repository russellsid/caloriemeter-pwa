// lib/repos/diary.ts
'use client';

import { getDb, rows } from '../db/sql';
import { diaryDayLocalFromUtcMs } from '../utils/dayBoundary';

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
  diary_day_local: string;
  created_at_ms: number;
};

export async function addEntryFromRecipe(profileId: string, recipeId: string, amountWeightG: number, loggedAtUtcMs: number) {
  const { db, persist } = await getDb();
  // fetch recipe
  const r = rows(db.exec(`SELECT * FROM recipe WHERE id = ?`, [recipeId]))[0];
  if (!r) throw new Error('Recipe not found');

  const scale = amountWeightG / r.total_weight_g;
  const calories = Math.round(r.calories * scale);
  const protein_mg = Math.round(r.protein_mg * scale);
  const carbs_mg = Math.round(r.carbs_mg * scale);
  const fat_mg = Math.round(r.fat_mg * scale);
  const day = diaryDayLocalFromUtcMs(loggedAtUtcMs, 2);

  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const now = Date.now();
  db.run(`INSERT INTO diary_entry(id, profile_id, logged_at_utc_ms, recipe_id, label, amount_weight_g, calories, protein_mg, carbs_mg, fat_mg, diary_day_local, created_at_ms)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, profileId, loggedAtUtcMs, recipeId, null, amountWeightG, calories, protein_mg, carbs_mg, fat_mg, day, now]);
  await persist();
  return id;
}

export async function listByDay(profileId: string, diaryDayLocal: string) {
  const { db } = await getDb();
  const res = db.exec(`SELECT * FROM diary_entry WHERE profile_id = ? AND diary_day_local = ? ORDER BY created_at_ms DESC`, [profileId, diaryDayLocal]);
  return rows(res) as DiaryEntry[];
}

export async function sumTotals(entries: DiaryEntry[]) {
  let c=0,p=0,carb=0,f=0;
  for (const e of entries) { c+=e.calories; p+=e.protein_mg; carb+=e.carbs_mg; f+=e.fat_mg; }
  return { calories:c, protein_g:(p/1000), carbs_g:(carb/1000), fat_g:(f/1000) };
}
