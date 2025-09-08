'use client';

import { useEffect, useMemo, useState } from 'react';

type Food = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tags?: string[];
};

export default function FoodSearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<'db-index' | 'single-file' | 'none'>('none');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Preferred: category index at /db/index.json
        const idxRes = await fetch('/db/index.json');
        if (idxRes.ok) {
          const idx = await idxRes.json();
          const cat = Array.isArray(idx?.categories)
            ? idx.categories.find((c: any) => c.id === 'fruits')
            : null;
          if (!cat?.file) throw new Error('Fruits category not found in index.json');
          const listRes = await fetch(cat.file);
          if (!listRes.ok) throw new Error(`Failed to load ${cat.file} (${listRes.status})`);
          const list = (await listRes.json()) as Food[];
          setItems(list);
          setSource('db-index');
          return;
        }

        // 2) Fallback: single-file at /foods.json
        const singleRes = await fetch('/foods.json');
        if (singleRes.ok) {
          const list = (await singleRes.json()) as Food[];
          setItems(list);
          setSource('single-file');
          return;
        }

        // Neither exists
        throw new Error('No food database found (missing /db/index.json and /foods.json).');
      } catch (e: any) {
        setErr(e?.message || 'Failed to load database');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.trim().toLowerCase();
    return items.filter(f =>
      f.name.toLowerCase().includes(s) || (f.id || '').toLowerCase().includes(s)
    );
  }, [q, items]);

  function toNewRecipeURL(f: Food) {
    const params = new URLSearchParams({
      name: f.name,
      calories: String(Math.round(f.calories)),
      protein_g: String(f.protein_g),
      carbs_g: String(f.carbs_g),
      fat_g: String(f.fat_g),
      weight: '100'
    });
    return `/recipes/new?${params.toString()}`;
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 8 }}>
        <h1>Food DB {source === 'db-index' ? '— Fruits' : source === 'single-file' ? '' : ''}</h1>
        <a className="btn" href="/">Home</a>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search e.g. apple, mango, banana…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && <p className="small">Loading database…</p>}
        {err && (
          <p className="small" style={{ color: 'red' }}>
            {err}
          </p>
        )}
        {!loading && !err && (
          <p className="small" style={{ opacity: 0.7 }}>
            Source: {source === 'db-index' ? '/db/index.json' : source === 'single-file' ? '/foods.json' : 'none'}
          </p>
        )}
      </div>

      <div className="grid">
        {results.map((f) => (
          <div key={f.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div><b>{f.name}</b></div>
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

      {!loading && !err && results.length === 0 && (
        <div className="card"><p className="small">No matches.</p></div>
      )}

      <div className="card">
        <p className="small">
          Values are approximate per <b>100 g</b>. You can edit before saving.
        </p>
      </div>
    </main>
  );
}
