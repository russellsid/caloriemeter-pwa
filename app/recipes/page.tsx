'use client';

import { useEffect, useMemo, useState } from 'react';
import { listRecipes, searchRecipes, Recipe } from '../../lib/repos/recipes';

export default function RecipesListPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Recipe[]>([]);

  useEffect(() => {
    setItems(listRecipes());
  }, []);

  const results = useMemo(() => {
    const s = (q || '').trim();
    if (!s) return items;
    return searchRecipes(s);
  }, [q, items]);

  return (
    <main>
      <div className="header" style={{ marginBottom: 8 }}>
        <h1>Recipes</h1>
        <div className="row">
          <a className="btn" href="/recipes/new">+ New Recipe</a>
          <a className="btn" href="/">Home</a>
        </div>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search recipes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid">
        {results.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div><b>{r.name}</b></div>
                <div className="small">{r.total_weight_g} g · {r.calories} kcal</div>
                <div className="small">
                  P {(r.protein_mg/1000).toFixed(1)} g · C {(r.carbs_mg/1000).toFixed(1)} g · F {(r.fat_mg/1000).toFixed(1)} g
                  {typeof r.fiber_mg === 'number' ? <> · Fiber {(r.fiber_mg/1000).toFixed(1)} g</> : null}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn" href={`/add?recipe=${r.id}`}>Add</a>
                <a className="btn" href={`/recipes/${r.id}/edit`}>Edit</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="card"><p className="small">No recipes yet.</p></div>
      )}
    </main>
  );
}
