import React from "react";
import { Shield, Sparkles, Heart, RefreshCw, HelpCircle, Landmark } from "lucide-react";
import { AccountsState } from "../types";

interface NavigationProps {
  accountsState: AccountsState;
  onElderlyToggle: (enabled: boolean) => void;
  onReset: () => void;
}

export default function Navigation({ accountsState, onElderlyToggle, onReset }: NavigationProps) {
  return (
    <header className="bg-white border-b border-slate-150 text-slate-800 shadow-xs relative select-none">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        
        {/* Left Bank4U Branding with NEURA Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-bimb-red text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-black text-lg tracking-tight text-slate-900">Bank4U</span>
              <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">Demo Portal</span>
              
              {/* Intelligent NEURA badge shown as integrated */}
              <div className="flex items-center gap-1 bg-bimb-peach border border-rose-100 text-bimb-red text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xxs">
                <Sparkles className="w-2.5 h-2.5 fill-bimb-red text-bimb-red animate-pulse" />
                <span>NEURA AI Shield Integrated</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Protecting users before, during, and after every transaction</p>
          </div>
        </div>

        {/* Right Action widgets */}
        <div className="flex items-center gap-3">
          {/* Help Line */}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono">
            <span>Support: +60 3-26 900 900</span>
          </div>

          <button
            onClick={onReset}
            title="Reset system base to default status"
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3 h-3 text-bimb-red" />
            <span className="text-[10px]">Reset State</span>
          </button>

          {/* ELDERLY PROTECTION MODE CONTROL */}
          <div className="flex items-center gap-2 bg-bimb-peach border border-rose-150 px-2.5 py-1 rounded-xl transition-all">
            <div className="flex items-center gap-1 shrink-0">
              <Heart className={`w-3.5 h-3.5 transition-colors ${accountsState.elderlyMode ? "text-bimb-red fill-bimb-red animate-pulse" : "text-rose-450"}`} />
              <span className="text-[10px] font-black text-slate-700">Elderly Mode</span>
            </div>
            <button
              onClick={() => onElderlyToggle(!accountsState.elderlyMode)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                accountsState.elderlyMode ? "bg-bimb-red" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                  accountsState.elderlyMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dynamic Sub-header Banner showing current state of active protection */}
      <div className="bg-slate-50 border-t border-slate-100 py-1.5 px-4">
        <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-tight flex items-center justify-center gap-1.5">
          {accountsState.elderlyMode ? (
            <span className="flex items-center gap-1 text-bimb-red font-bold animate-pulse">
              <Heart className="w-3.5 h-3.5 fill-bimb-red text-bimb-red" />
              Elderly Safety Mode is active: {accountsState.caregiverName} approval required for transfers exceeding RM {accountsState.elderlyLimit.toFixed(2)}.
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 fill-emerald-500/10 animate-pulse" />
              <span>Secured by active **NEURA Cognitive Protection**: Bio-behavioral scam filters are running automatically.</span>
            </span>
          )}
        </p>
      </div>
    </header>
  );
}
