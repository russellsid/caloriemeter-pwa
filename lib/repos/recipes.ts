// lib/repos/recipes.ts
const LS_KEY = 'cm_recipes_v1';

export type Recipe = {
  id: string;
  profile_id: string;
  name: string;
  total_weight_g: number;
  calories: number;      // kcal (whole recipe)
  protein_mg: number;    // mg (whole recipe)
  carbs_mg: number;      // mg (whole recipe)
  fat_mg: number;        // mg (whole recipe)
  fiber_mg?: number;     // mg (whole recipe) — NEW optional
  created_at_ms: number;
  updated_at_ms?: number;
};

export function defaultProfileId(): string {
  if (typeof localStorage === 'undefined') return 'default';
  try {
    const raw = localStorage.getItem('cm_profiles_v1');
    if (!raw) return 'default';
    const obj = JSON.parse(raw);
    return obj?.default || 'default';
  } catch {
    return 'default';
  }
}
export async function getDefaultProfileId(): Promise<string> {
  return defaultProfileId();
}

function loadAll(): Recipe[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as any[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(list: Recipe[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function listRecipes(profileId?: string): Recipe[] {
  const pid = profileId || defaultProfileId();
  return loadAll().filter((r) => r.profile_id === pid);
}

export function searchRecipes(q: string, profileId?: string): Recipe[] {
  const s = (q || '').trim().toLowerCase();
  if (!s) return listRecipes(profileId);
  return listRecipes(profileId).filter(
    (r) => r.name.toLowerCase().includes(s) || r.id.includes(s)
  );
}

export function getRecipeById(id: string): Recipe | undefined {
  return loadAll().find((r) => r.id === id);
}

export async function createRecipe(
  profileId: string,
  input: {
    name: string;
    total_weight_g: number;
    calories: number;
    protein_mg: number;
    carbs_mg: number;
    fat_mg: number;
    fiber_mg?: number; // NEW: optional
  }
): Promise<Recipe> {
  const list = loadAll();
  const now = Date.now();
  const rec: Recipe = {
    id: cryptoRandomId(),
    profile_id: profileId || defaultProfileId(),
    name: String(input.name || '').trim(),
    total_weight_g: Math.max(1, Math.round(input.total_weight_g)),
    calories: Math.max(0, Math.round(input.calories)),
    protein_mg: Math.max(0, Math.round(input.protein_mg)),
    carbs_mg: Math.max(0, Math.round(input.carbs_mg)),
    fat_mg: Math.max(0, Math.round(input.fat_mg)),
    fiber_mg: typeof input.fiber_mg === 'number' ? Math.max(0, Math.round(input.fiber_mg)) : undefined,
    created_at_ms: now,
    updated_at_ms: now,
  };
  list.push(rec);
  saveAll(list);
  return rec;
}

export async function updateRecipe(
  id: string,
  patch: Partial<{
    name: string;
    total_weight_g: number;
    calories: number;
    protein_mg: number;
    carbs_mg: number;
    fat_mg: number;
    fiber_mg?: number; // NEW
  }>
): Promise<Recipe | undefined> {
  const list = loadAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return undefined;
  const cur = list[idx];
  const next: Recipe = {
    ...cur,
    ...sanitizePatch(patch),
    updated_at_ms: Date.now(),
  };
  list[idx] = next;
  saveAll(list);
  return next;
}

function sanitizePatch(patch: any) {
  const out: any = {};
  if (typeof patch.name === 'string') out.name = patch.name.trim();
  if (Number.isFinite(patch.total_weight_g)) out.total_weight_g = Math.max(1, Math.round(patch.total_weight_g));
  if (Number.isFinite(patch.calories)) out.calories = Math.max(0, Math.round(patch.calories));
  if (Number.isFinite(patch.protein_mg)) out.protein_mg = Math.max(0, Math.round(patch.protein_mg));
  if (Number.isFinite(patch.carbs_mg)) out.carbs_mg = Math.max(0, Math.round(patch.carbs_mg));
  if (Number.isFinite(patch.fat_mg)) out.fat_mg = Math.max(0, Math.round(patch.fat_mg));
  if (Number.isFinite(patch.fiber_mg)) out.fiber_mg = Math.max(0, Math.round(patch.fiber_mg)); // NEW
  return out;
}

function cryptoRandomId(): string {
  try {
    const arr = new Uint8Array(16);
    (self.crypto || (window as any).crypto).getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
