'use client';

import { useEffect, useState } from 'react';
import { createRecipe, getDefaultProfileId } from '../../../lib/repos/recipes';
import { macrosToCalories } from '../../../lib/utils/macros';
import { addEntryFromRecipe } from '../../../lib/repos/diary';
import { todayDiaryDay } from '../../../lib/utils/dayBoundary';

export default function NewRecipePage() {
  // form state (whole-recipe totals)
  const [name, setName] = useState('');
  const [totalWeightG, setTotalWeightG] = useState<number>(1000);

  // calories support "auto-calc unless manually overridden"
  const [calories, setCalories] = useState<number>(0);
  const [caloriesTouched, setCaloriesTouched] = useState<boolean>(false);

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

  // helpers
  function fmt1(n: number) { return (Math.round(n * 10) / 10).toFixed(1); }
  function toNum(s: string): number {
    const n = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function stopAutoScale() { if (autoScale) setAutoScale(false); }

  // 1) On first load, read query params from /recipes/new?name=&calories=&protein_g=&carbs_g=&fat_g=&fiber_g=
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
        setTotalWeightG(100); // per-100g basis
        // Calories will be derived from macros below.
      }
    } catch {
      // ignore
    }
  }, []);

  // 2) When total weight changes and autoScale is on, recompute totals from per-100g (macros only).
  useEffect(() => {
    if (!autoScale) return;
    const factor = Math.max(1, totalWeightG) / 100;

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
    // Keep calories derived from macros via the effect below.
  }, [totalWeightG, autoScale, basePer100]);

  // 3) Auto-calc calories whenever macros change, *unless* user manually edited calories.
  useEffect(() => {
    if (caloriesTouched) return;
    const p = toNum(protein);
    const c = toNum(carbs);
    const f = toNum(fat);
    const auto = Math.round(macrosToCalories(p, c, f));
    setCalories(auto);
  }, [protein, carbs, fat, caloriesTouched]);

  // --- shared helpers ---
  function per100gFromWhole({
    calories, protein_g, carbs_g, fat_g, fiber_g, totalWeightG,
  }: {
    calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; totalWeightG: number;
  }) {
    // Convert whole-recipe totals into per-100g basis.
    const factor100 = 100 / Math.max(1, totalWeightG);
    const p100 = +(protein_g * factor100).toFixed(1);
    const c100 = +(carbs_g   * factor100).toFixed(1);
    const f100 = +(fat_g     * factor100).toFixed(1);
    const fib100 = +(fiber_g * factor100).toFixed(1);
    // Calories from macros (avoid drift)
    const kcal100 = Math.round(macrosToCalories(p100, c100, f100));
    return { calories: kcal100, protein_g: p100, carbs_g: c100, fat_g: f100, fiber_g: fib100 };
  }

  async function saveRecipeAsEntered() {
    const nm = name.trim();
    if (!nm) throw new Error('Enter a name');

    const w = Math.max(1, Math.round(totalWeightG));
    const kcal = Math.max(0, Math.round(calories));
    const pMg = Math.max(0, Math.round(toNum(protein) * 1000));
    const cMg = Math.max(0, Math.round(toNum(carbs) * 1000));
    const fMg = Math.max(0, Math.round(toNum(fat) * 1000));
    const fiberMg = Math.max(0, Math.round(toNum(fiber) * 1000));

    const profileId = await getDefaultProfileId();
    const rec = await createRecipe(profileId, {
      name: nm,
      total_weight_g: w,
      calories: kcal,
      protein_mg: pMg,
      carbs_mg: cMg,
      fat_mg: fMg,
      fiber_mg: fiberMg,
    });
    return { rec, profileId };
  }

  async function saveRecipeNormalizedPer100g() {
    // Normalize the *saved* recipe to 100 g (per-100g macros/kcal), even if the user typed 150 g etc.
    const nm = name.trim();
    if (!nm) throw new Error('Enter a name');

    // Build per-100g from the current whole totals (what user sees on screen)
    const p100 = per100gFromWhole({
      calories,
      protein_g: toNum(protein),
      carbs_g: toNum(carbs),
      fat_g: toNum(fat),
      fiber_g: toNum(fiber),
      totalWeightG,
    });

    const profileId = await getDefaultProfileId();
    const rec = await createRecipe(profileId, {
      name: nm,
      total_weight_g: 100, // normalized
      calories: p100.calories,
      protein_mg: Math.round(p100.protein_g * 1000),
      carbs_mg:   Math.round(p100.carbs_g   * 1000),
      fat_mg:     Math.round(p100.fat_g     * 1000),
      fiber_mg:   Math.round(p100.fiber_g   * 1000),
    });
    return { rec, profileId, per100: p100 };
  }

  // --- actions ---
  async function onSave() {
    try {
      setSaving(true);
      await saveRecipeAsEntered();
      setSaving(false);
      alert('Recipe saved!');
      window.location.href = '/recipes';
    } catch (e: any) {
      setSaving(false);
      alert('Failed: ' + (e?.message || String(e)));
    }
  }

  async function onSaveAndAddToday() {
    try {
      setSaving(true);

      let recId: string;
      let profileId: string;
      let per100: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };

      if (autoScale) {
        // Save recipe normalized to per-100g; add today's entry with *user-entered grams*
        const res = await saveRecipeNormalizedPer100g();
        recId = res.rec.id;
        profileId = res.profileId;
        per100 = res.per100;
      } else {
        // Save recipe exactly as entered; derive per-100g for diary add
        const res = await saveRecipeAsEntered();
        recId = res.rec.id;
        profileId = res.profileId;
        per100 = per100gFromWhole({
          calories,
          protein_g: toNum(protein),
          carbs_g: toNum(carbs),
          fat_g: toNum(fat),
          fiber_g: toNum(fiber),
          totalWeightG,
        });
      }

      const day = todayDiaryDay(2);
      await addEntryFromRecipe({
        profile_id: profileId,
        day,
        recipe_id: recId,
        label: name.trim(),
        grams: Math.max(1, Math.round(totalWeightG)), // log exactly what user entered (e.g., 150 g)
        per100g: per100,
      });

      setSaving(false);
      alert('Saved and added to Today!');
      window.location.href = '/';
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
          onChange={(e)=>{ setCaloriesTouched(true); setCalories(Number(e.target.value || '0')); }}
        />
        <p className="small" style={{ marginTop: -6, opacity: 0.75 }}>
          Auto-calculated from Protein/Carbs/Fat unless you edit this field.
        </p>

        <div className="row">
          <div style={{flex:1}}>
            <label>Protein (g)</label>
            <input
              className="input"
              inputMode="decimal"
              value={protein}
              onChange={(e)=>{ stopAutoScale(); setProtein(e.target.value); }}
            />
          </div>
          <div style={{flex:1}}>
            <label>Carbs (g)</label>
            <input
              className="input"
              inputMode="decimal"
              value={carbs}
              onChange={(e)=>{ stopAutoScale(); setCarbs(e.target.value); }}
            />
          </div>
          <div style={{flex:1}}>
            <label>Fat (g)</label>
            <input
              className="input"
              inputMode="decimal"
              value={fat}
              onChange={(e)=>{ stopAutoScale(); setFat(e.target.value); }}
            />
          </div>
          <div style={{flex:1}}>
            <label>Fiber (g)</label>
            <input
              className="input"
              inputMode="decimal"
              value={fiber}
              onChange={(e)=>{ stopAutoScale(); setFiber(e.target.value); }}
            />
          </div>
        </div>

        {/* Hint shown only when auto-scaling from per-100g */}
        {autoScale && (
          <p className="small" style={{opacity:0.8, marginTop:8}}>
            Prefilled from food DB (per 100 g). Changing total weight will auto-scale values.
          </p>
        )}

        <div className="row" style={{gap:8, marginTop:8, flexWrap:'wrap'}}>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn" type="button" onClick={onSaveAndAddToday} disabled={saving}>
            {saving ? 'Working…' : 'Save & Add to Today'}
          </button>
          <a className="btn" href="/recipes">Cancel</a>
        </div>
      </div>
    </main>
  );
}
