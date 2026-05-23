import React, { useState } from "react";
import { 
  Camera, Sparkles, TrendingDown, Hourglass, BarChart3, Activity, ShieldAlert, CheckCircle2, 
  HelpCircle, Zap, Coins, Clock, Lock, Copy 
} from "lucide-react";
import { AccountsState, ProductScanResult } from "../types";

interface RealityLensProps {
  accountsState: AccountsState;
  onRefreshData: () => void;
  onPostStatusMessage: (msg: string, type: "success" | "warn") => void;
}

export default function RealityLens({ accountsState, onRefreshData, onPostStatusMessage }: RealityLensProps) {
  const [selectedScanItem, setSelectedScanItem] = useState<string>("sony wh-1000xm5");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  
  // Custom manual price override slider to simulate scan fluctuations
  const [storePriceOverride, setStorePriceOverride] = useState<number>(1499);

  const DEMO_SCAN_PRODUCTS = [
    { id: "sony wh-1000xm5", label: "🎧 Sony Headphones Tag", price: 1499, icon: "🎧" },
    { id: "iphone 15 pro max", label: "📱 iPhone Spec Board", price: 6499, icon: "📱" },
    { id: "premium organic honey", label: "🍯 Yemeni Honey Jar", price: 120, icon: "🍯" },
    { id: "flying crypto barakah scheme", label: "📄 Telegram Investment Flyer", price: 5000, icon: "📄" }
  ];

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    // Dynamic scanning micro-delay
    setTimeout(async () => {
      try {
        const response = await fetch("/api/scan-reality-lens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: selectedScanItem,
            overridePrice: storePriceOverride
          })
        });
        const data = await response.json();
        setScanResult(data);
      } catch (err) {
        console.error("Camera scan failed: ", err);
      } finally {
        setIsScanning(false);
      }
    }, 1500);
  };

  const handleProductSelect = (id: string, price: number) => {
    setSelectedScanItem(id);
    setStorePriceOverride(price);
    setScanResult(null);
  };

  // ACTION 1: SAVE THE DIFFERENCE
  const handleSaveDifference = async () => {
    if (!scanResult) return;
    try {
      const resp = await fetch("/api/save-difference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: scanResult.savings })
      });
      if (resp.ok) {
        onRefreshData();
        onPostStatusMessage(`Successfully saved difference of RM ${scanResult.savings.toFixed(2)} to Mudharabah Account-i!`, "success");
        setScanResult(null);
      } else {
        const data = await resp.json();
        onPostStatusMessage(data.error || "Failed to make deposit to vault.", "warn");
      }
    } catch {
      onPostStatusMessage("Vault deposit network error.", "warn");
    }
  };

  // ACTION 2: DELAY & LOCK
  const handleDelayLock = async () => {
    if (!scanResult) return;
    try {
      const resp = await fetch("/api/delay-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: scanResult.details.onlinePrice })
      });
      if (resp.ok) {
        onRefreshData();
        onPostStatusMessage(`Delay & Lock active! RM ${scanResult.details.onlinePrice.toFixed(2)} moved to Shopee-Delay Vault. Safe for 15 hours.`, "success");
        setScanResult(null);
      } else {
        const data = await resp.json();
        onPostStatusMessage(data.error || "Failed to delay-lock funds.", "warn");
      }
    } catch {
      onPostStatusMessage("Delay-lock network error.", "warn");
    }
  };

  // ACTION 3: VIRTUAL CARD SINGLE USE
  const handleVirtualCardProceed = () => {
    if (!scanResult) return;
    onPostStatusMessage(`Temporary single-use Secure Token created for "${scanResult.details.name}". Pay safely!`, "success");
    setScanResult(null);
  };

  return (
    <div id="multimodal-reality-lens-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
      
      {/* Module Title */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-bimb-peach rounded-xl">
          <Camera className="w-5 h-5 text-bimb-red" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg tracking-tight text-slate-900">
            {accountsState.elderlyMode ? "Amanah Camera Price Checker" : "📸 Multimodal Reality Lens (SmartScan)"}
          </h2>
          <p className="text-xs text-slate-500">
            {accountsState.elderlyMode ? "Arahkan kamera ke barangan untuk ketahui harga jualan murah Shopee." : "Real-time context analysis & opportunity cost diagnostics."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CAMERA SCREEN CONTAINER (MOCK) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl bg-neutral-900 overflow-hidden border border-neutral-800 shadow-inner h-[280px] flex flex-col justify-between p-4">
            
            {/* HUD Scan overlay visuals */}
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-neutral-900/60 pointer-events-none z-10" />
            
            {/* Grid & scanlines */}
            <div className={`absolute inset-0 opacity-15 bg-[linear-gradient(rgba(18,18,18,0)_95%,_rgba(211,17,69,0.7)_95%),_linear-gradient(90deg,_rgba(18,18,18,0)_95%,_rgba(211,17,69,0.7)_95%)] bg-[size:24px_24px] pointer-events-none ${isScanning ? "animate-pulse" : ""}`} />
            
            {/* Top camera status bar */}
            <div className="flex items-center justify-between z-10">
              <span className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-[#f9bf15] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f9bf15] animate-ping" />
                AR Glass Link
              </span>
              <span className="text-[9px] font-mono text-neutral-400">FPS: 60 // ISO: 320</span>
            </div>

            {/* Target outline overlay */}
            <div className="absolute inset-12 border-2 border-dashed border-bimb-red/20 rounded-xl pointer-events-none flex items-center justify-center">
              {isScanning ? (
                /* Scanning Laser line */
                <div className="w-full h-1 bg-bimb-red shadow-[0_0_15px_#d31145] absolute top-1/2 left-0 -translate-y-1/2 animate-[bounce_1.5s_infinite]" />
              ) : (
                <div className="w-5 h-5 border-t-2 border-l-2 border-bimb-red/60 absolute top-0 left-0" />
              )}
            </div>

            {/* Mock Camera Image viewport derived from product mock */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 z-0">
              <div className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDuration: '4s' }}>
                {DEMO_SCAN_PRODUCTS.find(p => p.id === selectedScanItem)?.icon || "🎧"}
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mt-2 font-bold uppercase tracking-wider text-center">
                {isScanning ? "Evaluating Shariah & Baseline patterns..." : "Viewport Target Locked"}
              </p>
            </div>

            {/* Price control slider simulation */}
            <div className="bg-neutral-950/80 backdrop-blur-md p-3 rounded-xl border border-neutral-800 z-10 space-y-1.5">
              <div className="flex justify-between text-[10px] sm:text-xs">
                <span className="text-slate-400 font-semibold uppercase">Scan Store Price:</span>
                <span className="font-mono font-bold text-white text-xs">RM {storePriceOverride}</span>
              </div>
              <input 
                id="camera-price-simulator"
                type="range"
                min="50"
                max={selectedScanItem === "iphone 15 pro max" ? "8000" : "2000"}
                value={storePriceOverride}
                onChange={(e) => {
                  setStorePriceOverride(parseInt(e.target.value));
                  setScanResult(null); // Clear previous to recalculate
                }}
                className="w-full accent-bimb-red cursor-pointer"
              />
            </div>
          </div>

          {/* Catalog target select options */}
          <div className="space-y-1.5 select-none">
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Change physical target placeholder:</span>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_SCAN_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleProductSelect(prod.id, prod.price)}
                  className={`px-3 py-2 text-left text-xs border rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                    selectedScanItem === prod.id ? "bg-bimb-peach border-bimb-red text-bimb-red shadow-xs" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-sm shrink-0">{prod.icon}</span>
                  <span className="truncate">{prod.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="w-full bg-[#d31145] hover:bg-[#a10b31] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Camera className="w-4 h-4 text-white" />
            {isScanning ? "Engaging Multi-Spectral Lens..." : "Scan Target ItemNow"}
          </button>
        </div>

        {/* RIGHT COLUMN: 4 HUD GLASS CARDS & ACTION CENTER */}
        <div className="lg:col-span-7 flex flex-col justify-start min-h-[300px]">
          
          {!scanResult ? (
            /* Idle Screen */
            <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <Sparkles className="w-8 h-8 text-slate-300 animate-pulse mb-3" />
              <h3 className="font-display font-medium text-xs text-slate-600">Scan Viewport is Empty</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">
                Click one of our live mock options like "Sony Headphones" or "Telegram Investment Flyer" on the left, slide the simulated store price slider, and hit "Scan Target ItemNow".
              </p>
            </div>
          ) : (
            /* HUD PRESENTATION */
            <div id="ar-hud-cards" className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900">{scanResult.details.name}</h4>
                  <p className="text-[10px] text-slate-400">Class: Category {scanResult.details.category}</p>
                </div>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-mono px-2 py-0.5 rounded font-bold font-mono">
                  Calculated Savings: RM {scanResult.savings}
                </span>
              </div>

              {/* Grid of 4 HUD Transparent Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* CARD 1: VALUE ASSESSMENT */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 relative overflow-hidden group">
                  <div className="blue-shine absolute top-0 left-0 w-full h-1 bg-teal-400" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🏷️ Value Audit</span>
                    <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="pt-1.5 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700">Online Mean</span>
                    <span className="font-mono text-sm font-bold text-teal-600">RM {scanResult.details.onlinePrice}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1 bg-transparent border-0 font-medium">
                    Found on {scanResult.details.onlineSourceName}. You save RM {scanResult.savings} immediately.
                  </p>
                </div>

                {/* CARD 2: OPPORTUNITY COST */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 relative overflow-hidden">
                  <div className="blue-shine absolute top-0 left-0 w-full h-1 bg-amber-400" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⚖️ Work-Sweat Cost</span>
                    <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="pt-1.5 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700">Equivalent Labor</span>
                    <span className="font-mono text-sm font-bold text-amber-600">{scanResult.timeValueHours} Working Hrs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1 font-medium">
                    Based on standard labor calculations, this item costs {scanResult.timeValueHours} hours of your dedicated sweat labor.
                  </p>
                </div>

                {/* CARD 3: DISCRETIONARY BUDGET IMPACT */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    scanResult.budgetImpact.color === "🔴" ? "bg-rose-500" : scanResult.budgetImpact.color === "🟡" ? "bg-amber-400" : "bg-emerald-400"
                  }`} />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📊 CFO Budget Impact</span>
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="pt-1.5 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700">Remaining Limit</span>
                    <span className={`font-mono text-sm font-bold ${
                      scanResult.budgetImpact.color === "🔴" ? "text-rose-600" : "text-slate-800"
                    }`}>RM {scanResult.budgetImpact.remaining.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1 font-medium">
                    {scanResult.budgetImpact.message}
                  </p>
                </div>

                {/* CARD 4: SHARIAH ETHICAL GUARD */}
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${scanResult.details.halalStatus.includes("Strict Violation") ? "bg-rose-600" : "bg-emerald-500"}`} />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🕌 Halal & Ethics Audit</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-500 animate-ping" />
                  </div>
                  <div className="pt-1.5 flex justify-between items-center gap-1.5">
                    <span className={`text-[11px] font-bold truncate ${scanResult.details.halalStatus.includes("Strict Violation") ? "text-rose-600" : "text-emerald-700"}`}>
                      {scanResult.details.halalStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug pt-1 font-medium line-clamp-2">
                    {scanResult.details.shariahAudit}
                  </p>
                </div>

              </div>

              {/* CLOSING THE LOOP INTERACTION BOX */}
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3.5 mt-2 border border-slate-800">
                <div className="flex items-center gap-1.5 text-bimb-gold">
                  <Zap className="w-4.5 h-4.5 animate-pulse shrink-0 fill-bimb-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider">Closing-the-Loop Smart Decisions</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Save the Difference */}
                  <button
                    onClick={handleSaveDifference}
                    disabled={scanResult.savings <= 0}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Save RM {scanResult.savings} (In Vault)
                  </button>

                  {/* Delay & Lock */}
                  <button
                    onClick={handleDelayLock}
                    disabled={selectedScanItem === "flying crypto barakah scheme"}
                    className="flex-1 bg-bimb-gold/20 hover:bg-bimb-gold/30 text-bimb-gold border border-bimb-gold/30 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Delay & Lock 15h
                  </button>

                  {/* Single Use Virtual Card */}
                  <button
                    onClick={handleVirtualCardProceed}
                    disabled={selectedScanItem === "flying crypto barakah scheme"}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Proceed Virtual Card
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
