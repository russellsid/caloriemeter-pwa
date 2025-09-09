export type OilLevel = 'none' | 'low' | 'medium' | 'high';

export interface Per100g {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;       // e.g., "Grains>Rice"
  method: string;         // e.g., "boiled" | "tempered" | "stir_fried" | ...
  style: string;          // e.g., "plain" | "jeera" | "biryani" | ...
  oil_level: OilLevel;
  veg_flag: boolean;
  per_100g: Per100g;
}

export interface FoodPack {
  version: number;        // 1
  slug: string;           // "rice_grains"
  items: FoodItem[];
}
