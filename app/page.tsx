"use client";

import { useState } from "react";
import { getEntries, removeEntry, updateEntryWeight, sumTotals } from "lib/repos/diary";
import settingsData from "data/settings.json";
import { DiaryEntry, Targets } from "types";

const initialTargets: Targets = settingsData.daily;
const initialEntries: DiaryEntry[] = getEntries();
const initialTotals = sumTotals();

export default function HomePage() {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [totals, setTotals] = useState(initialTotals);

  const handleWeightChange = (entryId: string, newWeight: number) => {
    updateEntryWeight(entryId, newWeight);
    // Update state with new list and totals
    setEntries([...getEntries()]);
    setTotals(sumTotals());
  };

  const handleDelete = (entryId: string) => {
    removeEntry(entryId);
    setEntries([...getEntries()]);
    setTotals(sumTotals());
  };

  return (
    <main>
      <h2>Today</h2>
      {/* Daily totals progress for calories and macros including fiber */}
      <p>Calories: {totals.kcal.toFixed(1)} / {initialTargets.kcal.toFixed(1)} kcal</p>
      <p>Protein: {totals.protein_g.toFixed(1)} / {initialTargets.protein_g.toFixed(1)} g</p>
      <p>Carbs: {totals.carbs_g.toFixed(1)} / {initialTargets.carbs_g.toFixed(1)} g</p>
      <p>Fat: {totals.fat_g.toFixed(1)} / {initialTargets.fat_g.toFixed(1)} g</p>
      <p>Fiber: {totals.fiber_g.toFixed(1)} / {initialTargets.fiber_g.toFixed(1)} g</p>

      {/* Diary entries list */}
      <h3>Diary Entries</h3>
      <ul>
        {entries.map(entry => (
          <li key={entry.id}>
            <strong>{entry.recipeName}</strong> – {entry.weight} g – {entry.kcal.toFixed(1)} kcal{" "}
            <input
              type="number"
              value={entry.weight}
              step="1"
              onChange={(e) => handleWeightChange(entry.id, Number(e.target.value))}
              style={{ width: "60px" }}
            />{" "}
            <button onClick={() => handleDelete(entry.id)}>✕</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
