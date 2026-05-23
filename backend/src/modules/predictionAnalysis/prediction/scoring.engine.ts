import { CATEGORY_RISK } from "../finance/finance.service";
import { mapToTrackerCategory } from "../shared/category.utils";

export type Verdict       = "PROCEED" | "REVIEW" | "RECONSIDER";
export type PressureLevel = "LOW" | "MEDIUM" | "CRITICAL";
export type ClassLabel    = "reasonable" | "risky" | "impulsive" | "financially_heavy";

export interface ScoringInput {
  itemName:            string;
  category:            string;
  amount:              number;
  impulseSignal:       boolean;
  currentBalance:      number;
  discretionaryBudget: number;
}

export interface ScoringResult {
  riskScore:              number;
  verdict:                Verdict;
  pressureLevel:          PressureLevel;
  classification:         ClassLabel;
  impulseProbability:     number;
  budgetImpactPercent:    number;
  budgetDiscPercent:      number;
  remainingAfterPurchase: number;
  willGoNegative:         boolean;
  lateNightActive:        boolean;
  scoreBreakdown: {
    balanceComponent: number;
    budgetComponent:  number;
    impulseComponent: number;
    categoryRisk:     number;
    modifiers:        number;
  };
}

// Known upper bound of CATEGORY_RISK values (Luxury = 35).
// Used to normalize category contribution to its reserved weight slot.
const CATEGORY_RISK_CEILING = 35;

export function scoreInput(input: ScoringInput): ScoringResult {
  const { amount, impulseSignal, currentBalance, discretionaryBudget, category } = input;

  // ── Safe denominators (prevent division by zero) ──────────────────────
  const safeBalance       = Math.max(currentBalance,      0.01);
  const safeDiscretionary = Math.max(discretionaryBudget, 0.01);

  // ── Derived financials ─────────────────────────────────────────────────
  const remainingAfterPurchase = currentBalance - amount;
  const willGoNegative         = remainingAfterPurchase < 0;

  // Uncapped percentages — displayed as-is so users see "130%" when warranted
  const budgetImpactPercent = (amount / safeBalance)       * 100;
  const budgetDiscPercent   = (amount / safeDiscretionary) * 100;

  // ── Behavioral signal ──────────────────────────────────────────────────
  const lateNightActive = isLateNight();

  // ── Scoring components — weights sum exactly to 100 ───────────────────
  //
  //   W1 = 40  Balance impact      (how much of total balance is consumed)
  //   W2 = 25  Discretionary impact(how much of spending budget is consumed)
  //   W3 = 14  Impulse signal      (user-toggled behavioral flag)
  //   W4 = 15  Category risk       (normalized from CATEGORY_RISK_CEILING)
  //   W5 =  6  Late-night modifier (time-of-day behavioral signal)
  //   ────────────────────────────────────────────────────────
  //   Total max = 100
  //
  // Each component ratio is clamped to [0, 1] before multiplying its weight,
  // so the raw sum is bounded [0, 100] by construction — no post-hoc clamps needed.

  const balanceRatio     = Math.min(1, budgetImpactPercent / 100);
  const discRatio        = Math.min(1, budgetDiscPercent   / 100);

  const balanceComponent  = balanceRatio * 40;
  const budgetComponent   = discRatio    * 25;
  const impulseComponent  = impulseSignal   ? 14 : 0;
  const modifiers         = lateNightActive ?  6 : 0;

  // Normalize raw category weight into its 15-point slot
  const rawCategoryRisk  = CATEGORY_RISK[mapToTrackerCategory(category)] ?? 10;
  const categoryComponent =
    (Math.min(rawCategoryRisk, CATEGORY_RISK_CEILING) / CATEGORY_RISK_CEILING) * 15;

  // riskScore is naturally [0, 100] — no artificial cap or post-hoc inflation
  const rawScore  = balanceComponent + budgetComponent + impulseComponent + categoryComponent + modifiers;
  const riskScore = Math.min(100, Math.round(rawScore));

  // ── Impulse probability ────────────────────────────────────────────────
  //
  // "Typical single purchase" is anchored to the user's actual budget, not a
  // hardcoded constant. Uses 15% of monthly discretionary as the baseline;
  // falls back to 5% of current balance when discretionary is not meaningful.
  //
  // sizeFactor    (0–1): how unusually large is this amount vs. the user's norm?
  // behavioralScore(0–1): combined strength of explicit behavioral signals.
  //
  // Formula: sizeFactor drives up to 40 pts; behavioral signals drive up to 60 pts.
  // This keeps impulseProbability proportional to both financial context and behavior.

  const typicalAmount    = discretionaryBudget > 10
    ? safeDiscretionary * 0.15
    : safeBalance * 0.05;

  const relativeSize     = amount / Math.max(typicalAmount, 0.01);
  // Scale: 0 at or below typical spend; reaches 1 at 5× typical
  const sizeFactor       = Math.min(1, Math.max(0, relativeSize - 1) / 4);

  const behavioralScore  = (impulseSignal   ? 0.55 : 0)
                         + (lateNightActive ? 0.25 : 0);  // max 0.80

  const impulseProbability = Math.min(100, Math.round(
    sizeFactor    * 40
  + behavioralScore * 60
  ));

  // ── Hard rules — verdict and pressureLevel ONLY ────────────────────────
  //
  // willGoNegative is a binary disqualifier: it forces RECONSIDER regardless of
  // the computed riskScore. The score itself is NOT inflated to reflect this —
  // it remains a pure financial math output. Separating hard rules from the score
  // prevents score distortion while preserving decision correctness.

  const pressureLevel: PressureLevel =
    willGoNegative || budgetImpactPercent > 70 ? "CRITICAL" :
    budgetImpactPercent > 30                   ? "MEDIUM"   : "LOW";

  const verdict: Verdict =
    willGoNegative || riskScore >= 70 ? "RECONSIDER" :
    riskScore >= 40                   ? "REVIEW"     : "PROCEED";

  // ── Classification ─────────────────────────────────────────────────────
  const classification: ClassLabel =
    willGoNegative || pressureLevel === "CRITICAL" ? "financially_heavy" :
    impulseProbability > 60                        ? "impulsive"         :
    riskScore          >= 40                       ? "risky"             : "reasonable";

  return {
    riskScore,
    verdict,
    pressureLevel,
    classification,
    impulseProbability,
    budgetImpactPercent: Math.round(budgetImpactPercent * 10) / 10,
    budgetDiscPercent:   Math.round(budgetDiscPercent   * 10) / 10,
    remainingAfterPurchase,
    willGoNegative,
    lateNightActive,
    scoreBreakdown: {
      balanceComponent:  Math.round(balanceComponent   * 10) / 10,
      budgetComponent:   Math.round(budgetComponent    * 10) / 10,
      impulseComponent:  Math.round(impulseComponent   * 10) / 10,
      categoryRisk:      Math.round(categoryComponent  * 10) / 10,
      modifiers:         Math.round(modifiers          * 10) / 10,
    },
  };
}

function isLateNight(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}
