import { getTargets, updateTargets } from "lib/repos/settings";

export async function updateTargetsAction(formData: FormData) {
  "use server";
  const kcal = Number(formData.get("kcal")) || 0;
  const protein = parseFloat(formData.get("protein")?.toString() || "0") || 0;
  const carbs = parseFloat(formData.get("carbs")?.toString() || "0") || 0;
  const fat = parseFloat(formData.get("fat")?.toString() || "0") || 0;
  const fiber = parseFloat(formData.get("fiber")?.toString() || "0") || 0;
  const newTargets = {
    kcal,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    fiber_g: fiber
  };
  updateTargets(newTargets);
}

export default function SettingsPage() {
  const targets = getTargets();
  return (
    <main>
      <h2>Targets</h2>
      <form action={updateTargetsAction}>
        <div>
          <label htmlFor="kcal">Calories:</label>
          <input id="kcal" name="kcal" type="number" defaultValue={targets.kcal} />
        </div>
        <div>
          <label htmlFor="protein">Protein (g):</label>
          <input id="protein" name="protein" type="number" step="0.1" defaultValue={targets.protein_g.toFixed(1)} />
        </div>
        <div>
          <label htmlFor="carbs">Carbs (g):</label>
          <input id="carbs" name="carbs" type="number" step="0.1" defaultValue={targets.carbs_g.toFixed(1)} />
        </div>
        <div>
          <label htmlFor="fat">Fat (g):</label>
          <input id="fat" name="fat" type="number" step="0.1" defaultValue={targets.fat_g.toFixed(1)} />
        </div>
        <div>
          <label htmlFor="fiber">Fiber (g):</label>
          <input id="fiber" name="fiber" type="number" step="0.1" defaultValue={targets.fiber_g.toFixed(1)} />
        </div>
        <button type="submit">Save Targets</button>
      </form>
    </main>
  );
}
