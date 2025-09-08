// app/add/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDefaultProfileId, listRecipes, searchRecipes, getRecipeById, type Recipe } from '../../lib/repos/recipes';
import { addEntryFromRecipe } from '../../lib/repos/diary';

export default function AddPage() {
  const [profileId, setProfileId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      const r = await listRecipes(pid);
      setItems(r);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      if (!query.trim()) { setItems(await listRecipes(profileId)); return; }
      setItems(await searchRecipes(profileId, query));
    })();
  }, [query, profileId]);

  async function onAdd(recipeId: string) {
    try {
      // Fetch the recipe so we can use its own total weight as the default
      const r = await getRecipeById(recipeId);
      const defaultGrams = r?.total_weight_g && r.total_weight_g > 0 ? r.total_weight_g : 100;

      const gramsStr = prompt(`How many grams?`, String(defaultGrams));
      if (!gramsStr) return;
      const grams = parseInt(gramsStr, 10);
      if (!Number.isFinite(grams) || grams <= 0) { alert('Enter a positive number in grams'); return; }

      await addEntryFromRecipe(profileId, recipeId, grams, Date.now());
      alert('Added to today!');
      window.location.href = '/'; // back to Home
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 12 }}>
        <h1>Add to Today</h1>
        <div className="row">
          <a className="btn" href="/recipes">Recipes</a>
          <a className="btn" href="/">Home</a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search your recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="grid">
          {items.map((r) => (
            <div className="card" key={r.id}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div><b>{r.name}</b></div>
                  <div className="small">{r.total_weight_g} g · {r.calories} kcal</div>
                  <div className="small">P {(r.protein_mg/1000).toFixed(1)}g · C {(r.carbs_mg/1000).toFixed(1)}g · F {(r.fat_mg/1000).toFixed(1)}g</div>
                </div>
                <button className="btn" type="button" onClick={() => onAdd(r.id)}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
