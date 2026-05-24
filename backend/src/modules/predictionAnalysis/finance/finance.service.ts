import { getIncomes, getExpenses } from "../tracker/tracker.service";
import { FinancialSummary, HealthLabel, CategoryBreakdown, MonthlyPoint, SpendingPatternResult } from "./finance.model";
import { mapToTrackerCategory, normalizeCategory } from "../shared/category.utils";

// Expense categories that are non-discretionary (fixed obligations).
// Discretionary budget = totalIncome - sum of these categories.
const FIXED_CATEGORIES = new Set([
  "Bills & Utilities",
  "Transportation",
  "Savings",
  "Investments",
]);

export const CATEGORY_RISK: Record<string, number> = {
  // Tracker (DB) categories
  "Food & Dining":           5,
  "Transportation":          5,
  "Bills & Utilities":       15,
  "Shopping":                25,
  "Entertainment":           25,
  "Savings":                 0,
  "Investments":             0,
  // Mapped-to categories (from predict UI)
  "Luxury & Travel":         35,
  "Healthcare":              5,
  "Islamic Finance & Zakat": 0,
  // Legacy keys retained for any stored predict history
  "Luxury":                  35,
  "Gadgets & Wants":         25,
  "Dining & Cafes":          10,
  "Groceries & Needs":       5,
};

export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  const [incomes, expenses] = await Promise.all([
    getIncomes(userId),
    getExpenses(userId),
  ]);

  const totalIncome   = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netBalance    = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Fixed expenses = sum of non-discretionary categories (bills, transport, savings, investments)
  const fixedExpenses = expenses
    .filter(e => FIXED_CATEGORIES.has(e.category))
    .reduce((s, e) => s + e.amount, 0);

  // Discretionary budget = income remaining after fixed obligations are covered
  const discretionaryBudget = Math.max(0, totalIncome - fixedExpenses);

  const catMap = new Map<string, number>();
  for (const e of expenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  }
  const categoryBreakdown: CategoryBreakdown[] = Array.from(catMap.entries())
    .map(([category, total]) => ({
      category, total,
      pct: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const last6MonthsTrend: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const month = d.toLocaleString("en-MY", { month: "short" });
    last6MonthsTrend.push({
      month, key,
      income:   incomes.filter(x => x.date.startsWith(key)).reduce((s, x) => s + x.amount, 0),
      expenses: expenses.filter(x => x.date.startsWith(key)).reduce((s, x) => s + x.amount, 0),
    });
  }

  const financialHealthLabel: HealthLabel =
    savingsRate >= 30 ? "Excellent" :
    savingsRate >= 15 ? "Healthy"   :
    savingsRate >= 0  ? "Tight"     : "At Risk";

  return {
    userId, totalIncome, totalExpenses, netBalance,
    fixedExpenses:       Math.round(fixedExpenses       * 100) / 100,
    discretionaryBudget: Math.round(discretionaryBudget * 100) / 100,
    savingsRate:         Math.round(savingsRate          * 10)  / 10,
    categoryBreakdown, last6MonthsTrend, financialHealthLabel,
  };
}

export async function analyzeSpendingPattern(
  userId: string, category: string, amount: number
): Promise<SpendingPatternResult> {
  const rawExpenses = await getExpenses(userId);
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : (rawExpenses as any).data ?? [];

  const mappedCategory = mapToTrackerCategory(category);
  const catExpenses = expenses.filter(
    e => normalizeCategory(e.category) === normalizeCategory(mappedCategory)
  );

  console.log("Current category:", category);
  console.log("Mapped to tracker category:", mappedCategory);
  console.log("All categories:", expenses.map((e: any) => e.category));
  console.log("Matched count:", catExpenses.length);

  if (catExpenses.length === 0) {
    return {
      label:            "no_data",
      categoryBaseline: null,
      confidence:       "low",
      message:          "No spending history for this category yet.",
      ratio:            null,
      sampleCount:      0,
    };
  }

  if (catExpenses.length === 1) {
    return {
      label:            "low_confidence",
      categoryBaseline: null,
      confidence:       "low",
      message:          "Only one past entry — building your pattern.",
      ratio:            null,
      sampleCount:      1,
    };
  }

  const categoryBaseline =
    catExpenses.reduce((s: number, e: any) => s + e.amount, 0) / catExpenses.length;
  const ratio = amount / categoryBaseline;

  const label: SpendingPatternResult["label"] =
    ratio < 0.7   ? "lower_than_usual"      :
    ratio <= 1.3  ? "normal"                :
    ratio <= 2.0  ? "higher_than_usual"     : "much_higher_than_usual";

  const confidence: SpendingPatternResult["confidence"] =
    catExpenses.length >= 10 ? "high" :
    catExpenses.length >= 5  ? "medium" : "low";

  const baselineStr = `RM ${categoryBaseline.toFixed(2)}`;
  const message =
    label === "lower_than_usual"      ? `Below your usual ${baselineStr} for this category.` :
    label === "normal"                ? `Matches your usual spending (avg ${baselineStr}).`   :
    label === "higher_than_usual"     ? `A bit higher than your usual ${baselineStr}.`        :
                                        `Much higher than your usual ${baselineStr} — this stands out.`;

  return {
    label,
    categoryBaseline: Math.round(categoryBaseline * 100) / 100,
    confidence,
    message,
    ratio: Math.round(ratio * 100) / 100,
    sampleCount: catExpenses.length,
  };
}