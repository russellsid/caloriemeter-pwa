// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDefaultProfileId } from '../lib/repos/recipes';
import {
  listByDay,
  sumTotals,
  DiaryEntry,
  deleteEntry,
  updateEntryWeight,
} from '../lib/repos/diary';
import { todayDiaryDay } from '../lib/utils/dayBoundary';
import { getTargets, Targets } from '../lib/repos/settings';

// ---------- small helpers ----------
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function fmt1(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

// Progress row like your screenshot
function ProgressRow(props: {
  label: 'Energy' | 'Protein' | 'Carbs' | 'Fat';
  unit: 'kcal' | 'g';
  consumed: number;
  target: number;
  barColor?: string;
}) {
  const { label, unit, consumed, target } = props;
  const remaining = Math.max(0, (target || 0) - (consumed || 0));
  const frac = target > 0 ? clamp01(consumed / target) : 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {label}{' '}
          <span className="small" style={{ opacity: 0.8 }}>
            – {unit === 'kcal' ? consumed : fmt1(consumed)} /{' '}
            {unit === 'kcal' ? target : fmt1(target)} {unit}
          </span>
        </div>
        <div style={{ fontWeight: 700 }}>
          {unit === 'kcal' ? target - consumed : fmt1(remaining)} {unit}
        </div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: '#e8e8e8',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${frac * 100}%`,
            background: '#111',
          }}
        />
      </div>
    </div>
  );
}

// ---------- page ----------
export default function Home() {
  const [profileId, setProfileId] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [totals, setTotals] = useState<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  // IMPORTANT: include fiber_g so it conforms to Targets
  const [targets, setTargets] = useState<Targets>({
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0, // ✅ added
    calories: 0,
  });

  async function refresh(pid?: string) {
    const p = pid || profileId || (await getDefaultProfileId());
    const d = todayDiaryDay(2);
    setDay(d);

    const es = await listByDay(p, d);
    setEntries(es);
    setTotals(await sumTotals(es));
    setTargets(await getTargets());
  }

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      await refresh(pid);
    })();
  }, []);

  const hasTargets = useMemo(
    () =>
      targets.calories > 0 ||
      targets.protein_g > 0 ||
      targets.carbs_g > 0 ||
      targets.fat_g > 0,
    [targets]
  );

  async function onDelete(entryId: string) {
    if (!confirm('Delete this entry?')) return;
    await deleteEntry(entryId);
    await refresh();
  }

  async function onEdit(entry: DiaryEntry) {
    const current = entry.amount_weight_g ?? 0;
    const gramsStr = prompt('Edit grams for this entry', String(current || 100));
    if (!gramsStr) return;
    const grams = parseInt(gramsStr, 10);
    if (!Number.isFinite(grams) || grams <= 0) {
      alert('Enter a positive number in grams');
      return;
    }
    await updateEntryWeight(entry.id, grams);
    await refresh();
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 12 }}>
        <h1>Calorie Meter</h1>
        <div className="row">
          <a className="btn" href="/add">
            + Add
          </a>
          <a className="btn" href="/recipes">
            Recipes
          </a>
          <a className="btn" href="/settings">
            Targets
          </a>
        </div>
      </div>

      <div className="card">
        <h3>Today ({day}) — 2 AM → 2 AM</h3>
        <p>
          <b>{totals.calories}</b> kcal
        </p>
        <p>
          Protein: <b>{fmt1(totals.protein_g)} g</b> · Carbs:{' '}
          <b>{fmt1(totals.carbs_g)} g</b> · Fat: <b>{fmt1(totals.fat_g)} g</b>
        </p>
      </div>

      <div className="card">
        <div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3 style={{ marginBottom: 0 }}>Targets</h3>
          <a className="btn" href="/settings">
            Edit
          </a>
        </div>

        {/* Energy */}
        <ProgressRow
          label="Energy"
          unit="kcal"
          consumed={totals.calories}
          target={targets.calories}
        />
        {/* Protein */}
        <ProgressRow
          label="Protein"
          unit="g"
          consumed={totals.protein_g}
          target={targets.protein_g}
        />
        {/* Carbs */}
        <ProgressRow
          label="Carbs"
          unit="g"
          consumed={totals.carbs_g}
          target={targets.carbs_g}
        />
        {/* Fat */}
        <ProgressRow
          label="Fat"
          unit="g"
          consumed={totals.fat_g}
          target={targets.fat_g}
        />

        {!hasTargets && (
          <p className="small">
            Set your daily targets in <a href="/settings">Targets</a>. Calories
            auto-calculate from Protein/Carbs/Fat.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Entries</h3>
        {entries.length === 0 ? (
          <p className="small">No entries yet. Tap + Add to log something.</p>
        ) : (
          <div className="grid">
            {entries.map((e) => (
              <div key={e.id} className="card">
                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div>
                      <b>{e.label || 'Recipe entry'}</b>
                    </div>
                    <div className="small">
                      {e.amount_weight_g ?? '-'} g · {e.calories} kcal
                    </div>
                    <div className="small">
                      P {(e.protein_mg / 1000).toFixed(1)}g · C{' '}
                      {(e.carbs_mg / 1000).toFixed(1)}g · F{' '}
                      {(e.fat_mg / 1000).toFixed(1)}g
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn" onClick={() => onEdit(e)} type="button">
                      Edit
                    </button>
                    <button
                      className="btn"
                      onClick={() => onDelete(e.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
