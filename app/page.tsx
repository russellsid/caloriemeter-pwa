'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDefaultProfileId } from '../lib/repos/recipes';
import {
  listByDay,
  sumTotals,
  DiaryEntry,
  deleteEntry,
  updateEntryWeight,
  pruneOldEntries, // NEW
} from '../lib/repos/diary';
import {
  todayDiaryDay,
  shiftDay, // NEW
} from '../lib/utils/dayBoundary';
import { getTargets, Targets } from '../lib/repos/settings';

// ---------- constants ----------
const START_HOUR = 2;  // 2 AM → 2 AM day boundary
const KEEP_DAYS = 30;  // keep the most recent 30 days

// ---------- helpers ----------
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function fmt1(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}
function fmtSigned(n: number, unit: 'kcal' | 'g') {
  if (unit === 'kcal') {
    const v = Math.round(n);
    if (v > 0) return `+${v}`;
    if (v < 0) return `${v}`;
    return '0';
  } else {
    const v = Math.round(n * 10) / 10;
    const s = v.toFixed(1);
    if (v > 0) return `+${s}`;
    if (v < 0) return s;
    return '0.0';
  }
}

// A single progress row (Energy / Protein / Carbs / Fat / Fiber)
function ProgressRow(props: {
  label: 'Energy' | 'Protein' | 'Carbs' | 'Fat' | 'Fiber';
  unit: 'kcal' | 'g';
  consumed: number;
  target: number;
}) {
  const { label, unit, consumed, target } = props;
  const diff = (consumed || 0) - (target || 0); // positive = over, negative = under
  const frac = target > 0 ? clamp01(consumed / target) : 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}
      >
        <div style={{ fontWeight: 700 }}>
          {label}{' '}
          <span className="small" style={{ opacity: 0.8 }}>
            – {unit === 'kcal' ? Math.round(consumed) : fmt1(consumed)} / {unit === 'kcal' ? Math.round(target) : fmt1(target)} {unit}
          </span>
        </div>
        <div style={{ fontWeight: 700 }}>
          {fmtSigned(diff, unit)} {unit}
        </div>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: '#e8e8e8', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${frac * 100}%`, background: '#111' }} />
      </div>
    </div>
  );
}

// ---------- page ----------
export default function Home() {
  const [profileId, setProfileId] = useState<string>('');
  const [day, setDay] = useState<string>(todayDiaryDay(START_HOUR));
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [totals, setTotals] = useState<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

  const [targets, setTargets] = useState<Targets>({
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    calories: 0,
  });

  // Load a specific day
  async function loadForDay(d: string, pid?: string) {
    const p = pid || profileId || (await getDefaultProfileId());
    setDay(d);
    const es = await listByDay(p, d);
    setEntries(es);
    setTotals(await sumTotals(es));
    setTargets(await getTargets());
  }

  // Init: prune & load today
  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      // auto-prune anything older than 30 boundary-days
      await pruneOldEntries(KEEP_DAYS, START_HOUR); // <-- positional args
      await loadForDay(todayDiaryDay(START_HOUR), pid);
    })();
  }, []);

  // convenience flags
  const today = todayDiaryDay(START_HOUR);
  const isToday = day === today;

  const hasTargets = useMemo(
    () =>
      targets.calories > 0 ||
      targets.protein_g > 0 ||
      targets.carbs_g > 0 ||
      targets.fat_g > 0 ||
      targets.fiber_g > 0,
    [targets]
  );

  async function onDelete(entryId: string) {
    if (!confirm('Delete this entry?')) return;
    await deleteEntry(entryId);
    await loadForDay(day);
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
    await loadForDay(day);
  }

  return (
    <main>
      <div className="header" style={{ marginBottom: 12 }}>
        <h1>Calorie Meter</h1>
        <div className="row">
          <a className="btn" href="/add">+ Add</a>
          <a className="btn" href="/recipes">Recipes</a>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn"
            onClick={() => loadForDay(shiftDay(day, -1))}
            type="button"
            aria-label="Previous day"
          >
            ‹
          </button>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {isToday ? 'Today' : day} — 2 AM → 2 AM
            </h3>
          </div>

          <button
            className="btn"
            onClick={() => loadForDay(shiftDay(day, +1))}
            type="button"
            aria-label="Next day"
            disabled={isToday}
            style={isToday ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            ›
          </button>
        </div>

        <p><b>{Math.round(totals.calories)}</b> kcal</p>
        <p>
          Protein: <b>{fmt1(totals.protein_g)} g</b> · Carbs <b>{fmt1(totals.carbs_g)} g</b> · Fat <b>{fmt1(totals.fat_g)} g</b>
          {totals.fiber_g > 0 ? <> · Fiber <b>{fmt1(totals.fiber_g)} g</b></> : null}
        </p>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginBottom: 0 }}>Targets</h3>
          <a className="btn" href="/settings">Edit</a>
        </div>

        <ProgressRow label="Energy" unit="kcal" consumed={totals.calories} target={targets.calories} />
        <ProgressRow label="Protein" unit="g" consumed={totals.protein_g} target={targets.protein_g} />
        <ProgressRow label="Carbs" unit="g" consumed={totals.carbs_g} target={targets.carbs_g} />
        <ProgressRow label="Fat" unit="g" consumed={totals.fat_g} target={targets.fat_g} />
        <ProgressRow label="Fiber" unit="g" consumed={totals.fiber_g} target={targets.fiber_g} />
        {!hasTargets && (
          <p className="small">
            Set your daily targets in <a href="/settings">Targets</a>. Calories auto-calculate from Protein/Carbs/Fat.
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
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div><b>{e.label || 'Recipe entry'}</b></div>
                    <div className="small">{e.amount_weight_g ?? '-'} g · {e.calories} kcal</div>
                    <div className="small">
                      P {(e.protein_mg / 1000).toFixed(1)}g · C {(e.carbs_mg / 1000).toFixed(1)}g · F {(e.fat_mg / 1000).toFixed(1)}g
                      {typeof e.fiber_mg === 'number' ? <> · Fiber {(e.fiber_mg / 1000).toFixed(1)}g</> : null}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn" onClick={() => onEdit(e)} type="button">Edit</button>
                    <button className="btn" onClick={() => onDelete(e.id)} type="button">Delete</button>
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
