import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, LineChart, ArrowRight,
  History, ChevronDown, Info, Trash2, Loader2,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

type DecisionClass = "reasonable" | "risky" | "impulsive" | "financially_heavy";

type PatternLabel =
  | "no_data"
  | "low_confidence"
  | "insufficient_data"
  | "lower_than_usual"
  | "normal"
  | "higher_than_usual"
  | "much_higher_than_usual";

type SpendingPatternResult = {
  label:            PatternLabel;
  categoryBaseline: number | null;
  confidence:       "low" | "medium" | "high";
  message:          string;
  ratio:            number | null;
  sampleCount:      number;
};

type PredictResult = {
  itemName: string;
  amount: number;
  classification: DecisionClass;
  result: {
    recommendation: "PROCEED" | "REVIEW" | "RECONSIDER";
    riskScore: number;
    explanation: string;
  };
  spending: {
    categoryBaseline: number | null;
    feel: PatternLabel;
    summary: string;
  };
  affordability: {
    budgetImpactPct: number;
    budgetDiscPct: number;
    remainingAfterPurchase: number;
    willGoNegative: boolean;
    pressure: "LOW" | "MEDIUM" | "CRITICAL";
  };
  behavioral: {
    impulseProbability: number;
    lateNightActive: boolean;
    frequencyNote: string;
  };
};

type HistoryEntry = {
  id: string;
  itemName: string;
  category: string;
  amount: number;
  recommendation: "PROCEED" | "REVIEW" | "RECONSIDER";
  riskScore: number;
  explanation: string;
  timestamp: number;
  breakdown: {
    budget:  { impactPct: number; remaining: number; pressure: "LOW" | "MEDIUM" | "HIGH"; summary: string };
    pattern: { feel: PatternLabel | "in-line" | "a-bit-higher" | "much-higher"; categoryBaseline: number | null; consistency: string; summary: string };
    impulse: { probability: number; lateNight: boolean; signals: string[]; summary: string };
  };
};

// ── Local prediction logic ───────────────────────────────────────────────────

