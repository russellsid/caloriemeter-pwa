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
  const [fruits, setFruits] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        // Load index (future-proof for more categories)
        const idx = await fetch('/db/index.json').then(r => r.json());
        const fruitsMeta = idx.categories.find((c: any) => c.id === 'fruits');
        const list: Food[] = await fetch(fruitsMeta.file).then(r => r.json());
        setFruits(list);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load database');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return fruits;
    const s = q.trim().toLowerCase();
    return fruits.filter(f =>
      f.name.toLowerCase().includes(s) || (f.id || '').toLowerCase().includes(s)
    );
  }, [q, fruits]);

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
        <h1>Food DB — Fruits</h1>
        <a className="btn" href="/">Home</a>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search e.g. apple, mango, banana…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && <p className="small">Loading fruits…</p>}
        {err && <p className="small" style={{ color: 'red' }}>{err}</p>}
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

      <div className="card">
        <p className="small">
          Values are approximate per <b>100 g</b>. You can edit before saving.
        </p>
      </div>
    </main>
  );
}
