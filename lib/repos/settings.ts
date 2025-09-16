// lib/repos/settings.ts
export type Targets = {
  calories?: number;      // kcal (derived if missing)
  protein_g: number;      // grams
  carbs_g: number;        // grams
  fat_g: number;          // grams
  fiber_g: number;        // grams (NEW)
};

const LS_KEY = 'cm_targets_v1';

function num(n: unknown, fallback = 0): number {
  const v = typeof n === 'string' ? Number(n) : (n as number);
  return Number.isFinite(v) ? v : fallback;
}

export function calcCaloriesFromMacros(p_g: number, c_g: number, f_g: number): number {
  const kcal = Math.round(num(p_g) * 4 + num(c_g) * 4 + num(f_g) * 9);
  return kcal < 0 ? 0 : kcal;
}

function defaults(): Targets {
  // Default fiber target = 25 g (as agreed in project notes)
  return { protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 25, calories: 0 };
}

export async function getTargets(): Promise<Targets> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const base = defaults();

    const t: Targets = {
      protein_g: num(parsed?.protein_g, base.protein_g),
      carbs_g: num(parsed?.carbs_g, base.carbs_g),
      fat_g: num(parsed?.fat_g, base.fat_g),
      fiber_g: num(parsed?.fiber_g, base.fiber_g), // NEW
      calories: num(parsed?.calories, 0),
    };

    // Backfill calories if not stored or zero
    if (!t.calories || t.calories <= 0) {
      t.calories = calcCaloriesFromMacros(t.protein_g, t.carbs_g, t.fat_g);
    }

    return t;
  } catch {
    return defaults();
  }
}

/**
 * Save targets (grams) and auto-calc calories.
 * Backward-compatible:
 *  - saveTargets(p, c, f)  -> fiber defaults to existing or 25g
 *  - saveTargets(p, c, f, fiber)
 */
export async function saveTargets(
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  fiber_g?: number
): Promise<Targets> {
  const existing = await getTargets();
  const out: Targets = {
    protein_g: num(protein_g),
    carbs_g: num(carbs_g),
    fat_g: num(fat_g),
    fiber_g: typeof fiber_g === 'undefined' ? existing.fiber_g : num(fiber_g),
    calories: 0,
  };
  out.calories = calcCaloriesFromMacros(out.protein_g, out.carbs_g, out.fat_g);

  localStorage.setItem(LS_KEY, JSON.stringify(out));
  return out;
}