function runPredict(input: {
  amount: string;
  itemName: string;
  category: string;
  isImpulseSignal: boolean;
  totalBalance?: number;
  discretionaryBudget?: number;
  patternData?: SpendingPatternResult;
}): PredictResult {
  const amount        = parseFloat(input.amount) || 0;
  const totalBalance  = input.totalBalance  ?? 0;
  const discretionary = input.discretionaryBudget ?? 0;

  // ── 1. Primary constraint: totalBalance ──────────────────────────────────
  const remainingAfterPurchase = totalBalance - amount;
  const willGoNegative         = remainingAfterPurchase < 0;
  const budgetImpactPct        = totalBalance > 0 ? (amount / totalBalance) * 100 : 999;
  const budgetDiscPct          = discretionary > 0 ? Math.min(100, (amount / discretionary) * 100) : 100;

  // ── 2. Spending pattern (from real backend baseline — no hardcoded values) ─
  const feel: PatternLabel            = input.patternData?.label ?? "insufficient_data";
  const categoryBaseline: number|null = input.patternData?.categoryBaseline ?? null;
  const spendingSummary: string       = input.patternData?.message
    ?? "No spending history available for this category yet.";

  // ── 3. Impulse probability ───────────────────────────────────────────────
  // Use category baseline when available, else fall back to a budget-derived anchor.
  const typicalAmount = categoryBaseline !== null && categoryBaseline > 0
    ? categoryBaseline
    : discretionary > 10 ? discretionary * 0.15 : Math.max(totalBalance, 1) * 0.05;
  const relativeSize  = amount / Math.max(typicalAmount, 0.01);
  const sizeFactor    = Math.min(1, Math.max(0, relativeSize - 1) / 4);
  const impulseProbability = Math.min(98, Math.round(
    sizeFactor * 40 + (input.isImpulseSignal ? 58 : 0)
  ));

  // ── 4. Risk score ─────────────────────────────────────────────────────────
  const cappedImpact = Math.min(100, budgetImpactPct);
  let riskScore = Math.round(cappedImpact * 0.5 + impulseProbability * 0.5);
  if (willGoNegative) riskScore = Math.max(90, riskScore);
  if (totalBalance > 0 && amount > totalBalance * 0.30) riskScore = Math.max(riskScore, Math.round(riskScore * 1.25));
  riskScore = Math.min(99, riskScore);

  // ── 5. Recommendation ─────────────────────────────────────────────────────
  const recommendation: PredictResult["result"]["recommendation"] =
    willGoNegative || riskScore >= 70 ? "RECONSIDER" :
    riskScore >= 40                   ? "REVIEW"     : "PROCEED";

  // ── 6. Pressure ───────────────────────────────────────────────────────────
  const pressure: "LOW" | "MEDIUM" | "CRITICAL" =
    willGoNegative || budgetImpactPct > 70 ? "CRITICAL" :
    budgetImpactPct > 30                   ? "MEDIUM"   : "LOW";

  // ── 7. Classification ─────────────────────────────────────────────────────
  const classification: DecisionClass =
    willGoNegative || budgetImpactPct > 70 ? "financially_heavy" :
    impulseProbability > 60                ? "impulsive"         :
    riskScore >= 40                        ? "risky"             : "reasonable";

  // ── 8. Explanation narrative ──────────────────────────────────────────────
  const classNarrative: Record<DecisionClass, string> = {
    reasonable:        `${input.itemName} fits comfortably within your balance and matches how you normally shop.`,
    risky:             `${input.itemName} is borderline — it's pushing past your usual habits, so it's worth pausing.`,
    impulsive:         `${input.itemName} has the signs of an emotional buy — timing and pace suggest this may not be planned.`,
    financially_heavy: willGoNegative
      ? `${input.itemName} would push your balance negative (RM ${Math.abs(remainingAfterPurchase).toFixed(2)} short). This purchase is not affordable right now.`
      : `${input.itemName} would take a heavy bite out of your remaining balance this month.`,
  };
  const tail =
    recommendation === "PROCEED"  ? " You're in good shape to go ahead."                                              :
    recommendation === "REVIEW"   ? " Consider waiting a day or splitting the cost before deciding."                  :
    willGoNegative                ? " You do not have enough balance to cover this purchase."                         :
                                    " It's wiser to hold off, save it to your wishlist, or look for a better moment.";

  return {
    itemName: input.itemName, amount, classification,
    result:        { recommendation, riskScore, explanation: classNarrative[classification] + tail },
    spending:      { categoryBaseline, feel, summary: spendingSummary },
    affordability: { budgetImpactPct, budgetDiscPct, remainingAfterPurchase, willGoNegative, pressure },
    behavioral:    {
      impulseProbability, lateNightActive: input.isImpulseSignal,
      frequencyNote: input.isImpulseSignal
        ? "Activity outside your usual hours — emotional buying signal detected."
        : "Timing and pace look consistent with your normal habits.",
    },
  };
}

function feelToLabel(feel: PatternLabel | string): string {
  switch (feel) {
    case "lower_than_usual":      return "Below your usual";
    case "normal":                return "In line with your usual";
    case "higher_than_usual":     return "A bit higher than usual";
    case "much_higher_than_usual":return "Much higher than usual";
    case "in-line":               return "In line with your usual";
    case "a-bit-higher":          return "A bit higher than usual";
    case "much-higher":           return "Much higher than usual";
    case "low_confidence":        return "Building your pattern";
    case "no_data":               return "No history yet";
    default:                      return "Not enough history";
  }
}

function feelToPill(feel: PatternLabel | string): string {
  switch (feel) {
    case "lower_than_usual":      return "Below average";
    case "normal":                return "Feels normal";
    case "higher_than_usual":     return "Slightly unusual";
    case "much_higher_than_usual":return "Stands out";
    case "in-line":               return "Feels normal";
    case "a-bit-higher":          return "Slightly unusual";
    case "much-higher":           return "Stands out";
    case "low_confidence":        return "First entries";
    case "no_data":               return "No baseline";
    default:                      return "No baseline";
  }
}

