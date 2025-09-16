'use client';

import { useEffect, useMemo, useState } from 'react';
import { getRecipeById, listRecipes, searchRecipes, Recipe } from '../../lib/repos/recipes';
import { addEntryFromRecipe } from '../../lib/repos/diary';
import { todayDiaryDay } from '../../lib/utils/dayBoundary';

export default function AddPage() {
  const [recipeId, setRecipeId] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [grams, setGrams] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  // For picker/search when page opened directly
  const [q, setQ] = useState('');
  const [all, setAll] = useState<Recipe[]>([]);

  useEffect(() => {
    const u = new URL(window.location.href);
    const rid = u.searchParams.get('recipe') || '';
    setRecipeId(rid);
    if (rid) {
      const r = getRecipeById(rid);
      if (r) {
        setRecipe(r);
        setGrams(100);
      }
    }
    setAll(listRecipes());
  }, []);

  const results = useMemo(() => {
    const s = (q || '').trim();
    if (!s) return all;
    return searchRecipes(s);
  }, [q, all]);

  function selectRecipe(r: Recipe) {
    setRecipeId(r.id);
    setRecipe(r);
    setGrams(100);
  }

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

      // per-100g from stored totals (macros are mg, calories are kcal)
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
        day: todayDiaryDay(2),
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

      {/* If a recipe is already selected, show the add form */}
      {recipe ? (
        <div className="card">
          <p><b>{recipe.name}</b></p>
          <p className="small">
            {recipe.total_weight_g} g · {recipe.calories} kcal ·
            {' '}P {(recipe.protein_mg/1000).toFixed(1)} g ·
            {' '}C {(recipe.carbs_mg/1000).toFixed(1)} g ·
            {' '}F {(recipe.fat_mg/1000).toFixed(1)} g
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
            <a className="btn" href="/recipes">Change Recipe</a>
          </div>
        </div>
      ) : (
        // Picker UI if opened directly
        <div className="card">
          <p className="small" style={{ marginTop: 0 }}>
            Pick a recipe to add:
          </p>
          <input
            className="input"
            placeholder="Search recipes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="grid" style={{ marginTop: 8 }}>
            {results.map(r => (
              <div key={r.id} className="card" onClick={() => selectRecipe(r)} style={{ cursor: 'pointer' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div><b>{r.name}</b></div>
                    <div className="small">{r.total_weight_g} g · {r.calories} kcal</div>
                    <div className="small">
                      P {(r.protein_mg/1000).toFixed(1)} g · C {(r.carbs_mg/1000).toFixed(1)} g · F {(r.fat_mg/1000).toFixed(1)} g
                      {typeof r.fiber_mg === 'number' ? <> · Fiber {(r.fiber_mg/1000).toFixed(1)} g</> : null}
                    </div>
                  </div>
                  <a className="btn" href={`/?recipe=${r.id}`} onClick={(e)=>{e.preventDefault(); selectRecipe(r);}}>Use</a>
                </div>
              </div>
            ))}
          </div>
          {results.length === 0 && <p className="small">No recipes found.</p>}
        </div>
      )}
    </main>
  );
}
