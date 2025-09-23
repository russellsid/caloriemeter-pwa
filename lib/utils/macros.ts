// lib/utils/macros.ts

/**
 * Calculate calories from macros using the standard
 * Atwater conversion factors:
 *  - Protein: 4 kcal per gram
 *  - Carbohydrates: 4 kcal per gram
 *  - Fat: 9 kcal per gram
 *
 * @param protein_g grams of protein
 * @param carbs_g grams of carbohydrates
 * @param fat_g grams of fat
 * @returns total calories (kcal)
 */
export function macrosToCalories(
  protein_g: number,
  carbs_g: number,
  fat_g: number
): number {
  const p = Number(protein_g) || 0;
  const c = Number(carbs_g) || 0;
  const f = Number(fat_g) || 0;
  return p * 4 + c * 4 + f * 9;
}