function feelToTone(feel: PatternLabel | string): "emerald" | "amber" | "rose" | "slate" {
  switch (feel) {
    case "lower_than_usual":
    case "normal":
    case "in-line":               return "emerald";
    case "higher_than_usual":
    case "a-bit-higher":          return "amber";
    case "much_higher_than_usual":
    case "much-higher":           return "rose";
    default:                      return "slate";
  }
}

function buildBreakdown(r: PredictResult): HistoryEntry["breakdown"] {
  const pressureMap = { LOW: "LOW", MEDIUM: "MEDIUM", CRITICAL: "HIGH" } as const;
  const feel = r.spending.feel;
  const patternSummary =
    feel === "no_data"                ? "No spending history for this category yet."           :
    feel === "low_confidence"         ? "Only one past entry — still building your pattern."  :
    feel === "insufficient_data"      ? "Not enough history to compare against your baseline." :
    feel === "lower_than_usual"       ? "Below your usual spending in this category."          :
    feel === "normal"                 ? "Matches your usual habits."                           :
    feel === "higher_than_usual"      ? "Slightly above your normal range."                    :
                                        "Stands out from your typical pattern.";
  const consistency =
    feel === "no_data"                ? "No baseline available"                :
    feel === "low_confidence"         ? "Building baseline"                    :
    feel === "insufficient_data"      ? "No baseline available"                :
    feel === "lower_than_usual"       ? "Below average"                        :
    feel === "normal"                 ? "Consistent with category history"     :
    feel === "higher_than_usual"      ? "Mildly inconsistent"                  :
                                        "Notably inconsistent";
  const signals: string[] = [];
  if (r.behavioral.lateNightActive) signals.push("Late-night activity");
  if (r.behavioral.impulseProbability >= 65) signals.push("Strong urgency cues");
  else if (r.behavioral.impulseProbability >= 40) signals.push("Mild urgency cues");
  if (signals.length === 0) signals.push("No emotional buying signals");
  const impulseSummary =
    r.behavioral.impulseProbability < 40 ? "Behavior looks calm and planned."              :
    r.behavioral.impulseProbability < 65 ? "Some signs this could be spur-of-the-moment." :
                                           "Strong signs of emotional or rushed purchase.";
  return {
    budget: {
      impactPct: Math.round(r.affordability.budgetImpactPct),
      remaining: r.affordability.remainingAfterPurchase,
      pressure:  pressureMap[r.affordability.pressure],
      summary:
        r.affordability.pressure === "LOW"    ? "Comfortably fits within this month's budget." :
        r.affordability.pressure === "MEDIUM" ? "Tight — manageable but worth tracking."       :
                                                "Heavy load — could squeeze essentials.",
    },
    pattern: { feel, categoryBaseline: r.spending.categoryBaseline, consistency, summary: patternSummary },
    impulse: { probability: r.behavioral.impulseProbability, lateNight: r.behavioral.lateNightActive, signals, summary: impulseSummary },
  };
}

// ── Main component ──────────────────────────────────────────────────────────

interface PredictiveLayerPageProps {
  onNavigateToTracker?: () => void;
  onNavigateToWishlist?: () => void;
  prefillItem?: { itemName: string; category: string; amount: number };
}

type IntentType = "ASK_DISCOUNT" | "SAVE_TO_WISHLIST" | "CANCEL_PURCHASE" | "PROCEED_ANYWAY";
type InterceptState = { loading: IntentType | null; message: string | null; intent: IntentType | null };

