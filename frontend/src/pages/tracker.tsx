import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Sparkles,
  Utensils, Car, Receipt, ShoppingBag, Film, Landmark, LineChart, Brain,
  Activity, Trash2, Calendar, ArrowUpRight, ArrowDownRight, X, Target, Loader2,
} from "lucide-react";

type Category =
  | "Food & Dining" | "Transportation" | "Bills & Utilities"
  | "Shopping" | "Entertainment" | "Savings" | "Investments";

const CATEGORIES: { name: Category; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
  { name: "Food & Dining",    icon: Utensils,    tone: "text-orange-600 bg-orange-50 border-orange-100" },
  { name: "Transportation",   icon: Car,         tone: "text-sky-600 bg-sky-50 border-sky-100" },
  { name: "Bills & Utilities",icon: Receipt,     tone: "text-violet-600 bg-violet-50 border-violet-100" },
  { name: "Shopping",         icon: ShoppingBag, tone: "text-pink-600 bg-pink-50 border-pink-100" },
  { name: "Entertainment",    icon: Film,        tone: "text-amber-600 bg-amber-50 border-amber-100" },
  { name: "Savings",          icon: PiggyBank,   tone: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { name: "Investments",      icon: Landmark,    tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
];

const catMeta = (c: string) => CATEGORIES.find((x) => x.name === c) ?? CATEGORIES[0];

type Income  = { id: string; source: string; amount: number; date: string };
type Expense = { id: string; name: string; category: Category; amount: number; date: string };

const today = new Date().toISOString().slice(0, 10);
const fmt = (n: number) =>
  "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import { AccountsState } from "../types";

interface TrackerPageProps { onBack?: () => void; }

export default function TrackerPage({ onBack }: TrackerPageProps) {
  const [incomes,  setIncomes]  = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showIncome,  setShowIncome]  = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  // ── Load from API on mount ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [incRes, expRes] = await Promise.all([
        fetch("/api/tracker/incomes"),
        fetch("/api/tracker/expenses"),
      ]);
      const [incData, expData] = await Promise.all([incRes.json(), expRes.json()]);
      setIncomes(incData.data ?? []);
      setExpenses(expData.data ?? []);
    } catch (e) {
      console.error("Failed to load tracker data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── API helpers ───────────────────────────────────────────────────────────
  const addIncome = async (v: Omit<Income, "id">) => {
    try {
      const res = await fetch("/api/tracker/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, amount: Number(v.amount) }),
      });
      const data = await res.json();
      if (data.success) setIncomes(prev => [data.data.entry, ...prev]);
    } catch (e) {
      console.error("Failed to add income:", e);
    }
  };

  const addExpense = async (v: Omit<Expense, "id">) => {
    try {
      const res = await fetch("/api/tracker/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, amount: Number(v.amount) }),
      });
      const data = await res.json();
      if (data.success) setExpenses(prev => [data.data.entry, ...prev]);
    } catch (e) {
      console.error("Failed to add expense:", e);
    }
  };

  const deleteIncome = async (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/tracker/incomes/${id}`, { method: "DELETE" });
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/tracker/expenses/${id}`, { method: "DELETE" });
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalIncome  = useMemo(() => incomes.reduce((s, x) => s + x.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return CATEGORIES.map(c => ({ ...c, total: map.get(c.name) ?? 0 })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Real monthly trend from actual data (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        label: d.toLocaleString("en-MY", { month: "short" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    const totals = months.map(m => ({
      m: m.label,
      v: expenses
        .filter(e => e.date.startsWith(m.key))
        .reduce((s, e) => s + e.amount, 0),
    }));
    const max = Math.max(...totals.map(t => t.v), 1);
    return totals.map(t => ({ ...t, pct: (t.v / max) * 100 }));
  }, [expenses]);

  const health =
    savingsRate >= 30 ? { label: "Excellent", tone: "emerald", pct: Math.min(100, savingsRate * 2) } :
    savingsRate >= 15 ? { label: "Healthy",   tone: "sky",     pct: Math.min(100, savingsRate * 2) } :
    savingsRate >= 0  ? { label: "Tight",      tone: "amber",   pct: Math.max(15, savingsRate * 2) } :
                        { label: "At Risk",   tone: "rose",    pct: 10 };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm font-medium">Loading your financial data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Expense & Income Tracker</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI Insights Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Feeds the Predictive Intelligence Layer in real time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowIncome(true)} className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-3.5 h-3.5" /> Income
            </button>
            <button onClick={() => setShowExpense(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard label="Total Income"     value={fmt(totalIncome)}  icon={<TrendingUp className="w-4 h-4" />}   tone="emerald" sub={incomes.length === 0 ? "No income recorded yet" : `${incomes.length} entr${incomes.length === 1 ? "y" : "ies"}`} subIcon={<ArrowUpRight className="w-3 h-3" />} />
          <SummaryCard label="Total Expenses"   value={fmt(totalExpense)} icon={<TrendingDown className="w-4 h-4" />} tone="rose"    sub={expenses.length === 0 ? "No expenses recorded yet" : `${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}`} subIcon={<ArrowDownRight className="w-3 h-3" />} />
          <SummaryCard label="Remaining Balance" value={fmt(balance)}     icon={<Wallet className="w-4 h-4" />}       tone="sky"    sub="Available this cycle" />
          <SummaryCard label="Savings Rate"      value={totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : "—"} icon={<PiggyBank className="w-4 h-4" />} tone="indigo" sub="Target ≥ 20%" />
        </section>

        {/* AI Health + Trend */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Brain className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Budget Health</h3>
                  <p className="text-[11px] text-slate-500">Monthly Financial Stability</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${health.tone}-50 text-${health.tone}-700 border border-${health.tone}-100`}>{health.label}</span>
            </div>
            {totalIncome === 0 ? (
              <div className="mt-5 text-center py-4 text-slate-400 text-xs">
                <p>Add income and expenses to see your health score.</p>
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-black text-slate-900">{health.pct.toFixed(0)}<span className="text-base text-slate-400 font-bold">/100</span></span>
                  <span className="text-[11px] text-slate-500">Stability Index</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r from-${health.tone}-400 to-${health.tone}-600`} style={{ width: `${health.pct}%` }} />
                </div>
              </div>
            )}
            <ul className="mt-5 space-y-2 text-[11px]">
              <Insight icon={<Target className="w-3 h-3" />}   label="Affordability" value={totalIncome === 0 ? "—" : balance > 1500 ? "Strong" : "Moderate"} />
              <Insight icon={<Activity className="w-3 h-3" />} label="Impulse Risk"  value={byCategory.find(c => c.name === "Shopping")!.total > 400 ? "Elevated" : expenses.length === 0 ? "—" : "Low"} />
              <Insight icon={<LineChart className="w-3 h-3" />} label="Entries logged" value={`${incomes.length + expenses.length} total`} />
            </ul>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><LineChart className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monthly Spending Trend</h3>
                  <p className="text-[11px] text-slate-500">6-month rolling expense (your real data)</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">RM</span>
            </div>
            {totalExpense === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs text-center">
                <p>No expenses yet — chart will appear once you add your first entry.</p>
              </div>
            ) : (
              <div className="flex items-end gap-3 h-44">
                {monthlyTrend.map((t, i) => (
                  <div key={t.m} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-lg ${i === monthlyTrend.length - 1 ? "bg-gradient-to-t from-indigo-500 to-indigo-400" : "bg-slate-200"}`}
                        style={{ height: `${t.pct || 4}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{t.m}</span>
                    <span className="text-[10px] text-slate-400">{t.v > 0 ? Math.round(t.v) : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Category breakdown */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Category Breakdown</h3>
              <p className="text-[11px] text-slate-500">Where your money went this cycle</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{fmt(totalExpense)} total</span>
          </div>
          {totalExpense === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">Add expenses to see how your money is distributed.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {byCategory.filter(c => c.total > 0).map(c => {
                const Icon = c.icon;
                const pct = totalExpense > 0 ? (c.total / totalExpense) * 100 : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${c.tone}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate">{c.name}</span>
                        <span className="text-slate-900">{fmt(c.total)}</span>
                      </div>
                      <div className="h-1.5 mt-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{pct.toFixed(1)}% of spend</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Lists */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Income Tracker</h3>
                  <p className="text-[11px] text-slate-500">{incomes.length} entr{incomes.length === 1 ? "y" : "ies"} recorded</p>
                </div>
              </div>
              <button onClick={() => setShowIncome(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                <Plus className="w-3 h-3" /> Add Income
              </button>
            </div>
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {incomes.length === 0 ? (
                <li className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <TrendingUp className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold">No income recorded yet</p>
                  <p>Tap "Add Income" to get started.</p>
                </li>
              ) : incomes.map(i => (
                <li key={i.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/60 group">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center"><ArrowUpRight className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{i.source}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {i.date}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+{fmt(i.amount)}</span>
                  <button onClick={() => deleteIncome(i.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Expenses */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Expense Tracker</h3>
                  <p className="text-[11px] text-slate-500">{expenses.length} entr{expenses.length === 1 ? "y" : "ies"} recorded</p>
                </div>
              </div>
              <button onClick={() => setShowExpense(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="w-3 h-3" /> Add Expense
              </button>
            </div>
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {expenses.length === 0 ? (
                <li className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <TrendingDown className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold">No expenses recorded yet</p>
                  <p>Tap "Add Expense" to log your first entry.</p>
                </li>
              ) : expenses.map(e => {
                const meta = catMeta(e.category);
                const Icon = meta.icon;
                return (
                  <li key={e.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/60 group">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${meta.tone}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{e.category}</span><span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.date}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">−{fmt(e.amount)}</span>
                    <button onClick={() => deleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      {showIncome  && <IncomeModal  onClose={() => setShowIncome(false)}  onSave={async v => { await addIncome(v);  setShowIncome(false); }} />}
      {showExpense && <ExpenseModal onClose={() => setShowExpense(false)} onSave={async v => { await addExpense(v); setShowExpense(false); }} />}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, tone, sub, subIcon }: {
  label: string; value: string; icon: React.ReactNode;
  tone: "emerald" | "rose" | "sky" | "indigo"; sub: string; subIcon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500 to-emerald-600 text-emerald-50",
    rose:    "from-rose-500 to-rose-600 text-rose-50",
    sky:     "from-sky-500 to-sky-600 text-sky-50",
    indigo:  "from-indigo-500 to-indigo-600 text-indigo-50",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">{subIcon}{sub}</p>
    </div>
  );
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
      <span className="flex items-center gap-1.5 text-slate-600 font-medium">{icon}{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </li>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`bg-white w-full sm:max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out ${
          entered
            ? "translate-y-0 opacity-100"
            : "translate-y-full sm:translate-y-8 sm:opacity-0"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function IncomeModal({ onClose, onSave }: { onClose: () => void; onSave: (v: Omit<Income, "id">) => Promise<void> }) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date,   setDate]   = useState(today);
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Add Income" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Source">
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Salary, Freelance"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
        </Field>
        <Field label="Amount (RM)">
          <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
        </Field>
        <button
          disabled={!source || !amount || saving}
          onClick={async () => { setSaving(true); try { await onSave({ source, amount: parseFloat(amount), date }); } finally { setSaving(false); } }}
          className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Income"}
        </button>
      </div>
    </Modal>
  );
}

function ExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: (v: Omit<Expense, "id">) => Promise<void> }) {
  const [name,     setName]     = useState("");
  const [category, setCategory] = useState<Category>("Food & Dining");
  const [amount,   setAmount]   = useState("");
  const [date,     setDate]     = useState(today);
  const [saving,   setSaving]   = useState(false);
  return (
    <Modal title="Add Expense" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Expense Name">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lunch, Petrol"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
        </Field>
        <Field label="Category">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const active = category === c.name;
              return (
                <button key={c.name} onClick={() => setCategory(c.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <Icon className="w-3.5 h-3.5" /> {c.name}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Amount (RM)">
          <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
        </Field>
        <button
          disabled={!name || !amount || saving}
          onClick={async () => { setSaving(true); try { await onSave({ name, category, amount: parseFloat(amount), date }); } finally { setSaving(false); } }}
          className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Expense"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}