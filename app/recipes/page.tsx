import { getAllRecipes } from "lib/repos/recipes";
import Link from "next/link";
import { Recipe } from "types";

export default function RecipesPage() {
  const recipes: Recipe[] = getAllRecipes();
  return (
    <main>
      <h2>Recipes</h2>
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id}>
            <strong>{recipe.name}</strong><br />
            <small>
              {recipe.kcal.toFixed(1)} kcal per 100g,{" "}
              Protein: {recipe.protein_g.toFixed(1)} g,{" "}
              Carbs: {recipe.carbs_g.toFixed(1)} g,{" "}
              Fat: {recipe.fat_g.toFixed(1)} g,{" "}
              Fiber: {recipe.fiber_g.toFixed(1)} g
            </small>
          </li>
        ))}
      </ul>
      <p><Link href="/recipes/new">Add New Recipe</Link></p>
    </main>
  );
}
