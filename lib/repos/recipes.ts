// lib/repos/recipes.ts
'use client';

import { getDb, rows } from '../db/sql';

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

export async function createRecipe(profileId: string, r: Omit<Recipe,'id'|'version'|'created_at_ms'|'updated_at_ms'|'profile_id'>) {
  const { db, persist } = await getDb();
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const now = Date.now();
  db.run(`INSERT INTO recipe(id, profile_id, name, total_weight_g, calories, protein_mg, carbs_mg, fat_mg, version, created_at_ms, updated_at_ms)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, profileId, r.name, r.total_weight_g, r.calories, r.protein_mg, r.carbs_mg, r.fat_mg, 1, now, now]);
  await persist();
  return id;
}

export async function searchRecipes(profileId: string, prefix: string) {
  const { db } = await getDb();
  const q = `%${prefix.toLowerCase()}%`;
  const res = db.exec(`SELECT * FROM recipe WHERE profile_id = ? AND LOWER(name) LIKE ? ORDER BY name LIMIT 50`, [profileId, q]);
  return rows(res) as Recipe[];
}

export async function listRecipes(profileId: string) {
  const { db } = await getDb();
  const res = db.exec(`SELECT * FROM recipe WHERE profile_id = ? ORDER BY updated_at_ms DESC LIMIT 200`, [profileId]);
  return rows(res) as Recipe[];
}

export async function getDefaultProfileId(): Promise<string> {
  const { db } = await getDb();
  const res = db.exec('SELECT id FROM profile LIMIT 1');
  return res[0].values[0][0] as string;
}
