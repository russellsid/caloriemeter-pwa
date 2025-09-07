// app/api/foods/search/route.ts
import { NextResponse } from 'next/server';

// Normalize an Open Food Facts product -> our minimal shape
function normalize(p: any) {
  const n = p?.nutriments || {};
  // kcal sometimes appears as energy-kcal_100g; fall back to energy-kcal
  const calories = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
  const protein_g = Number(n['proteins_100g'] ?? 0);
  const carbs_g  = Number(n['carbohydrates_100g'] ?? 0);
  const fat_g    = Number(n['fat_100g'] ?? 0);

  return {
    id: p.id || p.code || p._id,
    name: p.product_name || p.generic_name || p.brands_tags?.[0] || 'Unknown',
    brand: p.brands || '',
    serving: '100 g', // values are per 100 g
    calories,
    protein_g,
    carbs_g,
    fat_g,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const pageSize = Math.min(20, Math.max(1, Number(searchParams.get('limit') || 12)));

  if (!q) return NextResponse.json({ items: [] }, { status: 200 });

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=${pageSize}`;

  try {
    const r = await fetch(url, { next: { revalidate: 60 } });
    if (!r.ok) throw new Error(`Upstream ${r.status}`);
    const json = await r.json();
    const items = Array.isArray(json?.products) ? json.products.map(normalize) : [];
    const filtered = items.filter(x => x.calories || x.protein_g || x.carbs_g || x.fat_g);
    return NextResponse.json({ items: filtered.slice(0, pageSize) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'fetch failed' }, { status: 500 });
  }
}
