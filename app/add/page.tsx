"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addEntry } from "lib/repos/diary";
import recipesData from "data/recipes.json";
import { Recipe } from "types";

const recipeList: Recipe[] = Array.isArray(recipesData) ? recipesData : recipesData.recipes;

export default function AddPage() {
  const [recipeId, setRecipeId] = useState<string>(recipeList.length > 0 ? recipeList[0].id : "");
  const [weight, setWeight] = useState<string>("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRecipe = recipeList.find(r => r.id === recipeId);
    if (selectedRecipe) {
      // Add diary entry for the selected recipe and weight
      addEntry(selectedRecipe, Number(weight));
    }
    // Navigate back to home page after adding
    router.push("/");
  };

  return (
    <main>
      <h2>Add Diary Entry</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="recipe">Recipe:</label>
          <select 
            id="recipe" 
            value={recipeId} 
            onChange={(e) => setRecipeId(e.target.value)} 
            required
          >
            <option value="" disabled>-- Select Recipe --</option>
            {recipeList.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="weight">Weight (g):</label>
          <input 
            id="weight" 
            type="number" 
            step="1" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            placeholder="grams" 
            required 
          />
        </div>
        <button type="submit">Add to Diary</button>
      </form>
    </main>
  );
}
