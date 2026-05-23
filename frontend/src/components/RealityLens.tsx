<<<<<<< HEAD
import React, { useEffect, useRef, useState } from "react";
import { 
  Camera, Sparkles, TrendingDown, Hourglass, BarChart3, Activity,
  Zap, Coins, Lock, Copy, ScanLine, CircleStop, ScanSearch, ShieldCheck,
  Wallet, CornerUpRight, Smartphone
=======
import React, { useState } from "react";
import { 
  Camera, Sparkles, TrendingDown, Hourglass, BarChart3, Activity, ShieldAlert, CheckCircle2, 
  HelpCircle, Zap, Coins, Clock, Lock, Copy 
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
} from "lucide-react";
import { AccountsState, ProductScanResult } from "../types";

interface RealityLensProps {
  accountsState: AccountsState;
  onRefreshData: () => void;
  onPostStatusMessage: (msg: string, type: "success" | "warn") => void;
}

export default function RealityLens({ accountsState, onRefreshData, onPostStatusMessage }: RealityLensProps) {
<<<<<<< HEAD
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [frameBase64, setFrameBase64] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch((error) => {
      console.error("Failed to start camera playback:", error);
    });
  }, [cameraActive]);

  useEffect(() => {
    if (scanResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      window.scrollTo({ top: resultRef.current.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    }
  }, [scanResult]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      console.error("Failed to open camera:", error);
      setCameraError("Unable to access camera. Check browser permission or use HTTPS tunnel.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1] || null;
    setFrameBase64(base64);
    return base64;
  };
=======
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
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);

<<<<<<< HEAD
    const captured = cameraActive ? captureFrame() : frameBase64;

    if (!captured) {
      setIsScanning(false);
      onPostStatusMessage("No camera frame captured yet. Keep the camera open and try again.", "warn");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/reality-lens/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          label: "",
          attachmentLabel: "",
          imageBase64: captured,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || `Scan failed with status ${response.status}`);
      }

      const data = payload;
      setScanResult(data);
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const message = isAbort
        ? "Scan took too long. The system switched to a fast fallback result. Please try again if needed."
        : err instanceof Error
          ? err.message
          : "Scan failed. Please retry.";
      console.error("Camera scan failed: ", err);
      onPostStatusMessage(message, "warn");
    } finally {
      window.clearTimeout(timeoutId);
      setIsScanning(false);
    }
