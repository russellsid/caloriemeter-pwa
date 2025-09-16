'use client';

import { useEffect, useState } from 'react';
import {
  getRecipeById,
  updateRecipe,
  Recipe,
} from '../../../../lib/repos/recipes';

type Props = {
  params: { id: string };
};

export default function EditRecipePage({ params }: Props) {
  const { id } = params;

  // form state (grams for macros)
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<string>('0.0');
  const [carbs, setCarbs] = useState<string>('0.0');
  const [fat, setFat] = useState<string>('0.0');
  const [fiber, setFiber] = useState<string>('0.0'); // NEW: grams
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const rec: Recipe | undefined = getRecipeById(id);
    if (!rec) {
      alert('Recipe not found');
      window.location.href = '/recipes';
      return;
    }
    setName(rec.name);
    setTotalWeightG(rec.total_weight_g);
    setCalories(rec.calories);
    setProtein((rec.protein_mg / 1000).toFixed(1));
    setCarbs((rec.carbs_mg / 1000).toFixed(1));
    setFat((rec.fat_mg / 1000).toFixed(1));
    setFiber(((rec.fiber_mg ?? 0) / 1000).toFixed(1)); // NEW
    setLoaded(true);
  }, [id]);

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
      const fiberMg = Math.round(Number(fiber || '0') * 1000); // NEW

      setSaving(true);
      await updateRecipe(id, {
        name: name.trim(),
        total_weight_g: weight,
        calories: kcal,
        protein_mg: pMg,
        carbs_mg: cMg,
        fat_mg: fMg,
        fiber_mg: fiberMg, // NEW
      });
      setSaving(false);
      alert('Recipe updated!');
      window.location.href = '/recipes';
    } catch (err: any) {
      setSaving(false);
      alert('Failed: ' + (err?.message || String(err)));
    }
  }

  if (!loaded) {
    return (
      <main>
        <h1>Edit Recipe</h1>
        <div className="card"><p className="small">Loading…</p></div>
      </main>
    );
  }

  return (
    <main>
      <h1>Edit Recipe</h1>
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
          onChange={(e)=>setCalories(Number(e.target.value || '0'))}
        />

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
          <div style={{flex:1}}>
            <label>Fiber (g)</label> {/* NEW */}
            <input className="input" inputMode="decimal" value={fiber} onChange={(e)=>setFiber(e.target.value)} />
          </div>
        </div>

        <div className="row" style={{gap:8}}>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <a className="btn" href="/recipes">Cancel</a>
        </div>
      </div>
    </main>
  );
}
