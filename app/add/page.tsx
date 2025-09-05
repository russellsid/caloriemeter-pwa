'use client';
import { useEffect, useState } from 'react';
import { getDefaultProfileId, searchRecipes, Recipe } from '../../lib/repos/recipes';
import { addEntryFromRecipe } from '../../lib/repos/diary';

export default function Add() {
  const [profileId, setProfileId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      if (query.length < 1) { setResults([]); return; }
      const r = await searchRecipes(profileId, query);
      setResults(r);
    })();
  }, [query, profileId]);

  async function addFromRecipe(r: Recipe) {
    const gramsStr = prompt(`How many grams of "${r.name}"?`, '100');
    if (!gramsStr) return;
    const grams = parseInt(gramsStr, 10);
    if (!Number.isFinite(grams) || grams <= 0) { alert('Enter a positive number in grams'); return; }
    const nowUtc = Date.now();
    await addEntryFromRecipe(profileId, r.id, grams, nowUtc);
    alert('Entry added! Go back to Home to see totals.');
  }

  return (
    <main>
      <h1>Add Entry</h1>

      <div className="row" style={{justifyContent:'space-between', marginBottom: 8}}>
        <a className="btn" href="/recipes/new">+ Create recipe</a>
        <a className="btn" href="/recipes">Open Recipes</a>
      </div>

      <input className="input" placeholder="Search your recipes..." value={query} onChange={(e)=>setQuery(e.target.value)} />

      {results.length === 0 ? (
        <div className="card">
          <p className="small">No results yet. Create a recipe first, then search it here to log grams eaten.</p>
        </div>
      ) : (
        <div className="grid">
          {results.map(r => (
            <div className="card" key={r.id}>
              <div><b>{r.name}</b></div>
              <div className="small">Full recipe: {r.total_weight_g} g · {r.calories} kcal</div>
              <button className="btn" onClick={()=>addFromRecipe(r)}>Add</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
