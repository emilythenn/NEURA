import React, { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, ShieldAlert} from "lucide-react";
import { AccountsState } from "../types";

// Shape returned by POST /api/predict-purchase
interface BackendPredictResult {
  predictionId: string;
  itemName: string;
  category: string;
  amount: number;
  riskScore: number;
  verdict: "PROCEED" | "REVIEW" | "RECONSIDER";
  pressureLevel: "LOW" | "MEDIUM" | "CRITICAL";
  classification: string;
  impulseProbability: number;
  budgetImpactPercent: number;
  budgetDiscPercent: number;
  remainingAfterPurchase: number;
  willGoNegative: boolean;
  lateNightActive: boolean;
  explanation: string;
  scoreBreakdown: Record<string, number>;
}

interface PredictiveLayerProps {
  accountsState: AccountsState;
  onAskAICompanion: (itemName: string, amount: number | string) => void;
  onSelectAction: (actionType: "PROCEED" | "CANCEL" | "VAULT", amount: number, itemName: string) => void;
}
export default function PredictiveLayer({ accountsState, onAskAICompanion, onSelectAction }: PredictiveLayerProps) {
  const [formData, setFormData] = useState({
    amount: "250",
    itemName: "Sony WH-1000XM5",
    category: "Gadgets & Wants",
    isImpulseSignal: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [predictResult, setPredictResult] = useState<BackendPredictResult | null>(null);
  const [activeTab, setActiveTab] = useState<"assess" | "explain">("assess");

  // Run evaluation via API
  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/predict-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:              parseFloat(formData.amount),
          itemName:            formData.itemName,
          category:            formData.category,
          impulseSignal:       formData.isImpulseSignal,
          currentBalance:      accountsState.totalBalance,
          discretionaryBudget: accountsState.discretionaryBudget,
        })
      });
      const data = await response.json();
      // Backend wraps success responses in { success, data }
      setPredictResult(data.data ?? data);
      setActiveTab("explain");
    } catch (err) {
      console.error("Failed to predict purchase context: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationBadge = (verdict: "PROCEED" | "REVIEW" | "RECONSIDER") => {
    switch (verdict) {
      case "PROCEED":    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />, label: "Proceed Safely",    verdictLabel: "Proceed",              msg: "Approved: Safe under your active budget constraints." };
      case "REVIEW":     return { bg: "bg-amber-50 text-amber-700 border-amber-200",       icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />, label: "Review Carefully",  verdictLabel: "Review Recommended",   msg: "Caution: Approaching budget limits or baseline deviation." };
      case "RECONSIDER": return { bg: "bg-rose-50 text-rose-700 border-rose-200",          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,        label: "Reconsider",        verdictLabel: "Strict Reconsideration", msg: "Warning: High risk! Over budget and abnormal purchase pattern." };
    }
  };

  return (
    <div id="predictive-intelligence-section" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      {/* Module Title */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-bimb-peach rounded-xl">
            <Sparkles className="w-5 h-5 text-bimb-red" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg tracking-tight text-slate-900">
              {accountsState.elderlyMode ? "Smart Buying Guide" : "📌 Predictive Intelligence Layer"}
            </h2>
            <p className="text-xs text-slate-500">
              {accountsState.elderlyMode ? "Let our friendly AI check if this purchase fits your balance." : "Pre-purchase evaluation of behavioral fit & discretionary metrics."}
            </p>
          </div>
        </div>
        
        {predictResult && (
          <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab("assess")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${activeTab === "assess" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              Assess
            </button>
            <button
              onClick={() => setActiveTab("explain")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${activeTab === "explain" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              AI Decision
            </button>
          </div>
        )}
      </div>

      {activeTab === "assess" || !predictResult ? (
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Item/Service Name</label>
              <input
                id="item-name-input"
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g. Sony WH-1000XM5"
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
              <select
                id="category-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white outline-none rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer"
              >
                <option value="Gadgets & Wants">Gadgets & Wants</option>
                <option value="Dining & Cafes">Dining & Cafes</option>
                <option value="Groceries & Needs">Groceries & Needs</option>
                <option value="Luxury & Travel">Luxury & Travel</option>
                <option value="Islamic Finance & Zakat">Islamic Finance & Zakat</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Estimated Amount (RM)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">RM</span>
                <input
                  id="amount-input"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900 transition-all"
                  required
                />
              </div>
            </div>

            {/* Impulse signals */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 mt-1 md:mt-5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">Late-night or Quick Purchase?</span>
                <span className="text-[10px] text-slate-400">Simulate rapid emotional buying spike</span>
              </div>
              <button
                type="button"
                id="impulse-signal-toggle"
                onClick={() => setFormData({ ...formData, isImpulseSignal: !formData.isImpulseSignal })}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                  formData.isImpulseSignal ? "bg-bimb-red" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                    formData.isImpulseSignal ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="evaluate-btn"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>Running AI Decision Pipeline...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-bimb-gold fill-bimb-gold" />
                Analyze Decision Integrity
              </>
            )}
          </button>
        </form>
      ) : (
        /* AI RECOMMENDATION HUD SCREEN */
        <div id="ai-recommendation-hud" className="space-y-5 animate-fade-in">
          {/* Main Verdict Card */}
          {predictResult && (
            <>
              {(() => {
                const badge = getRecommendationBadge(predictResult.verdict);
                // Compute baseline values from the scoring result
                const typicalSpend = 180;
                const zScore = (predictResult.amount - typicalSpend) / 90;
                const isNormal = Math.abs(zScore) < 1.5;
                return (
                  <div className={`p-4 rounded-2xl border ${badge.bg}`}>
                    <div className="flex items-start gap-3">
                      {badge.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-base tracking-tight text-slate-900">
                            AI Verdict: {badge.verdictLabel}
                          </span>
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                            predictResult.verdict === "PROCEED" ? "bg-emerald-100 text-emerald-800" :
                            predictResult.verdict === "REVIEW"  ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            Risk Score: {predictResult.riskScore}%
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{badge.label} • {badge.msg}</p>

                        <div className="mt-3 bg-white/70 backdrop-blur-xs p-3.5 rounded-xl border border-slate-100/50">
                          <p className="text-xs font-semibold text-slate-900">🧠 AI CFO Explanation:</p>
                          <p className="text-xs text-slate-700 leading-relaxed italic mt-1">"{predictResult.explanation}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Advanced Pipeline Diagnostics (The 4 channels) */}
              {(() => {
                const typicalSpend = 180;
                const zScore = (predictResult.amount - typicalSpend) / 90;
                const isNormal = Math.abs(zScore) < 1.5;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Spending Baseline Engine */}
                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">1. Behavioral Baseline</span>
                      <div className="flex justify-between items-baseline mt-1.5">
                        <span className="text-sm font-display font-semibold text-slate-800">
                          Baseline: RM {typicalSpend}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isNormal ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {isNormal ? "Normal Fit" : "Abnormal Shift"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Deviation Z-Score is {zScore.toFixed(2)} std dev from monthly normal.</p>
                    </div>

                    {/* 2. Decision Logic Classification */}
                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">2. Core Classification</span>
                      <div className="flex justify-between items-baseline mt-1.5">
                        <span className="text-sm font-display font-semibold text-slate-800 capitalize">
                          {predictResult.classification.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">Class Label</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Profiled as {predictResult.classification === "reasonable" ? "rational shopping profile." : "statistically high-risk emotional commitment."}</p>
                    </div>

                    {/* 3. Budget constraint checking */}
                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">3. Budget Pressure</span>
                      <div className="flex justify-between items-baseline mt-1.5">
                        <span className="text-sm font-display font-semibold text-slate-800">
                          Impact: {Math.round(predictResult.budgetImpactPercent)}%
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          predictResult.pressureLevel === "CRITICAL" ? "bg-rose-100 text-rose-800" :
                          predictResult.pressureLevel === "MEDIUM"   ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {predictResult.pressureLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {predictResult.willGoNegative
                          ? `⚠️ RM ${Math.abs(predictResult.remainingAfterPurchase).toFixed(2)} short — balance goes negative!`
                          : `RM ${predictResult.remainingAfterPurchase.toFixed(2)} remaining after purchase.`}
                      </p>
                    </div>

                    {/* 4. Impulse Probability Meter */}
                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">4. Impulse Likelihood</span>
                      <div className="flex justify-between items-baseline mt-1.5">
                        <span className="text-sm font-display font-semibold text-slate-800">
                          Score: {predictResult.impulseProbability}%
                        </span>
                        <span className="text-[10px] text-slate-400">Time: {predictResult.lateNightActive ? "Late night" : "Normal hour"}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Probability spike modeled by timing, browsing, and frequency velocity.</p>
                    </div>
                  </div>
                );
              })()}

              {/* ACTION CALLOUT POPUP / BAR */}
              {predictResult.verdict !== "PROCEED" && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 mt-4 border border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-5 h-5 text-bimb-gold shrink-0 animate-bounce" />
                    <div>
                      <h4 className="text-xs font-bold text-bimb-gold uppercase tracking-wider">Smart Spend Intercept Active</h4>
                      <p className="text-[11px] text-slate-300">Think twice before committing your savings below. Delaying is Sunnah.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch justify-end gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onAskAICompanion(predictResult.itemName, predictResult.amount)}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🗣️ Ask AI: Is there a discount?
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAction("VAULT", predictResult.amount, predictResult.itemName)}
                      className="bg-bimb-gold/25 text-bimb-gold border border-bimb-gold/45 hover:bg-bimb-gold/35 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🔒 Delay & Lock to Wishlist Vault
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAction("CANCEL", predictResult.amount, predictResult.itemName)}
                      className="bg-bimb-red hover:bg-bimb-darkred text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                    >
                      🤝 Cancel Purchase (Wise Decision)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAction("PROCEED", predictResult.amount, predictResult.itemName)}
                      className="text-slate-400 hover:text-white px-2 py-2 text-[10px] underline cursor-pointer transition-colors"
                    >
                      Proceed to buy anyway
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recalibrate button */}
          <button
            onClick={() => {
              setPredictResult(null);
              setActiveTab("assess");
            }}
            className="text-xs font-semibold text-bimb-red hover:underline cursor-pointer py-1 block text-center"
          >
            ← Test Another Purchase
          </button>
        </div>
      )}
    </div>
  );
}