'use client';

import { useEffect, useState } from 'react';

type Food = {
  id: string;
  name: string;
  brand: string;
  serving: string;      // "100 g"
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export default function FoodSearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(query: string) {
    setError(null);
    if (!query.trim()) { setItems([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}&limit=12`);
      if (!r.ok) throw new Error(`API ${r.status}`);
      const json = await r.json();
      setItems(json?.items ?? []);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 350); // small debounce
    return () => clearTimeout(t);
  }, [q]);

  function toNewRecipeURL(f: Food) {
    const params = new URLSearchParams({
      name: f.name,
      calories: String(Math.round(f.calories)),
      protein_g: String(f.protein_g),
      carbs_g: String(f.carbs_g),
      fat_g: String(f.fat_g),
      weight: '100', // per 100 g
    });
    return `/recipes/new?${params.toString()}`;
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 8 }}>
        <h1>Food DB</h1>
        <a className="btn" href="/">Home</a>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search e.g. apple, honey, rice…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && <p className="small">Searching…</p>}
        {error && <p className="small" style={{ color: 'red' }}>{error}</p>}
      </div>

      <div className="grid">
        {items.map((f) => (
          <div key={f.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div><b>{f.name}</b>{f.brand ? ` · ${f.brand}` : ''}</div>
                <div className="small">{f.serving}</div>
                <div className="small">
                  {Math.round(f.calories)} kcal · P {f.protein_g.toFixed(1)} g · C {f.carbs_g.toFixed(1)} g · F {f.fat_g.toFixed(1)} g
                </div>
              </div>
              <a className="btn" href={toNewRecipeURL(f)}>Use</a>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="small">
          Source: Open Food Facts (public). Values are per <b>100 g</b>. You can edit before saving.
        </p>
      </div>
    </main>
  );
}
