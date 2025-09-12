import { DiaryEntry, Recipe } from "types";

// In-memory list of diary entries
let entries: DiaryEntry[] = [];

/** Get all diary entries for the current day. */
export function getEntries(): DiaryEntry[] {
  const todayStr = new Date().toISOString().split("T")[0];
  return entries.filter(entry => entry.date === todayStr);
}

/** Add a new diary entry for a given recipe and weight (in grams). */
export function addEntry(recipe: Recipe, weight: number): DiaryEntry {
  // Generate unique entry ID
  let entryId: string;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // Use Web Crypto API if available (browser environment)
    entryId = crypto.randomUUID();
  } else {
    // Fallback for Node.js or older environments
    entryId = "entry_" + Date.now().toString(36);
  }
  const todayStr = new Date().toISOString().split("T")[0];
  const factor = weight / 100;
  const entry: DiaryEntry = {
    id: entryId,
    recipeId: recipe.id,
    recipeName: recipe.name,
    weight: weight,
    protein_g: parseFloat((recipe.protein_g * factor).toFixed(1)),
    carbs_g: parseFloat((recipe.carbs_g * factor).toFixed(1)),
    fat_g: parseFloat((recipe.fat_g * factor).toFixed(1)),
    fiber_g: parseFloat((recipe.fiber_g * factor).toFixed(1)),
    kcal: parseFloat((recipe.kcal * factor).toFixed(1)),
    date: todayStr
  };
  entries.push(entry);
  return entry;
}

/** Update the weight (in grams) of an existing diary entry (recalculating its nutritional values). */
export function updateEntryWeight(entryId: string, newWeight: number): DiaryEntry | null {
  const entry = entries.find(e => e.id === entryId);
  if (!entry) {
    return null;
  }
  const factor = newWeight / entry.weight;
  entry.weight = newWeight;
  // Recalculate macros and calories proportionally to the weight change
  entry.protein_g = parseFloat((entry.protein_g * factor).toFixed(1));
  entry.carbs_g = parseFloat((entry.carbs_g * factor).toFixed(1));
  entry.fat_g = parseFloat((entry.fat_g * factor).toFixed(1));
  entry.fiber_g = parseFloat((entry.fiber_g * factor).toFixed(1));
  entry.kcal = parseFloat((entry.kcal * factor).toFixed(1));
  return entry;
}

/** Remove a diary entry by its ID. */
export function removeEntry(entryId: string): void {
  entries = entries.filter(e => e.id !== entryId);
}

/** Sum up the total nutrients consumed for the current day. */
export function sumTotals(): { protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; kcal: number } {
  const todayEntries = getEntries();
  let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0, totalKcal = 0;
  for (const e of todayEntries) {
    totalProtein += e.protein_g;
    totalCarbs += e.carbs_g;
    totalFat += e.fat_g;
    totalFiber += e.fiber_g;
    totalKcal += e.kcal;
  }
  // Round totals to one decimal place
  return {
    protein_g: parseFloat(totalProtein.toFixed(1)),
    carbs_g: parseFloat(totalCarbs.toFixed(1)),
    fat_g: parseFloat(totalFat.toFixed(1)),
    fiber_g: parseFloat(totalFiber.toFixed(1)),
    kcal: parseFloat(totalKcal.toFixed(1))
  };
}
