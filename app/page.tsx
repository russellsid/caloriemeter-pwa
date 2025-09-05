'use client';
import { useEffect, useState } from 'react';
import { getDefaultProfileId } from '../lib/repos/recipes';
import { listByDay, sumTotals, DiaryEntry } from '../lib/repos/diary';
import { todayDiaryDay } from '../lib/utils/dayBoundary';

export default function Home() {
  const [profileId, setProfileId] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [totals, setTotals] = useState<{calories:number,protein_g:number,carbs_g:number,fat_g:number}>();

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      const d = todayDiaryDay(2);
      setDay(d);
      const es = await listByDay(pid, d);
      setEntries(es);
      const t = await sumTotals(es);
      setTotals(t);
    })();
  }, []);

  return (
    <main>
      <div className="header">
        <h1>Calorie Meter</h1>
        <a className="btn" href="/add">+ Add</a>
      </div>

      <div className="card">
        <h3>Today ({day}) — 2 AM → 2 AM</h3>
        <p><b>{totals?.calories ?? 0}</b> kcal</p>
        <p>Protein: <b>{totals?.protein_g?.toFixed(1) ?? '0.0'} g</b> · Carbs: <b>{totals?.carbs_g?.toFixed(1) ?? '0.0'} g</b> · Fat: <b>{totals?.fat_g?.toFixed(1) ?? '0.0'} g</b></p>
      </div>

      <div className="card">
        <h3>Entries</h3>
        {entries.length === 0 ? <p className="small">No entries yet. Tap + Add to log something.</p> :
          <div className="grid">
            {entries.map(e => (
              <div key={e.id} className="card">
                <div><b>{e.label || 'Recipe'}</b></div>
                <div className="small">{e.amount_weight_g ?? '-'} g · {e.calories} kcal</div>
                <div className="small">P {((e.protein_mg)/1000).toFixed(1)}g · C {((e.carbs_mg)/1000).toFixed(1)}g · F {((e.fat_mg)/1000).toFixed(1)}g</div>
              </div>
            ))}
          </div>
        }
      </div>
    </main>
  );
}
