import type { FoodPack } from '@/types/food';

const DB_URL = '/db/foods.rice_grains.v1.json';   // served from /public
const LS_KEY = 'foodPack_rice_grains';
const LS_VERSION_KEY = 'foodPack_rice_grains_version';

export async function loadRiceGrainsPack(): Promise<FoodPack> {
  // Always attempt to fetch latest (so PWA updates promptly)
  let freshPack: FoodPack | null = null;
  try {
    const res = await fetch(DB_URL, { cache: 'no-store' });
    if (res.ok) {
      freshPack = (await res.json()) as FoodPack;
    }
  } catch {
    // swallow — we'll fallback to cache
  }

  const cached = localStorage.getItem(LS_KEY);
  const cachedVersion = Number(localStorage.getItem(LS_VERSION_KEY) || 0);

  // If we fetched something newer (or no cache), store & return it
  if (freshPack && (freshPack.version > cachedVersion || !cached)) {
    localStorage.setItem(LS_KEY, JSON.stringify(freshPack));
    localStorage.setItem(LS_VERSION_KEY, String(freshPack.version));
    return freshPack;
  }

  // Else prefer cached if available
  if (cached) {
    try {
      return JSON.parse(cached) as FoodPack;
    } catch {
      // fallthrough to freshPack
    }
  }

  // Final fallback: if fetch worked use it, else throw
  if (freshPack) return freshPack;
  throw new Error('Unable to load rice/grains database');
}
