'use client';
import { useEffect, useState } from 'react';
import { createRecipe, getDefaultProfileId } from '../../../lib/repos/recipes';
import { warmup } from '../../../lib/db/sql';

export default function NewRecipe() {
  const [profileId, setProfileId] = useState<string>('');
  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<string>('0.0');
  const [carbs, setCarbs] = useState<string>('0.0');
  const [fat, setFat] = useState<string>('0.0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await warmup(); // wake DB on mount
      const pid = await getDefaultProfileId();
      setProfileId(pid || 'default');
    })();
  }, []);

  async function save() {
    try {
      // Ensure DB awake & profile available even if useEffect hasn't finished
      const pid = profileId || (await getDefaultProfileId()) || 'default';
      await warmup();

      if (!name.trim()) throw new Error('Enter a name');
      if (!Number.isFinite(totalWeightG) || totalWeightG <= 0)
        throw new Error('Total weight must be positive');
      if (!Number.isFinite(calories) || calories < 0)
        throw new Error('Calories must be ≥ 0');

      const pMg = Math.round(parseFloat(protein || '0') * 1000);
      const cMg = Math.round(parseFloat(carbs || '0') * 1000);
      const fMg = Math.round(parseFloat(fat || '0') * 1000);

      setSaving(true);

      // Safety timeout: if DB takes too long, we still proceed and then verify
      const id = await Promise.race([
        createRecipe(pid, {
          name,
          total_weight_g: totalWeightG,
          calories,
          protein_mg: pMg,
          carbs_mg: cMg,
          fat_mg: fMg,
        } as any),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Saving took too long')), 6000)
        ),
      ]);

      setSaving(false);
      alert('Recipe saved!');
      window.location.href = '/recipes';
    } catch (err: any) {
      setSaving(false);
      alert('Failed to save: ' + (err?.message || String(err)));
    }
  }

  return (
    <main>
      <h1>New Recipe</h1>
      <div className="card">
        <label>Name</label>
        <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Paneer Bowl" />
        <label>Total recipe weight (g)</label>
        <input className="input" type="number" value={totalWeightG} onChange={(e)=>setTotalWeightG(parseInt(e.target.value||'0',10))} />
        <label>Calories (kcal)</label>
        <input className="input" type="number" value={calories} onChange={(e)=>setCalories(parseInt(e.target.value||'0',10))} />
        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input className="input" value={protein} onChange={(e)=>setProtein(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input className="input" value={carbs} onChange={(e)=>setCarbs(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input className="input" value={fat} onChange={(e)=>setFat(e.target.value)} />
          </div>
        </div>
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
      <p className="small">Tip: v1 is grams-only and totals are frozen when you log an entry.</p>
    </main>
  );
}
