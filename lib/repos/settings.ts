import fs from "fs";
import path from "path";
import { Targets } from "types";

const dataPath = path.join(process.cwd(), "data", "settings.json");

/** Retrieve the daily macro targets from the settings JSON file. */
export function getTargets(): Targets {
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    // If the JSON has a "daily" property, return that, otherwise assume it is the target object itself.
    return data.daily ? data.daily : data;
  } catch (err) {
    console.error("Error reading settings.json:", err);
    // Return default targets if file read fails
    return { kcal: 2000, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  }
}

/** Update the daily macro targets in the settings JSON file. */
export function updateTargets(newTargets: Targets): void {
  const data = { daily: newTargets };
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing settings.json:", err);
  }
}