export default function PredictiveLayerPage({ onNavigateToTracker, onNavigateToWishlist, prefillItem }: PredictiveLayerPageProps) {
  const [formData, setFormData] = useState({
    amount:          prefillItem ? String(prefillItem.amount) : "",
    itemName:        prefillItem?.itemName  ?? "",
    category:        prefillItem?.category  ?? "",
    isImpulseSignal: false,
  });
  const [isLoading,        setIsLoading]        = useState(false);
  const [historyLoading,   setHistoryLoading]   = useState(true);
  const [predictResult,    setPredictResult]    = useState<PredictResult | null>(null);
  const [activeTab,        setActiveTab]        = useState<"assess" | "explain">("assess");
  const [history,          setHistory]          = useState<HistoryEntry[]>([]);
  const [expandedHistory,  setExpandedHistory]  = useState<string | null>(null);
  const [totalBalance,     setTotalBalance]     = useState<number>(0);
  const [discretionaryBudget, setDiscretionaryBudget] = useState<number>(0);
  const [intercept,        setIntercept]        = useState<InterceptState>({ loading: null, message: null, intent: null });

  // Fetch live balance from tracker data (same source as Tracker page)
  useEffect(() => {
    const FIXED = new Set(["Bills & Utilities", "Transportation", "Savings", "Investments"]);
    Promise.all([
      fetch("/api/tracker/incomes").then(r => r.json()),
      fetch("/api/tracker/expenses").then(r => r.json()),
    ])
      .then(([incData, expData]) => {
        const incomes:  { amount: number }[] = incData.data  ?? [];
        const expenses: { amount: number; category: string }[] = expData.data ?? [];
        const totalIncome   = incomes.reduce((s, i) => s + i.amount, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const fixedExpenses = expenses
          .filter(e => FIXED.has(e.category))
          .reduce((s, e) => s + e.amount, 0);
        setTotalBalance(totalIncome - totalExpenses);
        setDiscretionaryBudget(Math.max(0, totalIncome - fixedExpenses));
      })
      .catch(e => console.error("Failed to fetch balance for predictor:", e));
  }, []);

  // ── Load history from API ────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/predict-history");
      if (!res.ok) {
        console.error("Failed to load predict history: HTTP", res.status);
        return;
      }
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load predict history:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Delete history entry ──────────────────────────────────────────────────
  const handleDeleteHistory = async (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    await fetch(`/api/predict-history/${id}`, { method: "DELETE" });
  };

  // ── Smart Spend Intercept — all actions route through chatbot intent API ──
  const handleIntercept = async (intent: IntentType) => {
    if (!predictResult) return;
    setIntercept({ loading: intent, message: null, intent: null });
    try {
      const res = await fetch("/api/chatbot/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          context: {
            itemName:    predictResult.itemName,
            amount:      predictResult.amount,
            category:    formData.category,
            riskScore:   predictResult.result.riskScore,
            explanation: predictResult.result.explanation,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIntercept({ loading: null, message: data.data.message, intent });
        if (intent === "SAVE_TO_WISHLIST") onNavigateToWishlist?.();
      } else {
        setIntercept({ loading: null, message: "Something went wrong. Please try again.", intent });
      }
    } catch {
      setIntercept({ loading: null, message: "Could not reach the server. Please try again.", intent });
    }
  };

  const isFormValid =
    formData.itemName.trim().length > 0 &&
    formData.category.trim().length > 0 &&
    !!formData.amount && parseFloat(formData.amount) > 0;

  // ── Run evaluation, save to API ──────────────────────────────────────────
  const handleEvaluate = async (e?: { preventDefault(): void }) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);

    // Fetch real category baseline from backend before scoring
    let patternData: SpendingPatternResult | undefined;
    try {
      const pr = await fetch("/api/finance/pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formData.category, amount: parseFloat(formData.amount) }),
      });
      if (pr.ok) {
        const pd = await pr.json();
        if (pd.success && pd.data) patternData = pd.data as SpendingPatternResult;
      }
    } catch { /* cold-start: patternData stays undefined, feel → insufficient_data */ }

    await new Promise(r => setTimeout(r, 500));
    const result = runPredict({ ...formData, totalBalance, discretionaryBudget, patternData });
    setPredictResult(result);
    setActiveTab("explain");

    // Save to backend
    const entry = {
      itemName:       result.itemName,
      category:       formData.category,
      amount:         result.amount,
      recommendation: result.result.recommendation,
      riskScore:      result.result.riskScore,
      explanation:    result.result.explanation,
      breakdown:      buildBreakdown(result),
    };
    const res = await fetch("/api/predict-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.success) setHistory(prev => [data.entry, ...prev].slice(0, 20));
    setIsLoading(false);
  };

  const getRecommendationBadge = (rec: "PROCEED" | "REVIEW" | "RECONSIDER") => {
    switch (rec) {
      case "PROCEED":    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />, label: "Proceed Safely",   msg: "Approved: Safe under your active budget constraints.",             colorText: "text-emerald-700" };
      case "REVIEW":     return { bg: "bg-amber-50 text-amber-700 border-amber-200",       icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,  label: "Review Carefully", msg: "Caution: Approaching budget limits or baseline deviation.",        colorText: "text-amber-700" };
      case "RECONSIDER": return { bg: "bg-rose-50 text-rose-700 border-rose-200",          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,         label: "Reconsider",       msg: "Warning: High risk! Over budget and abnormal purchase pattern.", colorText: "text-rose-700" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Tracker entry button */}
        <button onClick={onNavigateToTracker} className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl px-5 py-4 shadow-sm transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><LineChart className="w-5 h-5 text-amber-300" /></div>
            <div className="text-left">
              <p className="text-sm font-bold">Open Expense & Income Tracker</p>
              <p className="text-[11px] text-slate-300">Record income & expenses to power the Predictive Intelligence Layer</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Predictive Layer */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 rounded-xl"><Sparkles className="w-5 h-5 text-red-600" /></div>
              <div>
                <h2 className="font-bold text-lg tracking-tight text-slate-900">📌 Predictive Intelligence Layer</h2>
                <p className="text-xs text-slate-500">Pre-purchase evaluation of behavioral fit & discretionary metrics.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Wishlist shortcut — always visible in header */}
              <button
                onClick={onNavigateToWishlist}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                <History className="w-3.5 h-3.5" />
                Vault
              </button>
              {predictResult && (
                <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                  <button onClick={() => setActiveTab("assess")}  className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${activeTab === "assess"  ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Assess</button>
                  <button onClick={() => setActiveTab("explain")} className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${activeTab === "explain" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>AI Decision</button>
                </div>
              )}
            </div>
          </div>

          {activeTab === "assess" || !predictResult ? (
            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Live balance context */}
              {totalBalance > 0 && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs mb-1">
                  <span className="text-slate-500 font-medium">Your current balance</span>
                  <div className="flex gap-4">
                    <span className="font-mono font-bold text-slate-900">RM {totalBalance.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
                    {discretionaryBudget > 0 && (
                      <span className="text-slate-400 font-mono">Discretionary: RM {discretionaryBudget.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Item/Service Name</label>
                  <input type="text" value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g. Sony WH-1000XM5"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-600 focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-600 focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm font-medium cursor-pointer">
                    <option value="" disabled>Select a category…</option>
                    <optgroup label="Essential Spending">
                      <option>Groceries & Needs</option>
                      <option>Bills & Utilities</option>
                      <option>Transportation</option>
                      <option>Healthcare</option>
                    </optgroup>
                    <optgroup label="Lifestyle Spending">
                      <option>Dining & Cafes</option>
                      <option>Shopping & Gadgets</option>
                      <option>Entertainment</option>
                      <option>Travel & Luxury</option>
                    </optgroup>
                    <optgroup label="Financial / Religious">
                      <option>Savings & Investments</option>
                      <option>Islamic Finance & Zakat</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Estimated Amount (RM)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">RM</span>
                    <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-600 focus:bg-white outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900" required />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 mt-1 md:mt-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Late-night or Quick Purchase?</span>
                    <span className="text-[10px] text-slate-400">Simulate rapid emotional buying spike</span>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, isImpulseSignal: !formData.isImpulseSignal })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${formData.isImpulseSignal ? "bg-red-600" : "bg-slate-300"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${formData.isImpulseSignal ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={isLoading || !isFormValid}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running AI Decision Pipeline…</> : <><Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />Analyze Decision Integrity</>}
                </button>
                {!isFormValid && !isLoading && (
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Info className="w-3 h-3" /> Enter purchase details to begin AI behavioral analysis.
                  </p>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {predictResult && (() => {
                const badge = getRecommendationBadge(predictResult.result.recommendation);
                return (
                  <>
                    <div className={`p-4 rounded-2xl border ${badge.bg}`}>
                      <div className="flex items-start gap-3">
                        {badge.icon}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base tracking-tight text-slate-900">AI Verdict: {badge.label}</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${predictResult.result.recommendation === "PROCEED" ? "bg-emerald-100 text-emerald-800" : predictResult.result.recommendation === "REVIEW" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                              Risk Score: {predictResult.result.riskScore}%
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{badge.msg}</p>
                          <div className="mt-3 bg-white/70 p-3.5 rounded-xl border border-slate-100/50">
                            <p className="text-xs font-semibold text-slate-900">🧠 AI CFO Explanation:</p>
                            <p className="text-xs text-slate-700 leading-relaxed italic mt-1">"{predictResult.result.explanation}"</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Diag label="Spending Pattern"
                        main={feelToLabel(predictResult.spending.feel)}
                        pill={feelToPill(predictResult.spending.feel)}
                        pillTone={feelToTone(predictResult.spending.feel)}
                        sub={predictResult.spending.summary} />
                      <Diag label="Budget Impact"
                        main={
                          predictResult.affordability.willGoNegative
                            ? `⚠️ Exceeds balance by ${Math.round(predictResult.affordability.budgetImpactPct - 100)}%`
                            : `Uses ${Math.round(predictResult.affordability.budgetImpactPct)}% of your balance`
                        }
                        pill={predictResult.affordability.pressure === "LOW" ? "Comfortable" : predictResult.affordability.pressure === "MEDIUM" ? "Tight" : "Heavy load"}
                        pillTone={predictResult.affordability.pressure === "LOW" ? "emerald" : predictResult.affordability.pressure === "MEDIUM" ? "amber" : "rose"}
                        sub={
                          predictResult.affordability.willGoNegative
                            ? `⚠️ RM ${Math.abs(predictResult.affordability.remainingAfterPurchase).toFixed(2)} short — balance goes negative!`
                            : `RM ${predictResult.affordability.remainingAfterPurchase.toFixed(2)} would remain in your account.`
                        } />
                      <Diag label="Impulse Risk"
                        main={predictResult.behavioral.impulseProbability < 40 ? "Looks like a planned purchase" : predictResult.behavioral.impulseProbability < 65 ? "Some impulse signs" : "Strong impulse signs"}
                        pill={predictResult.behavioral.lateNightActive ? "Late-night activity" : "Regular hours"}
                        pillTone={predictResult.behavioral.lateNightActive ? "amber" : "slate"}
                        sub={predictResult.behavioral.frequencyNote} />
                    </div>

                    {predictResult.result.recommendation !== "PROCEED" && (
                      <div className="bg-slate-900 text-white rounded-2xl p-4 mt-4 border border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Smart Spend Intercept Active</h4>
                            <p className="text-[11px] text-slate-300">Think twice before committing your savings below.</p>
                          </div>
                        </div>

                        {/* AI response message */}
                        {intercept.message && (
                          <div className={`mb-3 p-3 rounded-xl border text-xs leading-relaxed ${
                            intercept.intent === "ASK_DISCOUNT"     ? "bg-indigo-950 border-indigo-700 text-indigo-100" :
                            intercept.intent === "SAVE_TO_WISHLIST" ? "bg-amber-950 border-amber-700 text-amber-100"   :
                            intercept.intent === "CANCEL_PURCHASE"  ? "bg-emerald-950 border-emerald-700 text-emerald-100" :
                                                                       "bg-slate-800 border-slate-600 text-slate-200"
                          }`}>
                            <p className="font-bold mb-1 text-[10px] uppercase tracking-wider opacity-70">
                              {intercept.intent === "ASK_DISCOUNT"     ? "🧠 AI Discount Advisor" :
                               intercept.intent === "SAVE_TO_WISHLIST" ? "🔒 Vault Confirmed"     :
                               intercept.intent === "CANCEL_PURCHASE"  ? "✅ Decision Logged"     :
                                                                         "📝 Noted"}
                            </p>
                            <p className="italic">{intercept.message}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-stretch justify-end gap-2.5 pt-2 border-t border-slate-800">
                          <InterceptBtn
                            label="🗣️ Ask AI: Is there a discount?"
                            className="bg-white/10 hover:bg-white/20 text-white"
                            loading={intercept.loading === "ASK_DISCOUNT"}
                            onClick={() => handleIntercept("ASK_DISCOUNT")}
                          />
                          <InterceptBtn
                            label="🔒 Delay & Lock to Wishlist Vault"
                            className="bg-amber-400/25 text-amber-400 border border-amber-400/45 hover:bg-amber-400/35"
                            loading={intercept.loading === "SAVE_TO_WISHLIST"}
                            onClick={() => handleIntercept("SAVE_TO_WISHLIST")}
                          />
                          <InterceptBtn
                            label="🤝 Cancel Purchase (Wise Decision)"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
                            loading={intercept.loading === "CANCEL_PURCHASE"}
                            onClick={() => handleIntercept("CANCEL_PURCHASE")}
                          />
                          <button
                            onClick={() => handleIntercept("PROCEED_ANYWAY")}
                            disabled={intercept.loading !== null}
                            className="text-slate-400 hover:text-white disabled:opacity-40 px-2 py-2 text-[10px] underline cursor-pointer"
                          >
                            {intercept.loading === "PROCEED_ANYWAY" ? "Logging…" : "Proceed to buy anyway"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              <button onClick={() => { setPredictResult(null); setActiveTab("assess"); setFormData({ amount: "", itemName: "", category: "", isImpulseSignal: false }); }}
                className="text-xs font-semibold text-red-600 hover:underline cursor-pointer py-1 block text-center mx-auto">
                ← Test Another Purchase
              </button>
            </div>
          )}
        </div>

        {/* Recent AI Purchase Decisions — from database */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-xl"><History className="w-5 h-5 text-slate-700" /></div>
              <div>
                <h2 className="font-bold text-lg tracking-tight text-slate-900">Recent AI Purchase Decisions</h2>
                <p className="text-xs text-slate-500">Every evaluation you run is saved here automatically.</p>
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading your history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No purchase analyses yet</p>
              <p className="text-xs">Run an analysis above — it will be saved here automatically.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map(h => {
                const tone =
                  h.recommendation === "PROCEED"    ? { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", risk: "text-emerald-700" }
                  : h.recommendation === "REVIEW"   ? { dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200",       risk: "text-amber-700" }
                  :                                   { dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200",           risk: "text-rose-700" };
                const isOpen = expandedHistory === h.id;
                return (
                  <div key={h.id} className="border border-slate-100 rounded-2xl bg-slate-50/40 hover:bg-slate-50 transition-colors">
                    <div className="p-3.5 flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${tone.dot} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 truncate">{h.itemName}</p>
                          <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{h.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">RM {h.amount.toFixed(2)} · {formatTime(h.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tone.chip}`}>{h.recommendation}</span>
                        <span className={`text-xs font-mono font-bold ${tone.risk} w-10 text-right`}>{h.riskScore}%</span>
                        <button onClick={() => setExpandedHistory(isOpen ? null : h.id)} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-1">
                          {isOpen ? "Hide" : "View Analysis"}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        <button onClick={() => handleDeleteHistory(h.id)} className="text-slate-400 hover:text-rose-500 transition p-1 rounded-lg hover:bg-rose-50" title="Remove from history">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {isOpen && h.breakdown && (
                      <div className="px-3.5 pb-3.5 -mt-1 space-y-2.5">
                        <BreakdownCard icon="💰" title="Budget Impact" pill={h.breakdown.budget.pressure} pillTone={h.breakdown.budget.pressure === "LOW" ? "emerald" : h.breakdown.budget.pressure === "MEDIUM" ? "amber" : "rose"}>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Stat label="Used of monthly budget"    value={`${h.breakdown.budget.impactPct}%`} />
                            <Stat label="Remaining after purchase"  value={`RM ${h.breakdown.budget.remaining.toFixed(2)}`} />
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${h.breakdown.budget.pressure === "LOW" ? "bg-emerald-500" : h.breakdown.budget.pressure === "MEDIUM" ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, h.breakdown.budget.impactPct)}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-600 mt-2">{h.breakdown.budget.summary}</p>
                        </BreakdownCard>

                        <BreakdownCard icon="📊" title="Spending Pattern"
                          pill={feelToPill(h.breakdown.pattern.feel)}
                          pillTone={feelToTone(h.breakdown.pattern.feel)}>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Stat label="Your usual for this category" value={h.breakdown.pattern.categoryBaseline != null ? `RM ${h.breakdown.pattern.categoryBaseline.toFixed(2)}` : "No baseline"} />
                            <Stat label="This purchase"                value={`RM ${h.amount.toFixed(2)}`} />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-700">{h.breakdown.pattern.consistency}</p>
                          <p className="text-[11px] text-slate-600 mt-1">{h.breakdown.pattern.summary}</p>
                        </BreakdownCard>

                        <BreakdownCard icon="⚡" title="Impulse Risk"
                          pill={h.breakdown.impulse.probability < 40 ? "Planned" : h.breakdown.impulse.probability < 65 ? "Some impulse" : "Strong impulse"}
                          pillTone={h.breakdown.impulse.probability < 40 ? "emerald" : h.breakdown.impulse.probability < 65 ? "amber" : "rose"}>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Stat label="Impulse probability"  value={`${h.breakdown.impulse.probability}%`} />
                            <Stat label="Time-of-day signal"   value={h.breakdown.impulse.lateNight ? "Late-night" : "Regular hours"} />
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {h.breakdown.impulse.signals.map(s => <span key={s} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{s}</span>)}
                          </div>
                          <p className="text-[11px] text-slate-600">{h.breakdown.impulse.summary}</p>
                        </BreakdownCard>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3.5 border border-slate-800">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">AI CFO Explanation</p>
                          </div>
                          <p className="text-xs text-slate-100 italic leading-relaxed">"{h.explanation}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Diag({ label, main, pill, pillTone, sub }: { label: string; main: string; pill: string; pillTone: "emerald" | "amber" | "rose" | "slate"; sub: string }) {
  const tones = { emerald: "bg-emerald-100 text-emerald-800", amber: "bg-amber-100 text-amber-800", rose: "bg-rose-100 text-rose-800", slate: "bg-slate-200 text-slate-800" };
  return (
    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{label}</span>
      <div className="flex justify-between items-baseline mt-1.5">
        <span className="text-sm font-semibold text-slate-800 capitalize">{main}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tones[pillTone]}`}>{pill}</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function BreakdownCard({ icon, title, pill, pillTone, children }: { icon: string; title: string; pill: string; pillTone: "emerald" | "amber" | "rose" | "slate"; children: React.ReactNode }) {
  const tones = { emerald: "bg-emerald-100 text-emerald-800 border-emerald-200", amber: "bg-amber-100 text-amber-800 border-amber-200", rose: "bg-rose-100 text-rose-800 border-rose-200", slate: "bg-slate-200 text-slate-800 border-slate-300" };
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5"><span>{icon}</span> {title}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tones[pillTone]}`}>{pill}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function InterceptBtn({ label, className, loading, onClick }: {
  label: string; className: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${className}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {label}
    </button>
  );
}