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
      await warmup(); // wake DB
      const pid = await getDefaultProfileId();
      setProfileId(pid || 'default');
    })();
  }, []);

  async function onSaveClick() {
    // 🔔 Prove the button is clickable
    alert('Saving recipe…');

    try {
      const pid = profileId || (await getDefaultProfileId()) || 'default';

      // Validate
      if (!name.trim()) throw new Error('Enter a name');
      const weight = Number(totalWeightG);
      const kcal = Number(calories);
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Total weight must be positive');
      if (!Number.isFinite(kcal) || kcal < 0) throw new Error('Calories must be ≥ 0');

      const pMg = Math.round(Number(protein || '0') * 1000);
      const cMg = Math.round(Number(carbs || '0') * 1000);
      const fMg = Math.round(Number(fat || '0') * 1000);

      setSaving(true);

      // Create (don’t block on background persistence)
      await createRecipe(pid, {
        name,
        total_weight_g: weight,
        calories: kcal,
        protein_mg: pMg,
        carbs_mg: cMg,
        fat_mg: fMg,
      } as any);

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
        <input className="input" inputMode="numeric" type="number"
               value={totalWeightG} onChange={(e)=>setTotalWeightG(Number(e.target.value || '0'))} />

        <label>Calories (kcal)</label>
        <input className="input" inputMode="numeric" type="number"
               value={calories} onChange={(e)=>setCalories(Number(e.target.value || '0'))} />

        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input className="input" inputMode="decimal"
                   value={protein} onChange={(e)=>setProtein(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input className="input" inputMode="decimal"
                   value={carbs} onChange={(e)=>setCarbs(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input className="input" inputMode="decimal"
                   value={fat} onChange={(e)=>setFat(e.target.value)} />
          </div>
        </div>

        {/* Explicit type="button" + simple handler */}
        <button type="button" className="btn" onClick={onSaveClick} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="small">Tip: v1 is grams-only and totals are frozen when you log an entry.</p>
    </main>
  );
}
