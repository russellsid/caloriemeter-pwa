'use client';

import { useEffect, useState } from 'react';
import { getRecipeById, Recipe } from '../../lib/repos/recipes';
import { addEntryFromRecipe } from '../../lib/repos/diary';
import { todayDiaryDay } from '../../lib/utils/dayBoundary';

export default function AddPage() {
  const [recipeId, setRecipeId] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [grams, setGrams] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  // In your app this page is usually opened with ?recipe=<id>
  useEffect(() => {
    const u = new URL(window.location.href);
    const rid = u.searchParams.get('recipe') || '';
    setRecipeId(rid);

    if (rid) {
      const r = getRecipeById(rid);
      if (!r) {
        alert('Recipe not found');
        return;
      }
      setRecipe(r);
      // sensible default: 100 g if we know total weight
      setGrams(100);
    }
  }, []);

  async function onAdd() {
    try {
      const r = recipeId ? getRecipeById(recipeId) : recipe;
      if (!r) {
        alert('Pick a recipe first');
        return;
      }
      const g = Number(grams);
      if (!Number.isFinite(g) || g <= 0) {
        alert('Enter a positive number in grams');
        return;
      }

      setSaving(true);

      // compute per-100g from the stored totals
      // (macros are stored in mg for the whole recipe; calories are kcal total)
      const per100Factor = 100 / Math.max(1, r.total_weight_g);
      const per100g = {
        calories: Math.round(r.calories * per100Factor),
        protein_g: (r.protein_mg / 1000) * per100Factor,
        carbs_g:   (r.carbs_mg   / 1000) * per100Factor,
        fat_g:     (r.fat_mg     / 1000) * per100Factor,
        fiber_g:   ((r.fiber_mg ?? 0) / 1000) * per100Factor,
      };

      await addEntryFromRecipe({
        profile_id: r.profile_id,
        day: todayDiaryDay(2),          // your existing 2 AM → 2 AM boundary
        recipe_id: r.id,
        label: r.name,
        grams: g,
        per100g,
      });

      setSaving(false);
      alert('Added to today!');
      window.location.href = '/';
    } catch (e: any) {
      setSaving(false);
      alert('Failed: ' + (e?.message || String(e)));
    }
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 12 }}>
        <h1>Add</h1>
        <div className="row">
          <a className="btn" href="/">Home</a>
          <a className="btn" href="/recipes">Recipes</a>
        </div>
      </div>

      <div className="card">
        {!recipe ? (
          <p className="small">Open this page via a recipe (e.g. from the Recipes list) so I know what you’re adding.</p>
        ) : (
          <>
            <p><b>{recipe.name}</b></p>
            <p className="small">
              {recipe.total_weight_g} g · {recipe.calories} kcal · P {(recipe.protein_mg/1000).toFixed(1)} g · C {(recipe.carbs_mg/1000).toFixed(1)} g · F {(recipe.fat_mg/1000).toFixed(1)} g
              {typeof recipe.fiber_mg === 'number' ? <> · Fiber {(recipe.fiber_mg/1000).toFixed(1)} g</> : null}
            </p>

            <label>How many grams?</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value || '0'))}
            />

            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <button className="btn" type="button" onClick={onAdd} disabled={saving}>
                {saving ? 'Adding…' : 'Add'}
              </button>
              <a className="btn" href="/">Cancel</a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
