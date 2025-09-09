import React, { useEffect, useMemo, useState } from 'react';
import { loadRiceGrainsPack } from '@/data/foodLoader';
import { searchFoods } from '@/data/foodSearch';
import { macrosForServing } from '@/lib/nutrition';
import type { FoodItem } from '@/types/food';
import CategoryChips, { CatKey } from '@/components/CategoryChips';

export default function AddRiceGrain() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [q, setQ] = useState('');
  const [grams, setGrams] = useState(150); // default katori
  const [sel, setSel] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<CatKey>('All');

  useEffect(() => {
    loadRiceGrainsPack()
      .then(pack => setItems(pack.items))
      .catch(e => setError(e?.message || 'Failed to load database'));
  }, []);

  const results = useMemo(
    () =>
      searchFoods(items, {
        q,
        category: cat === 'All' ? undefined : cat,
        limit: 25,
      }),
    [items, q, cat]
  );

  return (
    <div style={{ maxWidth: 520 }}>
      <h3>Database · Rice / Grains</h3>
      <input
        placeholder="Search (e.g., rice, dosa, idli, jeera)…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          border: '1px solid #ccc',
          borderRadius: 6,
        }}
      />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <CategoryChips value={cat} onChange={setCat} />

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
        {results.map(item => (
          <li key={item.id} style={{ marginBottom: 6 }}>
            <button
              onClick={() => setSel(item)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 10,
                border: '1px solid #eee',
                borderRadius: 6,
                background: '#fafafa',
              }}
            >
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {item.category} · {item.method}
                {item.style ? ` · ${item.style}` : ''}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {sel && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{sel.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {sel.per_100g.kcal} kcal /100g · P {sel.per_100g.protein_g} · C{' '}
                {sel.per_100g.carbs_g} · F {sel.per_100g.fat_g}
              </div>
            </div>
            <label>
              Grams:&nbsp;
              <input
                type="number"
                value={grams}
                min={0}
                onChange={e => setGrams(Number(e.target.value || 0))}
                style={{ width: 90 }}
              />
            </label>
          </div>

          <MacroRow item={sel} grams={grams} />

          <button
            onClick={() => logFood(sel, grams)}
            style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #0a7',
              background: '#0a7',
              color: 'white',
            }}
          >
            Add to diary
          </button>
        </div>
      )}
    </div>
  );
}

function MacroRow({ item, grams }: { item: FoodItem; grams: number }) {
  const m = macrosForServing(item, grams);
  return (
    <div
      style={{
        marginTop: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
        fontSize: 14,
      }}
    >
      <div>
        <b>{m.kcal}</b> kcal
      </div>
      <div>Protein {m.protein_g} g</div>
      <div>Carbs {m.carbs_g} g</div>
      <div>Fat {m.fat_g} g</div>
      <div>Fiber {m.fiber_g} g</div>
    </div>
  );
}

// TODO: replace with your actual diary save logic
function logFood(item: FoodItem, grams: number) {
  const macros = macrosForServing(item, grams);
  console.info('LOG_FOOD', {
    id: item.id,
    name: item.name,
    grams,
    macros,
  });
}
