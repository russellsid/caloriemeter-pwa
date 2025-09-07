'use client';
import { useEffect, useState } from 'react';
import { calcCaloriesFromMacros, getTargets, saveTargets } from '../../lib/repos/settings';

export default function SettingsPage() {
  const [p, setP] = useState<string>('0');
  const [c, setC] = useState<string>('0');
  const [f, setF] = useState:string>('0');
  const kcal = calcCaloriesFromMacros(Number(p||0), Number(c||0), Number(f||0));

  useEffect(() => {
    (async () => {
      const t = await getTargets();
      setP(String(t.protein_g));
      setC(String(t.carbs_g));
      setF(String(t.fat_g));
    })();
  }, []);

  async function onSave() {
    const pNum = Number(p||0), cNum = Number(c||0), fNum = Number(f||0);
    if (pNum < 0 || cNum < 0 || fNum < 0) { alert('Targets must be ≥ 0'); return; }
    await saveTargets(pNum, cNum, fNum);
    alert('Targets saved!');
    window.location.href = '/';
  }

  return (
    <main>
      <h1>Daily Targets</h1>
      <div className="card">
        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input className="input" inputMode="numeric" type="number" value={p} onChange={e=>setP(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input className="input" inputMode="numeric" type="number" value={c} onChange={e=>setC(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input className="input" inputMode="numeric" type="number" value={f} onChange={e=>setF(e.target.value)} />
          </div>
        </div>
        <p className="small">Calories auto-calculated: <b>{kcal}</b> kcal (P×4 + C×4 + F×9)</p>
        <div className="row" style={{gap:8}}>
          <button className="btn" onClick={onSave}>Save</button>
          <a className="btn" href="/">Cancel</a>
        </div>
      </div>
    </main>
  );
}
