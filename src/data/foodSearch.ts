import type { FoodItem } from '@/types/food';

export interface SearchOpts {
  q?: string;
  category?: string;   // e.g., "Grains>Rice", "Grains>Batter"
  vegOnly?: boolean;   // future-friendly
  limit?: number;      // optional cap on results
}

export function searchFoods(items: FoodItem[], opts: SearchOpts = {}): FoodItem[] {
  const q = (opts.q || '').trim().toLowerCase();
  let out = items;

  if (opts.category) out = out.filter(i => i.category === opts.category);
  if (opts.vegOnly) out = out.filter(i => i.veg_flag);

  if (q) {
    out = out.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  out = out.sort((a, b) => a.name.localeCompare(b.name));
  if (opts.limit && opts.limit > 0) return out.slice(0, opts.limit);
  return out;
}
