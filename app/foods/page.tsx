'use client';

import { useEffect, useState, useMemo } from 'react';

// ----- Types for DB items -----
type FoodItem = {
  name: string;
  calories: number;     // per 100 g
  protein_g: number;    // per 100 g
  carbs_g: number;      // per 100 g
  fat_g: number;        // per 100 g
  fiber_g?: number;     // per 100 g (optional)
};

type CatalogEntry = {
  name: string; // e.g., "Fruits", "Cooked Grains & Dishes"
  file: string; // e.g., "fruits.json", "cooked_grains.json"
};

// Helper to format grams with 1 decimal consistently
function fmt1(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export default function FoodsPage() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, FoodItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // Load the catalog, then load each category file
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // 1) fetch index.json
        const idxRes = await fetch('/db/index.json', { cache: 'no-store' });
        const idx: CatalogEntry[] = await idxRes.json();
        setCatalog(idx);

        // 2) fetch each category file listed in the index
        const entries: Record<string, FoodItem[]> = {};
        for (const c of idx) {
          const res = await fetch(`/db/${c.file}`, { cache: 'no-store' });
          const arr: FoodItem[] = await res.json();
          entries[c.name] = Array.isArray(arr) ? arr : [];
        }
        setItemsByCategory(entries);
      } catch (e) {
        console.error(e);
        alert('Failed to load food database.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Search across all categories
  const filtered = useMemo(() => {
    const term = (q || '').trim().toLowerCase();
    if (!term) return itemsByCategory;

    const out: Record<string, FoodItem[]> = {};
    for (const [cat, arr] of Object.entries(itemsByCategory)) {
      out[cat] = arr.filter((it) => it.name.toLowerCase().includes(term));
    }
    return out;
  }, [q, itemsByCategory]);

  const termActive = (q || '').trim().length > 0;

  // Build the Use link to prefill /recipes/new
  function buildUseHref(item: FoodItem) {
    // We pass per-100g values; the New Recipe page can scale by total weight later.
    const params = new URLSearchParams({
      name: item.name,
      calories: String(item.calories),
      protein_g: fmt1(item.protein_g),
      carbs_g: fmt1(item.carbs_g),
      fat_g: fmt1(item.fat_g),
    });
    if (typeof item.fiber_g === 'number') {
      params.set('fiber_g', fmt1(item.fiber_g));
    }
    return `/recipes/new?${params.toString()}`;
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 12 }}>
        <h1>Food Database</h1>
        <div className="row">
          <a className="btn" href="/">Home</a>
          <a className="btn" href="/recipes">Recipes</a>
        </div>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search foods…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="small" style={{ marginTop: 6 }}>
          Values shown are per <b>100 g</b>. Tap <b>Use</b> to prefill a new recipe.
        </p>
      </div>

      {loading ? (
        <div className="card"><p className="small">Loading…</p></div>
      ) : (
        <>
          {catalog.map((c) => {
            const items = filtered[c.name] || [];

            // 🔑 If searching, hide categories with no matches
            if (termActive && items.length === 0) return null;

            return (
              <section key={c.name} style={{ marginBottom: 16 }}>
                {/* Category header */}
                <div className="card" style={{ background: '#f6f6f6' }}>
                  <h3 style={{ margin: 0 }}>{c.name}</h3>
                </div>

                {/* Cards grid */}
                <div className="grid">
                  {items.map((it) => (
                    <div key={`${c.name}:${it.name}`} className="card">
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div>
                          <div><b>{it.name}</b></div>
                          <div className="small">
                            {it.calories} kcal · P {fmt1(it.protein_g)} g · C {fmt1(it.carbs_g)} g · F {fmt1(it.fat_g)} g
                            {typeof it.fiber_g === 'number' ? <> · Fiber {fmt1(it.fiber_g)} g</> : null}
                          </div>
                        </div>
                        <a className="btn" href={buildUseHref(it)}>Use</a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* When not searching, you can show "No matches" for genuinely empty categories if you want.
                    We hide it during search to avoid empty headers. */}
                {!termActive && items.length === 0 && (
                  <div className="card"><p className="small">No items in {c.name}.</p></div>
                )}
              </section>
            );
          })}
          {/* If searching and nothing at all matched, show one consolidated message */}
          {termActive &&
            Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0) === 0 && (
              <div className="card"><p className="small">No foods found matching “{q}”.</p></div>
            )
          }
        </>
      )}
    </main>
  );
}
