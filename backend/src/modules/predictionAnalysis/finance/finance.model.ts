export type HealthLabel = "Excellent" | "Healthy" | "Tight" | "At Risk";

export type PatternLabel =
  | "insufficient_data"
  | "lower_than_usual"
  | "normal"
  | "higher_than_usual"
  | "much_higher_than_usual";

export interface SpendingPatternResult {
  label:             PatternLabel;
  categoryBaseline:  number | null;
  confidence:        "low" | "medium" | "high";
  message:           string;
  ratio:             number | null;
  sampleCount:       number;
}

export interface CategoryBreakdown {
  category: string;
  total:    number;
  pct:      number;
}

export interface MonthlyPoint {
  month:    string;
  key:      string;
  income:   number;
  expenses: number;
}

export interface FinancialSummary {
  userId:               string;
  totalIncome:          number;
  totalExpenses:        number;
  netBalance:           number;
  fixedExpenses:        number;
  discretionaryBudget:  number;
  savingsRate:          number;
  categoryBreakdown:    CategoryBreakdown[];
  last6MonthsTrend:     MonthlyPoint[];
  financialHealthLabel: HealthLabel;
}