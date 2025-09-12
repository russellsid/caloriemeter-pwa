import { addRecipe } from "lib/repos/recipes";
import { redirect } from "next/navigation";

export async function createRecipeAction(formData: FormData) {
  "use server";
  const name = formData.get("name")?.toString() || "";
  const kcal = parseFloat(formData.get("kcal")?.toString() || "0") || 0;
  const protein = parseFloat(formData.get("protein")?.toString() || "0") || 0;
  const carbs = parseFloat(formData.get("carbs")?.toString() || "0") || 0;
  const fat = parseFloat(formData.get("fat")?.toString() || "0") || 0;
  const fiber = parseFloat(formData.get("fiber")?.toString() || "0") || 0;
  addRecipe({ name, protein_g: protein, carbs_g: carbs, fat_g: fat, fiber_g: fiber, kcal });
  redirect("/recipes");
}

export default function NewRecipePage() {
  return (
    <main>
      <h2>New Recipe</h2>
      <form action={createRecipeAction}>
        <div>
          <label htmlFor="name">Name:</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div>
          <label htmlFor="kcal">Calories (kcal per 100g):</label>
          <input id="kcal" name="kcal" type="number" step="0.1" required />
        </div>
        <div>
          <label htmlFor="protein">Protein (g per 100g):</label>
          <input id="protein" name="protein" type="number" step="0.1" required />
        </div>
        <div>
          <label htmlFor="carbs">Carbs (g per 100g):</label>
          <input id="carbs" name="carbs" type="number" step="0.1" required />
        </div>
        <div>
          <label htmlFor="fat">Fat (g per 100g):</label>
          <input id="fat" name="fat" type="number" step="0.1" required />
        </div>
        <div>
          <label htmlFor="fiber">Fiber (g per 100g):</label>
          <input id="fiber" name="fiber" type="number" step="0.1" required />
        </div>
        <button type="submit">Create Recipe</button>
      </form>
    </main>
  );
}
