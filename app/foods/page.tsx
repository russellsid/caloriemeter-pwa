'use client';

import { useState } from 'react';

type FoodHit = {
  id: string;
  name: string;
  nutriments: {
    energyKcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

export default function FoodsPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoodHit[]>([]);

  async function searchFoods(e: React.FormEvent) {
    e.preventDefault();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.hits || []);
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="header">
        <h1>Food Database</h1>
        <a className="btn" href="/">Home</a>
      </div>

      <form onSubmit={searchFoods} style={{ marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search foods..."
          style={{ padding: 8, width: '70%' }}
        />
        <button className="btn" type="submit" style={{ marginLeft: 8 }}>
          Search
        </button>
      </form>

      {loading && <p>Searching…</p>}

      {results.length > 0 && (
        <div>
          {results.map((f) => (
            <div key={f.id} className="card" style={{ marginBottom: 12 }}>
              <b>{f.name}</b>
              <div className="small">
                {f.nutriments.energyKcal || 0} kcal · P{' '}
                {f.nutriments.protein || 0} g · C {f.nutriments.carbs || 0} g · F{' '}
                {f.nutriments.fat || 0} g
              </div>
              {/* Later we can add a "Use" button to auto-fill recipe form */}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
