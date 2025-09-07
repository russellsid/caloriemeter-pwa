'use client';
import { useEffect, useState } from 'react';
import { createRecipe, getDefaultProfileId } from '../../../lib/repos/recipes';

export default function NewRecipe() {
  const [profileId, setProfileId] = useState<string>('');

  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<string>('0.0'); // grams
  const [carbs, setCarbs] = useState<string>('0.0');
  const [fat, setFat] = useState<string>('0.0');
  const [saving, setSaving] = useState(false);

  // NEW: read query params (name, calories, protein_g, carbs_g, fat_g, weight)
  useEffect(() => {
    // In Next App Router, window.location is available on client
    const u = new URL(window.location.href);
    const qp = u.searchParams;

    const n = qp.get('name');          if (n) setName(n);
    const w = Number(qp.get('weight')); if (Number.isFinite(w) && w > 0) setTotalWeightG(w);
    const kc = Number(qp.get('calories')); if (Number.isFinite(kc) && kc >= 0) setCalories(kc);
    const pg = qp.get('protein_g');    if (pg) setProtein(pg);
    const cg = qp.get('carbs_g');      if (cg) setCarbs(cg);
    const fg = qp.get('fat_g');        if (fg) setFat(fg);
  }, []);

  useEffect(() => { (async () => setProfileId(await getDefaultProfileId()))(); }, []);

  async function onSave() {
    try {
      if (!name.trim()) throw new Error('Enter a name');
      const weight = Number(totalWeightG);
      const kcal = Number(calories);
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Total weight must be positive');
      if (!Number.isFinite(kcal) || kcal < 0) throw new Error('Calories must be ≥ 0');

      const pMg = Math.round(Number(protein || '0') * 1000);
      const cMg = Math.round(Number(carbs || '0') * 1000);
      const fMg = Math.round(Number(fat || '0') * 1000);

      setSaving(true);
      await createRecipe(profileId, {
        name,
        total_weight_g: weight,
        calories: kcal,
        protein_mg: pMg,
        carbs_mg: cMg,
        fat_mg: fMg,
      });
      setSaving(false);
      alert('Recipe saved!');
      window.location.href = '/recipes';
    } catch (err: any) {
      setSaving(false);
      alert('Failed: ' + (err?.message || String(err)));
    }
  }

  return (
    <main>
      <h1>New Recipe</h1>
      <div className="card">
        <label>Name</label>
        <input className="input" value={name} onChange={(e)=>setName(e.target.value)} />

        <label>Total recipe weight (g)</label>
        <input className="input" type="number" inputMode="numeric"
               value={totalWeightG} onChange={(e)=>setTotalWeightG(Number(e.target.value || '0'))} />

        <label>Calories (kcal)</label>
        <input className="input" type="number" inputMode="numeric"
               value={calories} onChange={(e)=>setCalories(Number(e.target.value || '0'))} />

        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input className="input" inputMode="decimal" value={protein} onChange={(e)=>setProtein(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input className="input" inputMode="decimal" value={carbs} onChange={(e)=>setCarbs(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input className="input" inputMode="decimal" value={fat} onChange={(e)=>setFat(e.target.value)} />
          </div>
        </div>

        <div className="row" style={{gap:8}}>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <a className="btn" href="/recipes">Cancel</a>
        </div>
      </div>
      <p className="small">Tip: values imported from the Food DB are per 100 g by default—adjust before saving if your recipe is a different total weight.</p>
    </main>
  );
}
