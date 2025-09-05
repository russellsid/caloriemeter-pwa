'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRecipeById, updateRecipe } from '../../../../lib/repos/recipes';

export default function EditRecipe() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const recipeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<string>('0.0');
  const [carbs, setCarbs] = useState<string>('0.0');
  const [fat, setFat] = useState<string>('0.0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await getRecipeById(recipeId);
      if (!r) { alert('Recipe not found'); router.push('/recipes'); return; }
      setName(r.name);
      setTotalWeightG(r.total_weight_g);
      setCalories(r.calories);
      setProtein((r.protein_mg/1000).toString());
      setCarbs((r.carbs_mg/1000).toString());
      setFat((r.fat_mg/1000).toString());
      setLoading(false);
    })();
  }, [recipeId, router]);

  async function save() {
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
      await updateRecipe(recipeId, {
        name,
        total_weight_g: weight,
        calories: kcal,
        protein_mg: pMg,
        carbs_mg: cMg,
        fat_mg: fMg,
      });
      setSaving(false);
      alert('Recipe updated!');
      router.push('/recipes');
    } catch (err: any) {
      setSaving(false);
      alert('Failed to update: ' + (err?.message || String(err)));
    }
  }

  if (loading) return <main><p>Loading…</p></main>;

  return (
    <main>
      <h1>Edit Recipe</h1>
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
          <button className="btn" type="button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <a className="btn" href="/recipes">Cancel</a>
        </div>
      </div>
      <p className="small">Note: Editing a recipe does <b>not</b> change past entries; new entries use the updated values.</p>
    </main>
  );
}
