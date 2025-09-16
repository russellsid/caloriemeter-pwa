'use client';

import { useEffect, useMemo, useState } from 'react';
import { createRecipe, getDefaultProfileId } from '../../../lib/repos/recipes';

export default function NewRecipePage() {
  // form state (whole-recipe totals)
  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<string>('0.0'); // grams
  const [carbs, setCarbs] = useState<string>('0.0');     // grams
  const [fat, setFat] = useState<string>('0.0');         // grams
  const [fiber, setFiber] = useState<string>('0.0');     // grams
  const [saving, setSaving] = useState(false);

  // If we came from /foods "Use", these capture per-100g and enable auto-scaling with weight
  const [autoScale, setAutoScale] = useState(false);
  const [basePer100, setBasePer100] = useState<{
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  }>({});

  // When total weight changes and autoScale is on, recompute totals from per-100g
  useEffect(() => {
    if (!autoScale) return;
    const factor = Math.max(1, totalWeightG) / 100;

    if (typeof basePer100.calories === 'number') {
      setCalories(Math.max(0, Math.round(basePer100.calories * factor)));
    }
    function fmt1(n: number) { return (Math.round(n * 10) / 10).toFixed(1); }

    if (typeof basePer100.protein_g === 'number') {
      setProtein(fmt1(basePer100.protein_g * factor));
    }
    if (typeof basePer100.carbs_g === 'number') {
      setCarbs(fmt1(basePer100.carbs_g * factor));
    }
    if (typeof basePer100.fat_g === 'number') {
      setFat(fmt1(basePer100.fat_g * factor));
    }
    if (typeof basePer100.fiber_g === 'number') {
      setFiber(fmt1(basePer100.fiber_g * factor));
    }
  }, [totalWeightG, autoScale, basePer100]);

  // On first load, read query params from /recipes/new?name=&calories=&protein_g=&carbs_g=&fat_g=&fiber_g=
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const qp = (k: string) => u.searchParams.get(k) || '';

      const qName = qp('name').trim();
      const qCal = qp('calories');
      const qP = qp('protein_g');
      const qC = qp('carbs_g');
      const qF = qp('fat_g');
      const qFiber = qp('fiber_g');

      if (qName) setName(qName);

      // If any per-100g numbers are present, activate auto-scale and default weight to 100 g
      const anyPer100 =
        qCal !== '' || qP !== '' || qC !== '' || qF !== '' || qFiber !== '';

      if (anyPer100) {
        const b = {
          calories: qCal ? Number(qCal) : undefined,
          protein_g: qP ? Number(qP) : undefined,
          carbs_g: qC ? Number(qC) : undefined,
          fat_g: qF ? Number(qF) : undefined,
          fiber_g: qFiber ? Number(qFiber) : undefined,
        };
        setBasePer100(b);
        setAutoScale(true);
        setTotalWeightG(100); // <-- key: per-100g basis
      }
    } catch {
      // ignore
    }
  }, []);

  // If user manually edits any total macro/calorie -> turn off auto-scale
  function stopAutoScale() { if (autoScale) setAutoScale(false); }
  function fmt1(n: number) { return (Math.round(n * 10) / 10).toFixed(1); }

  async function onSave() {
    try {
      const nm = name.trim();
      if (!nm) throw new Error('Enter a name');
      const w = Math.max(1, Math.round(totalWeightG));
      const kcal = Math.max(0, Math.round(calories));
      const pMg = Math.max(0, Math.round(Number(protein || '0') * 1000));
      const cMg = Math.max(0, Math.round(Number(carbs || '0') * 1000));
      const fMg = Math.max(0, Math.round(Number(fat || '0') * 1000));
      const fiberMg = Math.max(0, Math.round(Number(fiber || '0') * 1000));

      setSaving(true);
      const profileId = await getDefaultProfileId();
      await createRecipe(profileId, {
        name: nm,
        total_weight_g: w,
        calories: kcal,
        protein_mg: pMg,
        carbs_mg: cMg,
        fat_mg: fMg,
        fiber_mg: fiberMg,
      });
      setSaving(false);
      alert('Recipe saved!');
      window.location.href = '/recipes';
    } catch (e: any) {
      setSaving(false);
      alert('Failed: ' + (e?.message || String(e)));
    }
  }

  return (
    <main>
      <h1>New Recipe</h1>
      <div className="card">
        <label>Name</label>
        <input className="input" value={name} onChange={(e)=>setName(e.target.value)} />

        <label>Total recipe weight (g)</label>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          value={totalWeightG}
          onChange={(e)=>setTotalWeightG(Number(e.target.value || '0'))}
        />

        <label>Calories (kcal)</label>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          value={calories}
          onChange={(e)=>{ stopAutoScale(); setCalories(Number(e.target.value || '0')); }}
        />

        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input className="input" inputMode="decimal" value={protein}
                   onChange={(e)=>{ stopAutoScale(); setProtein(e.target.value); }} />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input className="input" inputMode="decimal" value={carbs}
                   onChange={(e)=>{ stopAutoScale(); setCarbs(e.target.value); }} />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input className="input" inputMode="decimal" value={fat}
                   onChange={(e)=>{ stopAutoScale(); setFat(e.target.value); }} />
          </div>
          <div style={{flex:1}}>
            <label>Fiber (g)</label>
            <input className="input" inputMode="decimal" value={fiber}
                   onChange={(e)=>{ stopAutoScale(); setFiber(e.target.value); }} />
          </div>
        </div>

        {/* Hint shown only when auto-scaling from per-100g */}
        {autoScale && (
          <p className="small" style={{opacity:0.8, marginTop:8}}>
            Prefilled from food DB (per 100 g). Changing total weight will auto-scale values.
          </p>
        )}

        <div className="row" style={{gap:8, marginTop:8}}>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <a className="btn" href="/recipes">Cancel</a>
        </div>
      </div>
    </main>
  );
}
