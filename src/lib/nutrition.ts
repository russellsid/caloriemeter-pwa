import type { FoodItem, Per100g } from '@/types/food';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Scale an item's per_100g nutrition to an arbitrary grams quantity.
 * Always returns values rounded to 1 decimal place.
 */
export function macrosForServing(item: FoodItem, grams: number): Per100g {
  const f = Math.max(0, grams) / 100; // guard negatives
  const p = item.per_100g;
  return {
    kcal: round1(p.kcal * f),
    protein_g: round1(p.protein_g * f),
    carbs_g: round1(p.carbs_g * f),
    fat_g: round1(p.fat_g * f),
    fiber_g: round1(p.fiber_g * f),
  };
}
