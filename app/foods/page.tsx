'use client';

import { useEffect, useMemo, useState } from 'react';

type Food = {
  id: string;
  name: string;
  serving: string;      // "100 g"
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tags?: string[];
  _category?: string;    // injected: category id (e.g., "fruits", "rice_grains")
};

type CategoryMeta = {
  id: string;
  name: string;
  file: string;          // e.g., "/db/fruits.json"
  count?: number;
};

export default function FoodSearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]); // non-fatal warnings

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setNotes([]);
      try {
        // 1) Load the category index
        const idxRes = await fetch('/db/index.json', { cache: 'no-store' });
        if (!idxRes.ok) throw new Error(`index.json ${idxRes.status}`);
        const idx = await idxRes.json();
        const cats: CategoryMeta[] = Array.isArray(idx?.categories) ? idx.categories : [];
        if (!cats.length) throw new Error('No categories found in index.json');

        // 2) Fetch all categories in parallel
        const results = await Promise.all(
          cats.map(async (c) => {
            try {
              const r = await fetch(c.file, { cache: 'no-store' });
              if (!r.ok) throw new Error(`${c.file} ${r.status}`);
              const list = (await r.json()) as Food[];
              return list.map((f) => ({ ...f, _category: c.id }));
            } catch (e: any) {
              // Non-fatal: note it and continue
              return { __error: `Skipped ${c.id}: ${e?.message || 'load failed'}` } as any;
            }
          })
        );

        // 3) Merge, skip any __error placeholders
        const merged: Food[] = [];
        const newNotes: string[] = [];
        for (const chunk of results) {
          if (Array.isArray(chunk)) merged.push(...chunk);
          else if (chunk && (chunk as any).__error) newNotes.push((chunk as any).__error);
        }

        // 4) Deduplicate by id (last-in wins)
        const seen = new Map<string, Food>();
        for (const f of merged) {
          if (!f?.id) continue;
          seen.set(f.id, f);
        }

        setItems(Array.from(seen.values()));
        setNotes(newNotes);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load database');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) {
      // show sorted by name when no query
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }
    const s = q.trim().toLowerCase();
    return items.filter((f) =>
      (f.name || '').toLowerCase().includes(s) ||
      (f.id || '').toLowerCase().includes(s) ||
      (f.tags || []).some(t => t.toLowerCase().includes(s))
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
        <h1>Food DB</h1>
        <a className="btn" href="/">Home</a>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search across all categories… e.g., apple, rice, quinoa"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && <p className="small">Loading database…</p>}
        {err && <p className="small" style={{ color: 'red' }}>{err}</p>}
        {!loading && !err && notes.length > 0 && (
          <p className="small" style={{ color: '#b26b00' }}>
            {notes.join(' · ')}
          </p>
        )}
        {!loading && !err && (
          <p className="small" style={{ opacity: 0.7 }}>
            Loaded {items.length} items from index.json
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
                {f._category && (
                  <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>
                    Category: {f._category}
                  </div>
                )}
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
          Values are approximate per <b>100 g</b>. Edit before saving if needed.
        </p>
      </div>
    </main>
  );
}
