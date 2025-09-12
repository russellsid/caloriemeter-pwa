// app/recipes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  listRecipes,
  searchRecipes,
  getDefaultProfileId,
  type Recipe,
} from '../../lib/repos/recipes';

export default function Recipes() {
  const [profileId, setProfileId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Recipe[]>([]);

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      const r = await listRecipes(pid);
      setItems(r);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      if (query.length === 0) {
        const r = await listRecipes(profileId);
        setItems(r);
        return;
      }
      const r = await searchRecipes(profileId, query);
      setItems(r);
    })();
  }, [query, profileId]);

  return (
    <main>
      <h1>Recipes</h1>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <a className="btn" href="/recipes/new">+ New Recipe</a>
        <input
          className="input"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid">
        {items.map((r) => (
          <div className="card" key={r.id}>
            <div className="row" style={{ justifyContent:'space-between', alignItems:'baseline' }}>
              <div>
                <div><b>{r.name}</b></div>
                <div className="small">{r.total_weight_g} g · {r.calories} kcal</div>
                <div className="small">
                  P {r.protein_g.toFixed(1)}g · C {r.carbs_g.toFixed(1)}g · F {r.fat_g.toFixed(1)}g
                </div>
              </div>
              <a className="btn" href={`/recipes/${r.id}/edit`}>Edit</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
