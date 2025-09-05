'use client';
import { useEffect, useState } from 'react';
import { getDefaultProfileId } from '../lib/repos/recipes';
import { listByDay, sumTotals, DiaryEntry, deleteEntry, updateEntryWeight } from '../lib/repos/diary';
import { todayDiaryDay } from '../lib/utils/dayBoundary';
import { getRecipeById, Recipe } from '../lib/repos/recipes';

export default function Home() {
  const [profileId, setProfileId] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [totals, setTotals] = useState<{calories:number,protein_g:number,carbs_g:number,fat_g:number}>();
  const [nameCache, setNameCache] = useState<Record<string,string>>({});

  async function refresh(pid?: string) {
    const p = pid || profileId || await getDefaultProfileId();
    const d = todayDiaryDay(2);
    setDay(d);
    const es = await listByDay(p, d);
    setEntries(es);
    const t = await sumTotals(es);
    setTotals(t);
  }

  useEffect(() => {
    (async () => {
      const pid = await getDefaultProfileId();
      setProfileId(pid);
      await refresh(pid);
    })();
  }, []);

  // Backfill names for entries that have no label yet
  useEffect(() => {
    (async () => {
      const missing = entries
        .filter(e => !e.label && e.recipe_id)
        .map(e => e.recipe_id as string)
        .filter(id => !(id in nameCache));

      if (missing.length === 0) return;

      const updates: Record<string,string> = {};
      for (const id of missing) {
        const r: Recipe | undefined = await getRecipeById(id);
        if (r) updates[id] = r.name;
      }
      if (Object.keys(updates).length) {
        setNameCache(prev => ({ ...prev, ...updates }));
      }
    })();
  }, [entries, nameCache]);

  async function onDelete(entryId: string) {
    const ok = confirm('Delete this entry?');
    if (!ok) return;
    await deleteEntry(entryId);
    await refresh();
  }

  async function onEdit(entry: DiaryEntry) {
    const current = entry.amount_weight_g ?? 0;
    const gramsStr = prompt(`Edit grams for this entry`, String(current || 100));
    if (!gramsStr) return;
    const grams = parseInt(gramsStr, 10);
    if (!Number.isFinite(grams) || grams <= 0) { alert('Enter a positive number in grams'); return; }
    try {
      await updateEntryWeight(entry.id, grams);
      await refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  function entryName(e: DiaryEntry) {
    if (e.label) return e.label;
    if (e.recipe_id && nameCache[e.recipe_id]) return nameCache[e.recipe_id];
    return 'Recipe entry';
  }

  return (
    <main>
      <div className="header" style={{marginBottom: 12}}>
        <h1>Calorie Meter</h1>
        <div className="row">
          <a className="btn" href="/add">+ Add</a>
          <a className="btn" href="/recipes">Recipes</a>
        </div>
      </div>

      <div className="card">
        <h3>Today ({day}) — 2 AM → 2 AM</h3>
        <p><b>{totals?.calories ?? 0}</b> kcal</p>
        <p>Protein: <b>{totals?.protein_g?.toFixed(1) ?? '0.0'} g</b> · Carbs: <b>{totals?.carbs_g?.toFixed(1) ?? '0.0'} g</b> · Fat: <b>{totals?.fat_g?.toFixed(1) ?? '0.0'} g</b></p>
      </div>

      <div className="card">
        <h3>Entries</h3>
        {entries.length === 0 ? (
          <p className="small">No entries yet. Tap + Add to log something.</p>
        ) : (
          <div className="grid">
            {entries.map(e => (
              <div key={e.id} className="card">
                <div className="row" style={{justifyContent:'space-between', alignItems:'baseline'}}>
                  <div>
                    <div><b>{entryName(e)}</b></div>
                    <div className="small">{e.amount_weight_g ?? '-'} g · {e.calories} kcal</div>
                    <div className="small">P {((e.protein_mg)/1000).toFixed(1)}g · C {((e.carbs_mg)/1000).toFixed(1)}g · F {((e.fat_mg)/1000).toFixed(1)}g</div>
                  </div>
                  <div className="row" style={{gap:8}}>
                    <button className="btn" onClick={()=>onEdit(e)} type="button">Edit</button>
                    <button className="btn" onClick={()=>onDelete(e.id)} type="button">Delete</button>
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