=======
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
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
  };

  // ACTION 1: SAVE THE DIFFERENCE
  const handleSaveDifference = async () => {
    if (!scanResult) return;
    try {
<<<<<<< HEAD
      const resp = await fetch("/api/reality-lens/save-difference", {
=======
      const resp = await fetch("/api/save-difference", {
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: scanResult.savings })
      });
      if (resp.ok) {
        onRefreshData();
<<<<<<< HEAD
=======
        onPostStatusMessage(`Successfully saved difference of RM ${scanResult.savings.toFixed(2)} to Mudharabah Account-i!`, "success");
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
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
<<<<<<< HEAD
      const resp = await fetch("/api/reality-lens/delay-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: scanResult.bottomSheetActions?.suggestedTransferAmount || scanResult.details.onlinePrice })
      });
      if (resp.ok) {
        onRefreshData();
=======
      const resp = await fetch("/api/delay-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: scanResult.details.onlinePrice })
      });
      if (resp.ok) {
        onRefreshData();
        onPostStatusMessage(`Delay & Lock active! RM ${scanResult.details.onlinePrice.toFixed(2)} moved to Shopee-Delay Vault. Safe for 15 hours.`, "success");
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
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
<<<<<<< HEAD
    setScanResult(null);
  };

  const liveHint = cameraActive ? "Camera live" : "Camera idle";
  const topBadge = scanResult
    ? scanResult.verdict?.status === "EXPENSIVE"
      ? "Price warning active"
      : "Scan result ready"
    : "Awaiting scan";

  return (
    <div id="multimodal-reality-lens-section" className="space-y-4">
      <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(211,17,69,0.08),_transparent_34%),linear-gradient(180deg,_#ffffff,_#fbfdff_58%,_#f8fafc)] text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
                <ScanSearch className="h-3.5 w-3.5 text-[#d31145]" />
                SmartScan AI
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {liveHint}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                  {accountsState.elderlyMode ? "Amanah Reality Lens" : "Multimodal Reality Lens"}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Point the camera at a product, price tag, or flyer. SmartScan reads the object, estimates store price, compares market value, and shows affordability and Shariah guidance on the live camera feed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[290px]">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 backdrop-blur-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Detected</div>
                <div className="mt-1 text-sm font-bold text-slate-950">{scanResult?.details.name || "Ready"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 backdrop-blur-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</div>
                <div className="mt-1 text-sm font-bold text-slate-950">{topBadge}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 backdrop-blur-xl shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Budget</div>
                <div className="mt-1 text-sm font-bold text-slate-950">RM {accountsState.discretionaryBudget.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
            <div className="space-y-4">
              <div className="relative min-h-[620px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_70px_rgba(15,23,42,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(211,17,69,0.08),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.72),_rgba(241,245,249,0.92))]" />
                <div className={`absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40 ${isScanning ? "animate-pulse" : ""}`} />

                {isScanning && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/30 p-6 backdrop-blur-[2px]">
                    <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white/95 p-5 text-slate-900 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d31145]/10 text-[#d31145]">
                          <ScanLine className="h-5 w-5 animate-spin" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">AI scanning</div>
                          <div className="mt-1 text-lg font-black text-slate-950">Analyzing your image</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#d31145] via-[#f9bf15] to-emerald-500" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            Detecting item details
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            Reading price and label
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            Preparing result cards
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(90deg,rgba(211,17,69,0.04),rgba(249,191,21,0.08),rgba(34,197,94,0.04))] px-4 py-3 text-sm leading-6 text-slate-600">
                          Gemini is analyzing the image and building your result in real time.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 backdrop-blur-xl shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {cameraActive ? "Live Camera" : "Preview Mode"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 backdrop-blur-xl shadow-sm">
                    FPS 60 // Auto AR Overlay
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-white shadow-2xl backdrop-blur-xl">
                        <Camera className="h-12 w-12 text-[#d31145]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-slate-950">Tap Open Camera to start scanning</div>
                        <div className="mt-1 text-sm text-slate-500">
                          Live scan will use your device camera and show results immediately below.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-6 rounded-[26px] border border-slate-200/70 bg-white/10" />

                <div className="absolute inset-x-4 bottom-4 z-20 flex justify-end">
                  <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm backdrop-blur-xl">
                    SmartScan live overlay
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {cameraError}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-black"
                  >
                    <Camera className="h-4 w-4" />
                    Open Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                  >
                    <CircleStop className="h-4 w-4" />
                    Stop Camera
                  </button>
                )}

                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d31145] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#a10b31] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  {isScanning ? "Scanning..." : "Scan Now"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {isScanning && !scanResult ? (
                null
              ) : !scanResult ? null : (
                <div ref={resultRef} className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 backdrop-blur-xl shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Detected Item</div>
                        <div className="mt-1 text-xl font-black text-slate-950">{scanResult.details.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{scanResult.detectedLabel || scanResult.matchedProduct}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right shadow-sm">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Savings</div>
                        <div className="text-lg font-black text-emerald-600">RM {scanResult.savings.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 backdrop-blur-xl shadow-sm">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
                        <span>Value Card</span>
                        <TrendingDown className="h-4 w-4 text-teal-500" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Store Price</span>
                          <span className="font-mono font-bold text-slate-950">RM {scanResult.details.storePrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Online platform</span>
                          <a href={scanResult.details.onlineSourceUrl || "#"} target="_blank" rel="noreferrer" className="font-semibold text-[#d31145] underline decoration-2 underline-offset-4">
                            {scanResult.details.onlineSourceName}
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Online Price</span>
                          <span className="font-mono font-bold text-teal-600">RM {scanResult.details.onlinePrice}</span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Platform proof</div>
                          <div className="mt-2 grid gap-2">
                            {(scanResult.details.marketplaceComparisons || []).map((item) => (
                              <a
                                key={item.platform}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:border-[#d31145]/30 hover:bg-slate-50"
                              >
                                <span className="font-semibold text-slate-900">{item.platform}</span>
                                <span className="font-mono text-sm text-slate-700">RM {item.price.toFixed(2)}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-600">You save</div>
                          <div className="mt-1 text-2xl font-black text-emerald-700">RM {scanResult.savings.toFixed(2)}</div>
                          <div className="mt-1 text-xs text-emerald-700/80">Compared with the store price.</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 backdrop-blur-xl shadow-sm">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
                        <span>Impact Card</span>
                        <Wallet className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Category</span>
                          <span className="font-semibold text-slate-950">{scanResult.budgetImpact.category || scanResult.details.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Impact</span>
                          <span className={`font-semibold ${scanResult.budgetImpact.color === "🔴" ? "text-rose-500" : scanResult.budgetImpact.color === "🟡" ? "text-amber-500" : "text-emerald-600"}`}>
                            {scanResult.budgetImpact.level || "LOW"}
                          </span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          {scanResult.budgetImpact.message}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 backdrop-blur-xl shadow-sm">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
                        <span>Shariah Shield</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {scanResult.shariahShield?.status || scanResult.details.halalStatus}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {scanResult.shariahShield?.message || scanResult.details.shariahAudit}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {scanResult && (
            <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 text-slate-900 backdrop-blur-xl shadow-sm lg:grid-cols-[1fr_1.1fr]">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  <Zap className="h-4 w-4 text-[#d31145]" />
                  Next actions
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-6">
                  Choose what to do with this scan result. Each action goes straight to a backend flow and then returns you to the camera.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={handleSaveDifference}
                  disabled={scanResult.bottomSheetActions ? !scanResult.bottomSheetActions.canSaveDifference : scanResult.savings <= 0}
                  className="rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 text-left text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="text-sm font-semibold">Save Difference</div>
                  <div className="mt-1 text-xs leading-5 text-slate-300">
                    Move the price gap into the savings vault.
                  </div>
                </button>
                <button
                  onClick={handleDelayLock}
                  disabled={scanResult.bottomSheetActions ? !scanResult.bottomSheetActions.canDelayLock : false}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="text-sm font-semibold">Delay & Lock</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    Lock the amount for a cooling-off period.
                  </div>
                </button>
                <button
                  onClick={handleVirtualCardProceed}
                  disabled={scanResult.bottomSheetActions ? !scanResult.bottomSheetActions.canProceedSafely : false}
                  className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="text-sm font-semibold">Proceed Safely</div>
                  <div className="mt-1 text-xs leading-5 text-emerald-700/80">
                    Continue with a single-use payment token.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
=======
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

>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
    </div>
  );
}
