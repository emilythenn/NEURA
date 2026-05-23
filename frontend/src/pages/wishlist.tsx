import { useState, useEffect, useCallback } from "react";
import {
  Lock, ShoppingBag, RefreshCw, Trash2, Loader2, Sparkles,
  CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

type WishlistStatus = "delayed" | "bought" | "removed";

type WishlistItem = {
  id:          string;
  userId:      string;
  itemName:    string;
  amount:      number;
  category:    string;
  riskScore:   number;
  explanation: string;
  status:      WishlistStatus;
  createdAt:   number;
};

interface WishlistPageProps {
  onReRunAI?: (item: { itemName: string; category: string; amount: number }) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function riskBadge(score: number): { bg: string; label: string; icon: React.ReactNode } {
  if (score >= 70) return { bg: "bg-rose-50 text-rose-700 border-rose-200",   label: "High Risk",    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" /> };
  if (score >= 40) return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium Risk",  icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> };
  return              { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low Risk",   icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> };
}

function formatAge(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WishlistPage({ onReRunAI }: WishlistPageProps) {
  const [items,         setItems]         = useState<WishlistItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data.filter((i: WishlistItem) => i.status === "delayed"));
      }
    } catch (e) {
      console.error("Failed to load wishlist:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleBuyNow = async (id: string) => {
    setActionLoading(`${id}-buy`);
    try {
      await fetch(`/api/wishlist/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "bought" }),
      });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoading(`${id}-remove`);
    try {
      await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight text-slate-900">Wishlist Vault</h2>
              <p className="text-xs text-slate-500">
                Purchases you've delayed — revisit when your budget is ready.
              </p>
            </div>
            {items.length > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                {items.length} saved
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading vault…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Lock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Vault is empty</p>
              <p className="text-xs">
                When you delay a purchase from the Predictive Layer, it appears here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const badge = riskBadge(item.riskScore);
                const buyKey    = `${item.id}-buy`;
                const removeKey = `${item.id}-remove`;
                return (
                  <div
                    key={item.id}
                    className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3 hover:bg-slate-50 transition-colors"
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.itemName}</p>
                          <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono font-bold text-slate-700">
                            RM {item.amount.toFixed(2)}
                          </p>
                          <span className="text-[10px] text-slate-400">{formatAge(item.createdAt)}</span>
                        </div>
                        {item.explanation && (
                          <p className="text-[11px] text-slate-500 mt-1.5 italic leading-relaxed">
                            "{item.explanation}"
                          </p>
                        )}
                      </div>

                      {/* Risk badge */}
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${badge.bg}`}>
                        {badge.icon}
                        <span>{item.riskScore}% · {badge.label}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleBuyNow(item.id)}
                        disabled={actionLoading === buyKey}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {actionLoading === buyKey
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ShoppingBag className="w-3 h-3" />}
                        Buy Now
                      </button>

                      <button
                        onClick={() => onReRunAI?.({ itemName: item.itemName, category: item.category, amount: item.amount })}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Re-run AI
                      </button>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={actionLoading === removeKey}
                        className="flex items-center gap-1.5 disabled:opacity-50 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                      >
                        {actionLoading === removeKey
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Behavioral note */}
        {items.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl px-5 py-4 border border-slate-700 flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Behavioral Pattern Active</span>
              Every item here represents a moment your financial discipline held. Re-running AI will re-score based on your current balance — the right time to buy may have arrived.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
