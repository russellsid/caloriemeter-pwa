import fs from "fs";
import path from "path";
import { Recipe } from "types";

const dataPath = path.join(process.cwd(), "data", "recipes.json");

/** Retrieve all recipes from the JSON data file. */
export function getAllRecipes(): Recipe[] {
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data as Recipe[];
    }
    if (data.recipes) {
      return data.recipes as Recipe[];
    }
    return [];
  } catch (err) {
    console.error("Error reading recipes.json:", err);
    return [];
  }
}

/** Save the full recipes list to the JSON data file. */
function saveAllRecipes(recipes: Recipe[]): void {
  fs.writeFileSync(dataPath, JSON.stringify(recipes, null, 2));
}

/** Add a new recipe to the data file (and return the created Recipe). */
export function addRecipe(recipeData: { name: string; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; kcal: number }): Recipe {
  const recipes = getAllRecipes();
  // Generate a unique ID for the new recipe
  const newRecipeId = `recipe_${Date.now()}`;
  const newRecipe: Recipe = {
    id: newRecipeId,
    name: recipeData.name,
    protein_g: recipeData.protein_g,
    carbs_g: recipeData.carbs_g,
    fat_g: recipeData.fat_g,
    fiber_g: recipeData.fiber_g,
    kcal: recipeData.kcal
  };
  recipes.push(newRecipe);
  saveAllRecipes(recipes);
  return newRecipe;
}

/** Update an existing recipe by ID with new data. Returns the updated Recipe or null if not found. */
export function updateRecipe(id: string, updatedData: { name?: string; protein_g?: number; carbs_g?: number; fat_g?: number; fiber_g?: number; kcal?: number }): Recipe | null {
  const recipes = getAllRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) {
    return null;
  }
  // Merge updated fields
  recipes[index] = { ...recipes[index], ...updatedData };
  saveAllRecipes(recipes);
  return recipes[index];
}

/** Find a recipe by its ID. */
export function getRecipeById(id: string): Recipe | undefined {
  const recipes = getAllRecipes();
  return recipes.find(r => r.id === id);
}
