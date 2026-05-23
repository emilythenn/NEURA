// Maps predict-page UI categories to their equivalent tracker/DB categories.
// UI labels are preserved; this mapping only applies during data lookup.
export const CATEGORY_MAP: Record<string, string> = {
  "groceries & needs":       "Food & Dining",
  "dining & cafes":          "Food & Dining",
  "shopping & gadgets":      "Shopping",
  "travel & luxury":         "Luxury & Travel",
  "transportation":          "Transportation",
  "bills & utilities":       "Bills & Utilities",
  "savings & investments":   "Savings",
  "entertainment":           "Entertainment",
  "healthcare":              "Healthcare",
  "islamic finance & zakat": "Islamic Finance & Zakat",
};

export function normalizeCategory(cat: string): string {
  return cat?.toLowerCase().trim() ?? "";
}

export function mapToTrackerCategory(cat: string): string {
  const key = normalizeCategory(cat);
  return CATEGORY_MAP[key] ?? cat;
}
