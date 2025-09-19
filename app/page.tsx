'use client';

import { useEffect, useState } from 'react';
import { getDayBoundaries } from '../lib/utils/dayBoundary';
import { loadDiary, addEntryFromRecipe } from '../lib/repos/diary';
import { loadTargets } from '../lib/repos/settings';

// ---- Types ----
type Entry = {
  id: string;
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
};

type Targets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [targets, setTargets] = useState<Targets>({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load diary + targets
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const loaded = await loadDiary();
        setEntries(loaded);
        const t = await loadTargets();
        setTargets(t);
      } catch (e) {
        console.error(e);
        alert('Failed to load diary.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Summed totals
  const totals = entries.reduce(
    (acc, it) => {
      acc.calories += it.calories;
      acc.protein_g += it.protein_g;
      acc.carbs_g += it.carbs_g;
      acc.fat_g += it.fat_g;
      acc.fiber_g += it.fiber_g || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );

  const { start, end } = getDayBoundaries();

  return (
    <main>
      {/* Top Nav */}
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <a className="btn" href="/">Home</a>
        <a className="btn" href="/add">+ Add</a>
        <a className="btn" href="/foods">Food DB</a>
        <a className="btn" href="/recipes">Recipes</a>
        {/* Removed Targets button here */}
        <a className="btn" href="/backup">Backup</a>
      </div>

      {/* Header Row */}
      <div className="row" style={{ marginBottom: 12, gap: 6 }}>
        <h1 style={{ margin: 0 }}>Calorie Meter</h1>
        <a className="btn" href="/add">+ Add</a>
        <a className="btn" href="/recipes">Recipes</a>
        <a className="btn" href="/settings">Targets</a>
      </div>

      {/* Date & Summary */}
      <div className="card">
        <div>
          <b>Today ({start.toISOString().slice(0, 10)} — {start.getHours()} AM → {end.getHours()} AM)</b>
        </div>
        <div>{totals.calories} kcal</div>
        <div>
          Protein: {totals.protein_g.toFixed(1)} g · Carbs {totals.carbs_g.toFixed(1)} g · Fat {totals.fat_g.toFixed(1)} g
          · Fiber {totals.fiber_g.toFixed(1)} g
        </div>
      </div>

      {/* Targets */}
      <div className="card">
        <h2>Targets</h2>
        <a className="btn" href="/settings">Edit</a>
        <p>Energy – {totals.calories} / {targets.calories} kcal</p>
        <progress value={totals.calories} max={targets.calories}></progress>
        <p>Protein – {totals.protein_g.toFixed(1)} / {targets.protein_g} g</p>
        <progress value={totals.protein_g} max={targets.protein_g}></progress>
        <p>Carbs – {totals.carbs_g.toFixed(1)} / {targets.carbs_g} g</p>
        <progress value={totals.carbs_g} max={targets.carbs_g}></progress>
        <p>Fat – {totals.fat_g.toFixed(1)} / {targets.fat_g} g</p>
        <progress value={totals.fat_g} max={targets.fat_g}></progress>
        <p>Fiber – {totals.fiber_g.toFixed(1)} / {targets.fiber_g} g</p>
        <progress value={totals.fiber_g} max={targets.fiber_g}></progress>
      </div>

      {/* Entries */}
      <div className="card">
        <h2>Entries</h2>
        {entries.length === 0 ? (
          <p className="small">No entries yet. Tap + Add to log something.</p>
        ) : (
          <ul>
            {entries.map((it) => (
              <li key={it.id}>
                {it.name} – {it.grams} g · {it.calories} kcal
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
