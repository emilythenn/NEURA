import React, { useState, useEffect } from "react";
import { 
  Plus, ArrowUpRight, TrendingUp, ShieldAlert, Sparkles, AlertCircle, CheckCircle, 
  Clock, Heart, User, Wallet, Moon, Lock, Info, Landmark, HelpCircle, FileText, Home, Camera, RefreshCw,
  ArrowLeftRight, Smartphone, Shield, Scan, QrCode, Copy, Check, Download, ArrowLeft
} from "lucide-react";
import Navigation from "./components/Navigation";
import PredictiveLayer from "./components/PredictiveLayer";
import AgentChatbot from "./components/AgentChatbot";
import FundTransfer from "./components/FundTransfer";
import RealityLens from "./components/RealityLens";
import { AccountsState, ChatMessage } from "./types";
import { DEMO_OTP_CODES, isValidOtp, generateDemoOtp } from "./demoOTP";

export default function App() {
  const [accountsState, setAccountsState] = useState<AccountsState>({
    totalBalance: 10000.00,
    discretionaryBudget: 800.00,
    discretionaryBudgetTotal: 2000.00,
    fixedExpenses: 1200.00,
    userName: "Encik Mohamad Zulhilmy",
    accountNo: "150123456789",
    financingAccounts: [],
    transactions: [],
    elderlyMode: false,
    elderlyLimit: 300.00,
    caregiverName: "Sara",
    caregiverPhone: "+60 12-345 6789",
    isCaregiverApproved: false,
    lockedVaults: []
  });

  const [activeTab, setActiveTab] = useState<"analysis" | "chat" | "home" | "scanner" | "profile">("home");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferPresetMode, setTransferPresetMode] = useState<"transfer" | "pay" | "reload">("transfer");
  const [statusBar, setStatusBar] = useState<{ message: string; type: "success" | "warn" } | null>(null);
  const [homeSubTab, setHomeSubTab] = useState<"account" | "investments" | "history">("account");
  
  // Transaction History feed sorting and filter states
  const [historyDateFilter, setHistoryDateFilter] = useState<"all" | "1" | "3" | "9" | "12" | "cancelled_refunded">("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "income" | "expense" | "cancelled_refunded">("all");
  
  // Dynamic Auto-Debits and Subscriptions (Fixed Financial Responsibilities) state
  const [autoDebits, setAutoDebits] = useState([
    { id: "ad-1", name: "Takaful Hijrah Protection Plan-i", category: "Takaful Insurance", amount: 45.00, frequency: "Monthly", status: "Active" as "Active" | "Paused", nextDate: "2026-06-01", provider: "Syarikat Takaful Malaysia" },
    { id: "ad-2", name: "Netflix Premium Malaysia", category: "Lifestyle Subscription", amount: 55.00, frequency: "Monthly", status: "Active" as "Active" | "Paused", nextDate: "2026-06-05", provider: "Netflix Inc." },
    { id: "ad-3", name: "Tenaga Nasional Berhad", category: "Fixed Utility AutoPay", amount: 148.50, frequency: "Monthly", status: "Active" as "Active" | "Paused", nextDate: "2026-06-02", provider: "Tenaga Nasional Berhad" },
    { id: "ad-4", name: "Lembaga Zakat Selangor (Pusat Kutipan)", category: "Regular Saddaqah / Zakat", amount: 100.00, frequency: "Monthly", status: "Active" as "Active" | "Paused", nextDate: "2026-06-10", provider: "Zakat Selangor Darul Ehsan" },
    { id: "ad-5", name: "Astro GO Media Subscription", category: "Entertainment", amount: 95.00, frequency: "Monthly", status: "Paused" as "Active" | "Paused", nextDate: "Suspended", provider: "Astro Malaysia Holding" }
  ]);
  const [newAdName, setNewAdName] = useState("");
  const [newAdCategory, setNewAdCategory] = useState("Utilities");
  const [newAdAmount, setNewAdAmount] = useState("");
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  
  // QR Scan and Receive simulation states
  const [qrFlow, setQrFlow] = useState<"scan" | "receive" | null>(null);
  const [qrStep, setQrStep] = useState<"scan_view" | "pay_sheet" | "success">("scan_view");
  const [qrMerchant, setQrMerchant] = useState<{ name: string; category: string; defaultAmount: number } | null>(null);
  const [qrAmount, setQrAmount] = useState<string>("");
  const [qrReference, setQrReference] = useState<string>("");
  const [qrReceiveAmount, setQrReceiveAmount] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Initialize chatbot conversation feed with polite greeting from master Orchestrator
  const [chatbotMessages, setChatbotMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "Assalamualaikum En. Mohamad Zulhilmy. I am NEURA, your Shariah-compliant Cognitive Banking Companion. We can route query intents to Shield 🛡️, Mizan 💰, Barakah 🕌, or Ehsan 🤲 specialized sub-minds. How may we guide your secure finance today?",
      agent: "Orchestrator",
      time: "09:30 AM"
    }
  ]);

  // Elderly Guardian Setup Modal States
  const [showElderlySetup, setShowElderlySetup] = useState(false);
  const [setupStep, setSetupStep] = useState<"form" | "handshake" | "disable_verify">("form");
  const [setupCaregiverName, setSetupCaregiverName] = useState("");
  const [setupCaregiverPhone, setSetupCaregiverPhone] = useState("");
  const [setupElderlyLimit, setSetupElderlyLimit] = useState(0);
  const [setupRelationship, setSetupRelationship] = useState("Caregiver");
  const [setupAlertChannel, setSetupAlertChannel] = useState("SMS OTP");

  // Firebase phone confirmation result when using SMS OTP
  const [phoneConfirmation, setPhoneConfirmation] = useState<any | null>(null);

  // One Time Code Verification States
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [typedOtp, setTypedOtp] = useState("");
  const [otpVerificationError, setOtpVerificationError] = useState("");

  // Sync state from Express backend
  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) {
        const payload = await res.text();
        throw new Error(`Backend response ${res.status} ${res.statusText}: ${payload}`);
      }
      const data = await res.json();
      setAccountsState(data);
    } catch (e) {
      console.error("Failed to synch metrics with backend: ", e);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Post notifications
  const postStatusMessage = (msg: string, type: "success" | "warn") => {
    setStatusBar({ message: msg, type });
    setTimeout(() => {
      setStatusBar(null);
    }, 6000);
  };

  const normalizeMalaysiaPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    if (value.startsWith("+")) {
      return `+${digits}`;
    }

    if (digits.startsWith("60")) {
      return `+${digits}`;
    }

    if (digits.startsWith("0")) {
      return `+60${digits.slice(1)}`;
    }

    if (digits.length >= 8 && digits.length <= 11) {
      return `+60${digits}`;
    }

    return value;
  };

  // Toggle elderly mode on backend
  const handleElderlyToggleOnServer = async (
    enabled: boolean, 
    limit?: number, 
    caregiverName?: string, 
    caregiverPhone?: string
  ) => {
    try {
      const res = await fetch("/api/toggle-elderly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          enabled, 
          limit: limit !== undefined ? limit : accountsState.elderlyLimit,
          caregiverName: caregiverName || accountsState.caregiverName,
          caregiverPhone: caregiverPhone || accountsState.caregiverPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setAccountsState(data.state);
        postStatusMessage(
          enabled 
            ? `Elderly Protection activated: Simplified interface is now loaded and Caregiver approval by ${caregiverName || data.state.caregiverName} is required.` 
            : "Elderly Protection paused: Normal high-velocity transfers allowed.",
          "success"
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleElderlyToggleClick = (enabled: boolean) => {
    if (enabled) {
      // Start a clean caregiver setup flow with empty inputs
      setSetupCaregiverName("");
      setSetupCaregiverPhone("");
      setSetupElderlyLimit(0);
      setSetupRelationship("Caregiver");
      setSetupAlertChannel("SMS OTP");
      setSetupStep("form");
      setTypedOtp("");
      setGeneratedOtp("");
      setOtpVerificationError("");
      setShowElderlySetup(true);
    } else {
      // Turning off: Require One-Time Code from caregiver end
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setTypedOtp("");
      setOtpVerificationError("");
      setSetupStep("disable_verify");
      setShowElderlySetup(true);
    }
  };

  // Request a verification code (Get Code) — either via SMS (Firebase) or simulated in-app for integrated channel
  const handleGetCode = async () => {
    if (!setupCaregiverName || !setupCaregiverPhone || setupElderlyLimit <= 0 || !setupRelationship || !setupAlertChannel) {
      alert("Please enter all required information.");
      return;
    }
    setOtpVerificationError("");

    const normalizedPhone = normalizeMalaysiaPhone(setupCaregiverPhone);
    setSetupCaregiverPhone(normalizedPhone);

    if (setupAlertChannel === "SMS OTP") {
      // Demo mode: Generate a random code from the demo OTP list
      const randomCode = generateDemoOtp();
      setGeneratedOtp(randomCode);
      setTypedOtp("");
      setOtpVerificationError("");
      setSetupStep("handshake");
      postStatusMessage(`Demo OTP sent to caregiver. (Test code: ${randomCode})`, "success");
      return;
    }

    // In-app notification: simulated handshake with in-app approval preview
    const randomCode = generateDemoOtp();
    setGeneratedOtp(randomCode);
    setTypedOtp("");
    setOtpVerificationError("");
    setSetupStep("handshake");
    postStatusMessage("In-app notification preview ready for approval.", "success");
  };

  const verifyHandshake = async () => {
    if (!typedOtp) {
      setOtpVerificationError("Please enter the One-Time Code from caregiver.");
      return;
    }

    // Demo OTP validation for both SMS and in-app channels
    if (isValidOtp(typedOtp)) {
      // Success
      handleElderlyToggleOnServer(true, setupElderlyLimit, setupCaregiverName, setupCaregiverPhone);
      setShowElderlySetup(false);
    } else {
      // Failed verification
      setOtpVerificationError("Incorrect code. Please try again.");
    }
  };

  const verifyDisable = async () => {
    if (!typedOtp) {
      setOtpVerificationError("Please enter the One-Time Code from caregiver.");
      return;
    }
    if (!isValidOtp(typedOtp)) {
      setOtpVerificationError("Incorrect code. Please try again or contact your caregiver.");
      return;
    }
    handleElderlyToggleOnServer(false);
    setShowElderlySetup(false);
  };

  // Reset database state on backend
  const handleResetOnServer = async () => {
    try {
      const res = await fetch("/api/reset-state", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAccountsState(data.state);
        setChatbotMessages([
          {
            id: "init-reset",
            sender: "bot",
            text: "Core Shariah banking ledger has been reset. All simulation sandboxes are fully primed.",
            agent: "Orchestrator",
            time: "10:00 AM"
          }
        ]);
        postStatusMessage("Simulation state successfully restored to defaults.", "success");
        setActiveTab("home");
        setShowTransfer(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: When user clicks "Ask companion" on the advice pop-up, it moves them to bot tab and autofills input
  const handleAskAICompanion = (itemName: string, amount: string) => {
    setActiveTab("chat");
    // Append auto prompt
    setChatbotMessages(prev => [
      ...prev,
      {
        id: `ask-item-${Date.now()}`,
        sender: "user",
        text: `Should I buy "${itemName}" for RM ${amount}? Can I get better prices or should I delay this?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Handler: Pre-purchase feedback buttons (Cancel, Proceed)
  const handlePrePurchaseSelectAction = (actionType: "PROCEED" | "CANCEL" | "VAULT", amount: number, itemName: string) => {
    if (actionType === "CANCEL") {
      postStatusMessage(`Wise decision! You've successfully cancelled the impulse buy for: ${itemName}.`, "success");
      setActiveTab("home");
      setShowTransfer(false);
    } else if (actionType === "VAULT") {
      // Locking online price
      fetch("/api/delay-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      })
      .then(res => res.json())
      .then(data => {
        fetchState();
        postStatusMessage(`Success: RM ${amount.toFixed(2)} is locked in Shopee-Delay Vault. Your impulse has cooled.`, "success");
        setActiveTab("home");
        setShowTransfer(false);
      });
    } else {
      // Proceed
      fetch("/api/complete-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          accountNo: "99999999",
          recipientName: itemName,
          reference: "Unsuggested Purchase"
        })
      })
      .then(res => {
        if (res.ok) {
          fetchState();
          postStatusMessage(`Purchase complete for "${itemName}" (RM ${amount}). We've recorded this discretionary debit.`, "warn");
          setActiveTab("home");
          setShowTransfer(false);
        } else {
          postStatusMessage("Failed to initiate. Check your cash limit.", "warn");
        }
      });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 ${accountsState.elderlyMode ? "text-lg font-bold" : "text-sm"}`}>
      
      {/* 1. Header & Navigation Controller */}
      {activeTab === "home" && (
        <Navigation 
          accountsState={accountsState} 
          onElderlyToggle={handleElderlyToggleClick}
          onReset={handleResetOnServer}
        />
      )}

      {/* 2. Global status block/toast */}
      {statusBar && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full animate-fade-in">
          <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-xs ${
            statusBar.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {statusBar.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <p className="text-xs font-semibold">{statusBar.message}</p>
          </div>
        </div>
      )}

      {/* 3. Primary layout context */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        
        {/* LEFT COLUMN: ACTIVE VIEWPORTS PANEL */}
        <div className={activeTab === "home" && !showTransfer && accountsState.elderlyMode ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>

          {/* DYNAMIC CONTENT SWITCHBOARD */}
          {activeTab === "home" && (
            showTransfer ? (
              <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowTransfer(false)} 
                      className="flex items-center gap-1.5 text-slate-600 hover:text-slate-950 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      ← Back to Dashboard
                    </button>
                    <span className="font-display font-black text-sm uppercase text-slate-800 ml-1">Instant Money Send</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded font-mono">NEURA SECURE TRANSFERS</span>
                </div>
                <FundTransfer 
                  accountsState={accountsState} 
                  onRefreshData={fetchState}
                  onUpdateState={setAccountsState}
                  initialPresetMode={transferPresetMode}
                />
              </div>
            ) : qrFlow ? (
              qrFlow === "scan" ? (
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs animate-fade-in font-sans text-slate-800">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setQrFlow(null);
                        }} 
                        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-950 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                      </button>
                      <span className="font-display font-black text-sm uppercase text-slate-800 ml-1">QR Pay Scanner</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" /> SECURE SCAN ACTIVE
                    </span>
                  </div>

                  {qrStep === "scan_view" && (
                    <div className="space-y-6">
                      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center h-80 border border-slate-850 shadow-md">
                        {/* Shimmer laser scanner line */}
                        <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_12px_2px_#10b981] animate-bounce top-12 bottom-12" style={{ animationDuration: "3s" }} />

                        {/* Scanner box corners */}
                        <div className="relative w-52 h-52 border-2 border-dashed border-white/25 rounded-2xl flex items-center justify-center">
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                          
                          <Camera className="w-10 h-10 text-slate-500 opacity-50 animate-pulse" />
                        </div>
                        <p className="mt-4 text-xs font-bold text-slate-300 tracking-wide">Position merchant QR Code within scanner frame</p>
                      </div>

                      {/* Prompt list to test simulator */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-500">Demo Simulation Merchants</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal">Since webcam streaming requires a physical QR code inside the sandbox container, tap one of our pre-authenticated DuitNow merchant presets below to simulate scanning:</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { name: "Lover of Shariah Kopitiam", category: "Food & Beverage", defaultAmount: 15.60, init: "☕" },
                            { name: "99 Speedmart Shariah Cheras", category: "Groceries", defaultAmount: 42.80, init: "🛒" },
                            { name: "Zakat Selangor Darul Ehsan", category: "Charity & Religious", defaultAmount: 50.00, init: "🕌" }
                          ].map((merchant, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQrMerchant(merchant);
                                setQrAmount(merchant.defaultAmount.toFixed(2));
                                setQrReference("QR Pay - " + merchant.name.split(" ")[0]);
                                setQrStep("pay_sheet");
                              }}
                              className="flex items-center gap-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 p-3.5 rounded-2xl transition-all cursor-pointer text-left hover:scale-101 animate-fade-in"
                            >
                              <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">{merchant.init}</span>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[11px] font-black text-slate-805 tracking-tight truncate">{merchant.name}</h5>
                                <p className="text-[10px] text-slate-400 font-normal leading-none">{merchant.category}</p>
                                <span className="text-[11px] font-bold text-indigo-600 block mt-1">RM {merchant.defaultAmount.toFixed(2)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {qrStep === "pay_sheet" && qrMerchant && (
                    <div className="space-y-5 animate-fade-in text-slate-805">
                      {/* Recipient card details */}
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-4.5 flex items-center gap-3.5">
                        <span className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-xl">🏢</span>
                        <div className="flex-1">
                          <span className="text-[9px] bg-indigo-100 text-indigo-805 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">DuitNow QR merchant</span>
                          <h4 className="font-display font-black text-sm text-slate-900 mt-1">{qrMerchant.name}</h4>
                          <p className="text-[10px] text-slate-400 font-normal leading-tight">{qrMerchant.category}</p>
                        </div>
                      </div>

                      {/* Source Account info */}
                      <div className="border border-slate-100 rounded-2xl p-4 space-y-2 bg-white">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-normal">Paying from:</span>
                          <span className="font-bold text-slate-700">Qard Savings Account-i</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[11px] font-mono tracking-tight text-slate-500">No. {accountsState.accountNo}</span>
                          <span className="text-xs font-black text-slate-800">RM {accountsState.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Amount entry */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Amount to Pay (RM)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-black text-lg text-slate-400">RM</span>
                          <input
                            type="number"
                            step="0.01"
                            value={qrAmount}
                            onChange={(e) => setQrAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-white border-2 border-slate-100 focus:border-indigo-505 rounded-2xl w-full py-4.5 pl-12 pr-4 font-display font-black text-2xl text-slate-900 tracking-tight transition-all focus:outline-none"
                          />
                        </div>

                        {/* Amount quick selectors */}
                        <div className="flex gap-2">
                          {[5, 10, 20, 50].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => {
                                const curr = parseFloat(qrAmount) || 0;
                                setQrAmount((curr + amt).toFixed(2));
                              }}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-bold cursor-pointer transition-all active:scale-95"
                            >
                              +RM {amt}
                            </button>
                          ))}
                          <button
                            onClick={() => setQrAmount("")}
                            className="text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-lg text-rose-600 font-bold ml-auto cursor-pointer transition-all active:scale-95"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Reference form */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Payment Reference (Optional)</label>
                        <input
                          type="text"
                          value={qrReference}
                          onChange={(e) => setQrReference(e.target.value)}
                          placeholder="Reference e.g., Lunch"
                          className="bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl w-full py-2.5 px-4 text-xs font-bold font-sans tracking-tight focus:outline-none"
                        />
                      </div>

                      {/* Guardian Audit security details */}
                      <div className="p-3.5 bg-[#f6fcf9] border border-[#d1fad7] rounded-2xl text-[11px] text-emerald-805 leading-relaxed font-sans font-normal">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>NEURA Trust Token Verified</span>
                        </div>
                        Recipient is registered under Bank Negara PayNet registry. Shariah audit status: <strong>BARAKAH CERTIFIED</strong>. Instant debit is safely protected against social-engineering phone scams.
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2 font-display text-xs">
                        <button
                          onClick={() => {
                            setQrStep("scan_view");
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold cursor-pointer transition-all text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const numericAmt = parseFloat(qrAmount);
                            if (isNaN(numericAmt) || numericAmt <= 0) {
                              postStatusMessage("Please specify a valid payment amount.", "warn");
                              return;
                            }
                            if (numericAmt > accountsState.totalBalance) {
                              postStatusMessage("Failed: Insufficient funds in Savings-i.", "warn");
                              return;
                            }

                            // Trigger real transactional debit update on the server (Fully FullStack integration!)
                            fetch("/api/complete-transfer", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                amount: numericAmt,
                                accountNo: "QR-PAY",
                                recipientName: qrMerchant.name,
                                reference: qrReference || "Scan & Pay QR"
                              })
                            })
                            .then(async (res) => {
                              if (res.ok) {
                                postStatusMessage(`Alhamdulillah, payment of RM ${numericAmt.toFixed(2)} to ${qrMerchant.name} was successful.`, "success");
                                await fetchState();
                                setQrStep("success");
                              } else {
                                const text = await res.json();
                                postStatusMessage(text.error || "Payment process failed.", "warn");
                              }
                            })
                            .catch(() => {
                              postStatusMessage("Network error during QR processing.", "warn");
                            });
                          }}
                          className="flex-1 bg-[#d31145] hover:bg-[#b00e3a] text-white py-3.5 rounded-2xl font-bold cursor-pointer transition-all shadow-md text-xs"
                        >
                          Confirm & Pay RM {(parseFloat(qrAmount) || 0).toFixed(2)}
                        </button>
                      </div>
                    </div>
                  )}

                  {qrStep === "success" && qrMerchant && (
                    <div className="space-y-6 text-center py-6 animate-fade-in font-sans text-slate-800">
                      <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-pulse">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <div className="space-y-2 font-sans font-normal">
                        <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-700 px-3 py-1 rounded-full font-mono font-bold tracking-wider uppercase">Transaction Confirmed</span>
                        <h4 className="font-display font-black text-2xl text-slate-900 tracking-tight mt-1">RM {(parseFloat(qrAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                        <p className="text-xs text-slate-500 font-semibold">Funds successfully debited to <strong>{qrMerchant.name}</strong></p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-left text-xs space-y-2 max-w-sm mx-auto font-normal">
                        <div className="flex justify-between">
                          <span className="text-slate-405">Merchant Name:</span>
                          <span className="font-bold text-slate-700">{qrMerchant.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-normal">Payment Reference:</span>
                          <span className="font-mono text-slate-600 truncate max-w-[200px]">{qrReference || "QR Scan-Pay Loop"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-normal">Payment Channel:</span>
                          <span className="font-mono text-slate-600">DuitNow QR Secure API</span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center pt-2 max-w-sm mx-auto">
                        <button
                          onClick={() => {
                            setQrStep("scan_view");
                            setQrAmount("");
                            setQrReference("");
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 py-3 rounded-xl font-bold cursor-pointer transition-all text-xs font-display"
                        >
                          Scan Another
                        </button>
                        <button
                          onClick={() => {
                            setQrFlow(null);
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold cursor-pointer transition-all text-xs shadow-md font-display"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Receive view
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs animate-fade-in font-sans text-slate-800">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-150">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setQrFlow(null);
                        }} 
                        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-950 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                      </button>
                      <span className="font-display font-black text-sm uppercase text-slate-800 ml-1">Receive via QR Code</span>
                    </div>
                    <span className="text-[10px] bg-violet-50 text-violet-700 font-bold px-2.5 py-1 rounded-lg font-mono">
                      DUITNOW QR COMPATIBLE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Column 1: QR frame */}
                    <div className="md:col-span-6 flex flex-col items-center justify-center">
                      {/* DuitNow Pinky frame representation */}
                      <div className="bg-[#cc105c] p-4.5 rounded-[36px] shadow-lg max-w-[270px] w-full text-white text-center space-y-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
                        <span className="text-[10px] font-mono tracking-wide font-black uppercase text-pink-100">DuitNow QR</span>
                        
                        {/* QR Grid Container */}
                        <div className="bg-white p-3.5 rounded-3xl flex flex-col items-center relative gap-1 select-none">
                          <div className="w-44 h-44 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center relative p-1 overflow-hidden">
                            {/* QR code pattern mockup as standard high contrast SVG lines or visual grid lines */}
                            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 leading-none">
                              {/* Left-top anchor */}
                              <rect x="5" y="5" width="22" height="22" fill="currentColor" rx="2" />
                              <rect x="9" y="9" width="14" height="14" fill="white" rx="1" />
                              <rect x="12" y="12" width="8" height="8" fill="currentColor" rx="0.5" />

                              {/* Right-top anchor */}
                              <rect x="73" y="5" width="22" height="22" fill="currentColor" rx="2" />
                              <rect x="77" y="9" width="14" height="14" fill="white" rx="1" />
                              <rect x="80" y="12" width="8" height="8" fill="currentColor" rx="0.5" />

                              {/* Left-bottom anchor */}
                              <rect x="5" y="73" width="22" height="22" fill="currentColor" rx="2" />
                              <rect x="9" y="77" width="14" height="14" fill="white" rx="1" />
                              <rect x="12" y="80" width="8" height="8" fill="currentColor" rx="0.5" />

                              {/* Center Mini logo */}
                              <rect x="42" y="42" width="16" height="16" fill="#cc105c" rx="3" />
                              <polygon points="54,54 46,54" fill="white" />
                              
                              {/* Noise pixels grids */}
                              <rect x="35" y="10" width="8" height="4" fill="currentColor" />
                              <rect x="45" y="5" width="4" height="12" fill="currentColor" />
                              <rect x="55" y="15" width="10" height="4" fill="currentColor" />
                              <rect x="35" y="25" width="4" height="14" fill="currentColor" />
                              <rect x="10" y="35" width="12" height="4" fill="currentColor" />
                              <rect x="25" y="32" width="8" height="8" fill="currentColor" />
                              <rect x="68" y="35" width="15" height="4" fill="currentColor" />
                              <rect x="73" y="42" width="4" height="18" fill="currentColor" />
                              <rect x="60" y="50" width="8" height="4" fill="currentColor" />
                              <rect x="10" y="45" width="4" height="18" fill="currentColor" />
                              <rect x="25" y="55" width="14" height="4" fill="currentColor" />
                              <rect x="35" y="65" width="4" height="12" fill="currentColor" />
                              <rect x="44" y="62" width="12" height="8" fill="currentColor" />
                              <rect x="65" y="65" width="10" height="4" fill="currentColor" />
                              <rect x="65" y="75" width="4" height="14" fill="currentColor" />
                              <rect x="55" y="82" width="12" height="4" fill="currentColor" />
                              <rect x="35" y="85" width="14" height="4" fill="currentColor" />
                              
                              {/* QR Scan anim red overlay line if requesting */}
                              {qrReceiveAmount && <line x1="0" y1="50" x2="100" y2="50" stroke="#cc105c" strokeWidth="2" opacity="0.6" className="animate-pulse" />}
                            </svg>
                          </div>

                          <div className="text-slate-800 text-[10px] font-black uppercase tracking-tight mt-1">
                            {accountsState.userName.substring(0, 22)}
                          </div>
                          {qrReceiveAmount && (
                            <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-full mt-1 font-mono tracking-tight animate-fade-in font-normal">
                              Request: RM {parseFloat(qrReceiveAmount).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-pink-100 font-bold uppercase leading-none pb-1">Scan QR to pay me instantly</p>
                      </div>
                    </div>

                    {/* Column 2: details and settings */}
                    <div className="md:col-span-6 space-y-4 font-normal">
                      <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-2xl space-y-2.5 text-xs text-slate-700 font-sans">
                        <div className="border-b border-slate-200 pb-2 flex gap-1 items-center">
                          <Landmark className="w-4 h-4 text-slate-500" />
                          <h4 className="font-black text-slate-810 font-display">Receiving Bank Details</h4>
                        </div>
                        <div className="space-y-1.5 font-sans leading-none">
                          <div className="flex justify-between font-normal text-slate-600">
                            <span className="text-slate-400 font-normal font-sans">Payee Account:</span>
                            <span className="font-bold text-slate-800">{accountsState.userName}</span>
                          </div>
                          <div className="flex justify-between pt-1 font-normal text-slate-600">
                            <span className="text-slate-400 font-normal font-sans">Account No:</span>
                            <span className="font-mono font-bold text-slate-800">{accountsState.accountNo}</span>
                          </div>
                          <div className="flex justify-between pt-1 font-normal text-slate-600">
                            <span className="text-slate-400 font-normal font-sans">Account Type:</span>
                            <span className="font-bold text-slate-800">Qard Savings-i</span>
                          </div>
                        </div>
                      </div>

                      {/* Customize Request Input */}
                      <div className="space-y-1.5 font-normal text-slate-650 font-sans">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest font-display">Request Custom Amount (Optional)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display font-black text-xs text-slate-400">RM</span>
                          <input
                            type="number"
                            step="0.01"
                            value={qrReceiveAmount}
                            onChange={(e) => setQrReceiveAmount(e.target.value)}
                            placeholder="Specify amount or leave blank"
                            className="bg-white border-2 border-slate-100 focus:border-violet-500 rounded-xl w-full py-2.5 pl-10 pr-4 font-sans font-bold text-xs focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Ethical Shariah Note */}
                      <p className="text-[10px] text-slate-405 leading-normal bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <strong>Islamic Financing Ethics:</strong> QR receivables represent mutual-consent transactions under halal Shariah scopes. Always confirm the source of funds before concluding sales.
                      </p>

                      {/* Copied alert & copy button */}
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => {
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                            navigator.clipboard.writeText(`https://bank4u-qr-claim.bimb-islamic.com.my/pay/u-${accountsState.accountNo}?amt=${qrReceiveAmount || "auto"}`);
                            postStatusMessage("QR Pay receive link successfully copied to your Clipboard!", "success");
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border hover:bg-slate-950 text-white py-3 px-4 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-97 shadow-xs font-display"
                        >
                          {copiedLink ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Copied Link!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-violet-300 shrink-0" /> Copy sharing URL
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            postStatusMessage("Simulation: QR image download initialized. bimb_qr_code_secure_token.png saved to system.", "success");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-97 flex items-center justify-center gap-1.5"
                          title="Download QR"
                        >
                          <Download className="w-4 h-4 text-slate-600 shrink-0" />
                          <span>Save QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* COMPACT FAST ACTION CONTROLS */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2.5 border-b border-rose-50/60">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-bimb-red rounded-full" />
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800">Quick Actions</h3>
                  </div>
                  <span className="text-[9px] text-[#d31145] font-bold bg-[#fff5f7] border border-rose-100 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                    Integrated with NEURA Intelligence Layer
                  </span>
                </div>
                
                <div className="grid grid-cols-2 min-[540px]:grid-cols-5 gap-3">
                  <button 
                    onClick={() => {
                      setTransferPresetMode("transfer");
                      setShowTransfer(true);
                    }} 
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50/40 hover:bg-rose-50 border border-transparent hover:border-bimb-red transition-all text-center cursor-pointer hover:scale-102"
                  >
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mb-1.5 shadow-xs">
                      <ArrowLeftRight className="w-5 h-5 text-bimb-red" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-slate-800 font-display">Transfer</span>
                  </button>

                  <button 
                    onClick={() => {
                      setQrFlow("scan");
                      setQrStep("scan_view");
                      setQrMerchant(null);
                      setQrAmount("");
                      setQrReference("");
                    }} 
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50 border border-transparent hover:border-indigo-400 transition-all text-center cursor-pointer hover:scale-102"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-1.5 shadow-xs">
                      <Scan className="w-5 h-5 text-indigo-700" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-slate-800 font-display">Scan</span>
                  </button>

                  <button 
                    onClick={() => {
                      setQrFlow("receive");
                      setQrReceiveAmount("");
                      setCopiedLink(false);
                    }} 
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-violet-50/40 hover:bg-violet-50 border border-transparent hover:border-violet-400 transition-all text-center cursor-pointer hover:scale-102"
                  >
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-1.5 shadow-xs">
                      <QrCode className="w-5 h-5 text-violet-700" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-slate-800 font-display">Receive</span>
                  </button>

                  <button 
                    onClick={() => {
                      setTransferPresetMode("pay");
                      setShowTransfer(true);
                    }} 
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/40 hover:bg-amber-50 border border-transparent hover:border-amber-400 transition-all text-center cursor-pointer hover:scale-102"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-1.5 shadow-xs">
                      <FileText className="w-5 h-5 text-amber-700" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-slate-800 font-display">Pay Bills</span>
                  </button>

                  <button 
                    onClick={() => {
                      setTransferPresetMode("reload");
                      setShowTransfer(true);
                    }} 
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-50/40 hover:bg-teal-50 border border-transparent hover:border-teal-400 transition-all text-center cursor-pointer hover:scale-102"
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-1.5 shadow-xs">
                      <Smartphone className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-slate-800 font-display">Prepaid Reload</span>
                  </button>
                </div>
              </div>

              {/* SECTION SUB-TABS (Image 1 Style) */}
              <div className="flex border-b border-slate-200/60 gap-6 overflow-x-auto py-1 scrollbar-none font-sans">
                {[
                  { id: "account", name: "ACCOUNT" },
                  { id: "investments", name: "PORTFOLIO" },
                  { id: "history", name: "HISTORY" }
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => {
                      setHomeSubTab(tab.id as any);
                    }}
                    className={`pb-2.5 text-xs font-black tracking-wider border-b-3 whitespace-nowrap uppercase font-display cursor-pointer transition-all ${
                      homeSubTab === tab.id ? "border-bimb-red text-bimb-red font-black" : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {homeSubTab === "account" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Account card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl relative overflow-hidden shadow-sm border border-slate-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bimb-gold/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-[#f9bf15] font-bold uppercase block">NEURA Cognitive Shariah Account</span>
                        <h4 className="text-sm font-semibold font-display tracking-tight text-white/90">Qard Savings Account-i</h4>
                      </div>
                      <Landmark className="w-5 h-5 text-bimb-gold/80" />
                    </div>
                    
                    <div className="my-3">
                      <span className="text-xs text-slate-400 font-semibold block">Total Available Balance</span>
                      <span className="text-3xl font-mono font-bold tracking-tight text-white">
                        RM {accountsState.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-3">
                      <span>No: <strong className="font-mono text-slate-300">{accountsState.accountNo}</strong></span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Shariah Al-Amin</span>
                    </div>
                  </div>
                </div>
              )}

              {homeSubTab === "investments" && (
                <div className="space-y-6 animate-fade-in font-sans text-slate-800">
                  {/* Mandatory Auto-Debits Tracker & Recurring Bills */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-sm">Direct Auto-Debits & Regular Subscriptions</h3>
                        <p className="text-[10px] text-slate-400 font-normal">Pre-authorized recurring commitments & fixed financial responsibilities</p>
                      </div>
                      <button 
                        onClick={() => setShowAddAdModal(!showAddAdModal)}
                        className="text-[10px] bg-[#d31145] hover:bg-[#b00e3a] text-white font-extrabold px-3 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Setup New Regular Billing
                      </button>
                    </div>

                    {/* Simulation card block to Add auto-debit dynamically in UI */}
                    {showAddAdModal && (
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3.5 animate-fade-in text-xs">
                        <div className="flex justify-between items-center bg-white/70 px-2 py-1 rounded-lg">
                          <span className="font-display font-black text-[11px] text-slate-700 uppercase tracking-wider">Setup Direct Debit Shariah Mandate</span>
                          <button 
                            onClick={() => setShowAddAdModal(false)} 
                            className="bg-slate-200/60 hover:bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wide">Provider Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g., Gym Membership, Apple One" 
                              value={newAdName} 
                              onChange={(e) => setNewAdName(e.target.value)}
                              className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs focus:border-slate-850 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wide">Category type</label>
                            <select 
                              value={newAdCategory} 
                              onChange={(e) => setNewAdCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs focus:outline-none"
                            >
                              <option value="Takaful Insurance">Takaful Insurance-i</option>
                              <option value="Lifestyle Subscription">Lifestyle/Streaming</option>
                              <option value="Fixed Utility AutoPay">Fixed Utility AutoPay</option>
                              <option value="Regular Saddaqah / Zakat">Zakat & regular Saddaqah</option>
                              <option value="Financing installment">Financing installment</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wide">Monthly Limit (RM)</label>
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              value={newAdAmount} 
                              onChange={(e) => setNewAdAmount(e.target.value)}
                              className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button 
                            type="button" 
                            onClick={() => {
                              setNewAdName("");
                              setNewAdAmount("");
                              setShowAddAdModal(false);
                            }} 
                            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-3.5 py-1.5 rounded-xl text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              if (!newAdName || !newAdAmount) {
                                postStatusMessage("Warning: Both provider designation and currency limit are mandatory.", "warn");
                                return;
                              }
                              const val = parseFloat(newAdAmount);
                              if (isNaN(val) || val <= 0) {
                                postStatusMessage("Warning: Please supply a genuine non-zero debit amount.", "warn");
                                return;
                              }
                              setAutoDebits([
                                ...autoDebits,
                                {
                                  id: `ad-${Date.now()}`,
                                  name: newAdName,
                                  category: newAdCategory,
                                  amount: val,
                                  frequency: "Monthly",
                                  status: "Active",
                                  nextDate: "2026-06-05",
                                  provider: newAdName
                                }
                              ]);
                              postStatusMessage(`Shariah autodebit billing mandate for ${newAdName} successfully established at RM ${val.toFixed(2)}/month.`, "success");
                              setNewAdName("");
                              setNewAdAmount("");
                              setShowAddAdModal(false);
                            }} 
                            className="bg-slate-900 border hover:bg-slate-950 text-white font-extrabold px-4 py-1.5 rounded-xl text-[10px] cursor-pointer transition-all"
                          >
                            Authorize Mandate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Layout auto debit lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {autoDebits.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50/60 border border-slate-100/90 rounded-2xl flex flex-col justify-between hover:border-slate-200/50 transition-all select-none">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">{item.category}</span>
                              <h4 className="text-xs font-black text-slate-800 mt-2 leading-tight">{item.name}</h4>
                              <p className="text-[9px] text-slate-400 font-normal mt-0.5 leading-none">Billed by: {item.provider}</p>
                            </div>

                            <div className="text-right">
                              <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider inline-block ${
                                item.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {item.status}
                              </span>
                              <span className="block text-[8px] text-slate-400 font-bold uppercase font-mono tracking-widest mt-1.5">Recurring {item.frequency}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/30 pt-3.5 mt-3.5">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-normal uppercase tracking-wide">Charge Limit:</span>
                              <span className="font-mono text-xs font-black text-slate-900">RM {item.amount.toFixed(2)}</span>
                            </div>

                            <div className="flex gap-1.5">
                              {item.status === "Active" ? (
                                <button
                                  onClick={() => {
                                    setAutoDebits(autoDebits.map(d => d.id === item.id ? { ...d, status: "Paused" as const, nextDate: "Mandate Suspended" } : d));
                                    postStatusMessage(`Direct billing for ${item.name} paused. Charges are stopped until resumed.`, "success");
                                  }}
                                  className="text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-850 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer animate-fade-in"
                                >
                                  Pause Pay
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAutoDebits(autoDebits.map(d => d.id === item.id ? { ...d, status: "Active" as const, nextDate: "2026-06-01" } : d));
                                    postStatusMessage(`Direct billing for ${item.name} resumed successfully.`, "success");
                                  }}
                                  className="text-[10px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-850 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer animate-fade-in"
                                >
                                  Activate
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setAutoDebits(autoDebits.filter(d => d.id !== item.id));
                                  postStatusMessage(`Revoked Direct-Debit mandate for ${item.name}. Plan deleted.`, "warn");
                                }}
                                className="text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-100 text-[#d31145] px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          {/* Extra Shariah compliance assurance */}
                          <div className="mt-2.5 bg-[#f6fcf9] border border-[#d1fad7] p-2 rounded-xl text-[9px] text-emerald-800 leading-tight">
                            🛡️ <strong>Certified Debit:</strong> Shariah-compliant mutual agreement terms enabled. Next charge: <span className="font-mono font-bold text-slate-705">{item.status === "Active" ? item.nextDate : "Suspended"}</span>.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shariah Financing Contracts */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-1.5"><Landmark className="w-4 h-4 text-bimb-red" /><h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-500">Shariah Contracts & Financing-i</h3></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accountsState.financingAccounts.map((fin) => (
                        <div key={fin.id} className="p-3.5 bg-[#fffdfa] border border-[#f5ebdb] rounded-2xl flex flex-col justify-between font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">{fin.type}</span>
                            <span className="bg-amber-50 border border-[#f5ebdb] text-[#b45309] text-[9px] font-bold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Tawarruq Mutual Contract</span>
                          </div>
                          
                          <div className="flex items-baseline justify-between mt-3">
                            <span className="text-[10px] text-slate-400 font-semibold">Remaining amount:</span>
                            <span className="font-mono text-xs font-bold text-slate-700">RM {fin.remaining.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f5ebdb]/50 text-[10px]">
                            <span className="text-slate-405">Next payment:</span>
                            <span className="font-mono font-bold text-slate-900">RM {fin.nextPayment.toFixed(2)}/month</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {homeSubTab === "history" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Transactions list feed */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4 font-sans text-slate-800">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <div>
                        <h3 className="font-display font-medium text-slate-905 text-sm">Recent Transaction History</h3>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">Live transaction statement audit ready</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded font-mono uppercase">Live Sync</span>
                    </div>

                    {/* Premium Filter Controls Bar */}
                    <div className="bg-slate-50/70 border border-slate-100/80 p-3.5 rounded-2xl gap-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                      {/* Date Filter */}
                      <div className="space-y-1 w-full md:w-auto">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">Date Range</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { value: "all", label: "All Time" },
                            { value: "1", label: "1 Month" },
                            { value: "3", label: "3 Months" },
                            { value: "9", label: "9 Months" },
                            { value: "12", label: "12 Months" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setHistoryDateFilter(opt.value as any)}
                              className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                historyDateFilter === opt.value
                                  ? "bg-[#d31145] text-white shadow-xs"
                                  : "bg-white hover:bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div className="space-y-1 w-full md:w-auto shrink-0 md:border-l md:border-slate-200 md:pl-4">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-display">Tx Flow</span>
                        <div className="flex gap-1">
                          {[
                            { value: "all", label: "All" },
                            { value: "income", label: "Income" },
                            { value: "expense", label: "Expense" },
                            { value: "cancelled_refunded", label: "AI Blocked / Revoked" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setHistoryTypeFilter(opt.value as any)}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                historyTypeFilter === opt.value
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "bg-white hover:bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
 
                    <div className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = accountsState.transactions.filter((tx) => {
                          // Type filter matching
                          if (historyTypeFilter === "income" && tx.amount <= 0) return false;
                          if (historyTypeFilter === "expense" && (tx.amount >= 0 || tx.status === "cancelled" || tx.status === "refunded")) return false;
                          if (historyTypeFilter === "cancelled_refunded" && tx.status !== "cancelled" && tx.status !== "refunded") return false;
 
                          // Date filter matching (Base system date is May 22, 2026. Let's make sure it handles any years properly too)
                          if (historyDateFilter !== "all") {
                            const today = new Date("2026-05-22"); // Base reference aligned with mock seeds
                            const txDate = new Date(tx.date);
                            const diffTime = today.getTime() - txDate.getTime();
                            const diffDays = diffTime / (1000 * 60 * 60 * 24);
                            const limitMonths = parseInt(historyDateFilter, 10);
                            const limitDays = limitMonths * 30.5;
                            if (diffDays > limitDays) return false;
                          }
                          return true;
                        });
 
                        if (filtered.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-400 font-sans text-xs animate-fade-in font-normal flex flex-col items-center justify-center gap-1.5">
                              <span>⚠️ No transactions match your active filter range.</span>
                              <button 
                                onClick={() => {
                                  setHistoryDateFilter("all");
                                  setHistoryTypeFilter("all");
                                }} 
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                              >
                                Reset Filters
                              </button>
                            </div>
                          );
                        }
 
                        return filtered.map((tx) => (
                          <div key={tx.id} className="flex flex-col py-3.5 first:pt-0 last:pb-0 select-none hover:bg-slate-50/40 rounded-xl px-1.5 transition-all">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                                  tx.status === "cancelled"
                                    ? "bg-slate-100 text-slate-500 border border-slate-200"
                                    : tx.status === "refunded"
                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                    : tx.amount < 0 
                                    ? "bg-rose-50 text-bimb-red border border-rose-100" 
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}>
                                  {tx.status === "cancelled" ? "❌" : tx.status === "refunded" ? "🔄" : tx.category === "Transfer" ? "💸" : tx.amount < 0 ? "🛍️" : "💼"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-xs font-bold ${tx.status === "cancelled" ? "text-slate-400 line-through font-medium" : "text-slate-800"}`}>
                                      {tx.description}
                                    </p>
                                    {tx.status === "cancelled" && (
                                      <span className="text-[8px] bg-red-50 text-red-750 border border-red-200 rounded px-1.5 py-0.5 uppercase tracking-wider font-extrabold font-mono">
                                        Blocked By Shield
                                      </span>
                                    )}
                                    {tx.status === "refunded" && (
                                      <span className="text-[8px] bg-amber-55 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 uppercase tracking-wider font-extrabold font-mono">
                                        Refunded cooling-period
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.date} • Category: {tx.category}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-mono text-xs font-bold ${
                                  tx.status === "cancelled" 
                                    ? "text-slate-400 line-through" 
                                    : tx.status === "refunded"
                                    ? "text-slate-500"
                                    : tx.amount < 0 
                                    ? "text-slate-900" 
                                    : "text-emerald-700"
                                }`}>
                                  {tx.status === "cancelled" ? "Blocked (RM 0.00)" : `${tx.amount < 0 ? "-" : "+"}RM ${Math.abs(tx.amount).toFixed(2)}`}
                                </span>
                                {tx.status === "refunded" && (
                                  <span className="block text-[8px] text-emerald-600 font-extrabold uppercase mt-0.5">+RM {Math.abs(tx.amount).toFixed(2)} Recredited</span>
                                )}
                              </div>
                            </div>
 
                            {/* Reasoning sub-layer for security and behavioral actions */}
                            {(tx.status === "cancelled" || tx.status === "refunded") && tx.reason && (
                              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed animate-fade-in font-medium flex flex-col sm:flex-row sm:items-center gap-1.5">
                                <span className="bg-[#d31145]/10 text-[#d31145] text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md self-start shrink-0">
                                  NEURA Copilot logs
                                </span>
                                <span>{tx.reason}</span>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}

          {activeTab === "analysis" && (
            <PredictiveLayer 
              accountsState={accountsState} 
              onAskAICompanion={handleAskAICompanion}
              onSelectAction={handlePrePurchaseSelectAction}
            />
          )}

          {activeTab === "scanner" && (
            <RealityLens 
              accountsState={accountsState} 
              onRefreshData={fetchState}
              onPostStatusMessage={postStatusMessage}
            />
          )}

          {activeTab === "chat" && (
            <AgentChatbot 
              accountsState={accountsState} 
              chatbotMessages={chatbotMessages}
              onAddMessage={(msg) => setChatbotMessages(prev => [...prev, msg])}
              onRefreshData={fetchState}
            />
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white">
                      MZ
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-display text-slate-900">{accountsState.userName}</h2>
                      <p className="text-xs text-slate-400 mt-1 font-mono">Account No: {accountsState.accountNo}</p>
                      <span className="inline-block mt-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full shadow-xs tracking-wider">
                        ★ Premium Shariah Al-Amin Status
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-start sm:items-end gap-1 font-mono text-xs">
                    <span className="text-slate-400 font-sans font-semibold">Total Networth</span>
                    <span className="text-xl font-bold text-indigo-600">RM {accountsState.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Profile Grid Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  {/* Card 1: Safety & Caregiver Mode */}
                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                      <span>Safety Lock (Elderly Guardian Guard)</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Enable parent safety lock on high-volume transactions. All transfers exceeding your limit require Sarafina's live tap confirmation.
                    </p>

                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-700">Elderly Protection:</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${accountsState.elderlyMode ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                          {accountsState.elderlyMode ? "ACTIVE" : "OFF"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleElderlyToggleClick(!accountsState.elderlyMode)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                          accountsState.elderlyMode ? "bg-rose-500" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            accountsState.elderlyMode ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {accountsState.elderlyMode && (
                      <div className="pt-2 border-t border-slate-200/50 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Designated Caregiver Name:</span>
                          <span className="font-bold text-slate-900">{accountsState.caregiverName}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Caregiver Phone No:</span>
                          <span className="font-mono font-bold text-slate-900">{accountsState.caregiverPhone}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Safe Transfer Limit Threshold:</span>
                          <span className="font-bold text-rose-600">RM {accountsState.elderlyLimit.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Regulatory & Banking Specs */}
                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>Regulatory Audits & Compliance</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2">
                        Certified Shariah advisory compliance ledger mapping neural models to Tawarruq arrangements and Islamic finance ethics.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600 gap-1/5">
                      <div className="flex justify-between items-center">
                        <span>PIDM Protection Status:</span>
                        <span className="font-bold text-slate-850">Protected up to RM250k</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>AMLA Eviction Audit Feed:</span>
                        <span className="text-emerald-600 font-bold">100% SECURE</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Specialist AI Routing:</span>
                        <span className="font-bold text-slate-700">Orchestrator v4.2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cognitive Engine Sandbox controls (Reset State) */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Cognitive Sandbox Controls</h3>
                    <p className="text-xs text-slate-500 mt-1">Reset simulation state database variables back to original baseline default settings.</p>
                  </div>
                  <button
                    onClick={handleResetOnServer}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer px-5 py-3 rounded-xl text-xs transition-colors border border-slate-800 shadow-sm whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Demonstration Baseline State
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: QUICK METRICS & SYSTEM DETAILS */}
        {activeTab === "home" && !showTransfer && accountsState.elderlyMode && (
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Elderly Instructions */}
            <div className="bg-[#fff9ea] border border-[#f5dfb8] rounded-3xl p-5 space-y-3.5 text-[#854d0e] animate-fade-in duration-150">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                <h3 className="font-display font-extrabold text-[#713f12] text-sm">Mode Keselamatan Aktif</h3>
              </div>
              <p className="text-xs leading-relaxed font-bold">
                Large, easy-to-read controls are enabled. We screen every transfer to block SMS and WhatsApp scams. Your caregiver is ready to review large transfers.
              </p>
              <div className="text-[10px] text-[#a16207]">
                Connected caregiver: <strong>{accountsState.caregiverName}</strong> • {accountsState.caregiverPhone}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Persistent Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-[0_-8px_35px_rgb(0,0,0,0.08)] animate-fade-in-up select-none">
        <div className="max-w-xl mx-auto flex items-end justify-between">
          {[
            { id: "analysis", label: "INSIGHT", icon: <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> },
            { id: "chat", label: "AI ASSIST", icon: <Sparkles className="w-4 h-4 md:w-5 md:h-5" /> },
            { id: "home", label: "BANK4U HOME", icon: <Home className="w-5 h-5 text-white" /> },
            { id: "scanner", label: "SCAN TO KNOW", icon: <Camera className="w-4 h-4 md:w-5 md:h-5" /> },
            { id: "profile", label: "PROFILE", icon: <User className="w-4 h-4 md:w-5 md:h-5" /> }
          ].map((item) => {
            const isHome = item.id === "home";
            const isActive = activeTab === item.id;
            
            if (isHome) {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab("home");
                    setShowTransfer(false);
                  }}
                  className="flex flex-col items-center justify-center -translate-y-2 relative cursor-pointer group shrink-0 mx-2"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-300 transform group-hover:scale-110 ${
                    isActive 
                      ? "bg-[#d31145] text-white shadow-rose-500/45 scale-105 animate-[pulse_2s_infinite]" 
                      : "bg-[#e11d48] text-white shadow-rose-500/25"
                  }`}>
                    <Home className="w-5.5 h-5.5 text-white" />
                  </div>
                  <span className={`text-[8.5px] font-black tracking-wider uppercase text-center mt-1 transition-all ${
                    isActive ? "text-[#d31145] font-black scale-105" : "text-slate-500"
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                }}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? "text-[#d31145] scale-105" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-rose-50 text-[#d31145]" : "bg-transparent text-slate-400"
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[8px] md:text-[9.5px] font-bold tracking-tight uppercase text-center font-display transition-all ${
                  isActive ? "text-[#d31145] font-black" : "text-slate-400"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Elderly Guardian Setup Modal Wrapper */}
      {showElderlySetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto w-full h-full">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in text-slate-800">
            
            {/* Compact Header */}
            <div className="bg-[#d31145] text-white px-4 py-3 flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-white fill-white/20 animate-pulse" />
                <div>
                  <h3 className="font-display font-black text-sm text-white">NEURA Elderly Safeguard</h3>
                  <p className="text-[9px] text-rose-100 font-medium">Active spend protection constraints & caregiver handshake</p>
                </div>
              </div>
              <button 
                onClick={() => setShowElderlySetup(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full text-xs transition-all cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container Body */}
                    <div className="overflow-y-auto flex-1 p-4 space-y-3 text-xs">
                      <div id="recaptcha-container" />
              
              {setupStep === "form" ? (
                /* Phase 1: Input details */
                <div className="space-y-3 font-sans">
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-rose-850">
                    <Shield className="w-4 h-4 text-[#d31145] shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-normal text-slate-600 font-sans">
                      <span className="font-bold text-rose-900 block font-sans">Caregiver Safeguard Active</span>
                      Payments exceeding your custom limit will hold securely in quarantine until approved by your caregiver.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Caregiver Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 font-sans">Tied Caregiver Name</label>
                      <input 
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-sans focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800 font-semibold"
                        value={setupCaregiverName}
                        onChange={(e) => setSetupCaregiverName(e.target.value)}
                        placeholder="e.g. Sarafina"
                        required
                      />
                    </div>

                    {/* Caregiver Phone & Relationship */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 font-sans">Mobile Phone No.</label>
                        <input 
                          type="text"
                          className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800 font-semibold"
                          value={setupCaregiverPhone}
                          onChange={(e) => setSetupCaregiverPhone(normalizeMalaysiaPhone(e.target.value))}
                          placeholder="+60123456789"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 font-sans">Relationship</label>
                        <select 
                          className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800 font-semibold bg-white"
                          value={setupRelationship}
                          onChange={(e) => setSetupRelationship(e.target.value)}
                        >
                          <option value="Caregiver">Caregiver</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child (Anak)</option>
                          <option value="Guardian">Legal Guardian</option>
                        </select>
                      </div>
                    </div>

                    {/* Limit Threshold */}
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-slate-500 font-sans">Safe Spending Limit</label>
                        <span className="text-[8px] text-slate-400 font-mono">Quarantines transactions exceeding this</span>
                      </div>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">RM</span>
                        <input 
                          type="number"
                          className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800"
                          value={setupElderlyLimit || ""}
                          onChange={(e) => setSetupElderlyLimit(parseFloat(e.target.value) || 0)}
                          min="1"
                          placeholder="300.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Primary Channel */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 font-sans">Verification Channel</label>
                      <select 
                        className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800 bg-white"
                        value={setupAlertChannel}
                        onChange={(e) => setSetupAlertChannel(e.target.value)}
                      >
                        <option value="" disabled>Select verification channel</option>
                        <option value="Integrated Banking or E-Wallet App">📱 Neura Integrated Banking or E-Wallet App</option>
                        <option value="SMS OTP">💬 OTP to caregiver phone</option>
                      </select>
                      {setupAlertChannel === "Integrated Banking or E-Wallet App" && (
                        <p className="text-[9px] text-slate-500 mt-1">
                          If the caregiver has Neura integrated into their banking or e-wallet app, they receive an in-app approval notification directly.
                        </p>
                      )}
                      {setupAlertChannel === "SMS OTP" && (
                        <p className="text-[9px] text-slate-500 mt-1">
                          OTP is sent to the caregiver phone and must be entered here to tie or untie caregiver, change the payment limit, or approve over-limit transactions.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={() => setShowElderlySetup(false)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleGetCode}
                        className="px-4 py-2 bg-[#d31145] hover:bg-[#b00e3a] text-white font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span>Get Code</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                </div>
              ) : setupStep === "handshake" ? (
                /* Phase 2: Caregiver Verification Handshake Activation with OTP input */
                <div className="space-y-3 font-sans">
                  <div className="text-center space-y-1 shrink-0">
                    <div className="w-9 h-9 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-bimb-red">
                      <Smartphone className="w-5 h-5 text-[#d31145] animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xs text-slate-800">Caregiver One-Time Code Needed</h4>
                      <p className="text-[9px] text-slate-400 font-sans">
                        Sent safety token to your caregiver via <span className="font-semibold text-[#d31145]">{setupAlertChannel}</span>
                      </p>
                      {setupAlertChannel === "Integrated Banking or E-Wallet App" && (
                        <p className="text-[9px] text-slate-400 font-sans">
                          Approval will arrive inside the caregiver's Neura-integrated banking or e-wallet app for direct confirmation.
                        </p>
                      )}
                      {setupAlertChannel === "SMS OTP" && (
                        <p className="text-[9px] text-slate-400 font-sans">
                          An OTP is delivered to the caregiver phone; it must be entered here to activate the guardian link and approve over-limit transfers.
                        </p>
                      )}
                    </div>
                  </div>

                  {setupAlertChannel === "Integrated Banking or E-Wallet App" && (
                    <>
                      {/* Tied Caregiver End Simulated Screen Overlay - Only for In-App Notifications */}
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 text-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 blur-xl rounded-full" />
                        
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-[7.5px] font-black tracking-widest text-[#d31145] font-mono uppercase">Caregiver Phone Preview</span>
                          <span className="text-[7px] bg-slate-900 text-slate-400 font-bold px-1 py-0.5 rounded border border-slate-800 font-mono">
                            IN-APP
                          </span>
                        </div>

                        <div className="space-y-1 font-sans text-[10px]">
                          <p className="text-slate-350 leading-tight">
                            Hi <span className="font-bold text-white">{setupCaregiverName}</span>, your parent has linked you as Guardian and requested to set up safe spend limit of <span className="font-bold text-rose-350 font-mono">RM {setupElderlyLimit.toFixed(2)}</span>.
                          </p>
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-rose-955/40 space-y-2 font-sans">
                            <span className="text-[8px] font-bold uppercase tracking-wider block text-slate-500 font-mono">Approval Options</span>
                            <div className="flex gap-2">
                              <button className="flex-1 text-[10px] font-bold text-white bg-emerald-600/80 hover:bg-emerald-600 py-1.5 px-2 rounded border border-emerald-500/30 transition-colors">
                                ✓ Approve
                              </button>
                              <button className="flex-1 text-[10px] font-bold text-white bg-red-600/80 hover:bg-red-600 py-1.5 px-2 rounded border border-red-500/30 transition-colors">
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {setupAlertChannel === "SMS OTP" && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 text-blue-850">
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-normal text-slate-600 font-sans">
                        <span className="font-bold text-blue-900 block font-sans">SMS OTP Sent</span>
                        A 6-digit code has been delivered to the caregiver's phone. Request them to share the code here.
                      </p>
                    </div>
                  )}

                  {/* User validation code input field (Parent Screen Side) */}
                  <div className="space-y-1 font-sans">
                    <label className="block text-[10px] font-bold text-slate-600">
                      Enter the 6-Digit Code from Caregiver
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔑</span>
                      <input 
                        type="text"
                        className="w-full text-xs font-mono tracking-widest text-center font-bold border border-slate-200 rounded-xl px-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800"
                        maxLength={6}
                        value={typedOtp}
                        onChange={(e) => {
                          setTypedOtp(e.target.value.trim());
                          setOtpVerificationError("");
                        }}
                        placeholder="• • • • • •"
                      />
                    </div>

                    {otpVerificationError && (
                      <p className="text-[10px] text-[#d31145] font-bold">
                        ⚠️ {otpVerificationError}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={() => setSetupStep("form")}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer font-sans"
                    >
                      ← Back
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!typedOtp) {
                          setOtpVerificationError("Please enter the One-Time Code from caregiver.");
                          return;
                        }
                        if (!isValidOtp(typedOtp)) {
                          setOtpVerificationError("Incorrect code. Please try again or contact your caregiver.");
                          return;
                        }
                        // Success! Verify and activate toggle on server
                        handleElderlyToggleOnServer(true, setupElderlyLimit, setupCaregiverName, setupCaregiverPhone);
                        setShowElderlySetup(false);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer font-sans"
                    >
                      Verify &amp; Activate
                    </button>
                  </div>
                </div>
              ) : (
                /* Phase 3: "disable_verify" state representing deactivating toggle verification */
                <div className="space-y-3 font-sans">
                  <div className="text-center space-y-1 shrink-0">
                    <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                      <Lock className="w-5 h-5 text-amber-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xs text-slate-800">Caregiver Consent Mandated</h4>
                      <p className="text-[9px] text-slate-400 font-sans">
                        Disabling safeguard protection requires caregiver authorization.
                      </p>
                    </div>
                  </div>

                  {setupAlertChannel === "Integrated Banking or E-Wallet App" && (
                    <>
                      {/* Simulated Smartphone interface showing the Turn Off confirmation request - Only for In-App */}
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 text-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-xl rounded-full" />
                        
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 font-sans">
                          <span className="text-[7.5px] font-black tracking-widest text-[#d31145] font-mono uppercase">Caregiver Phone Preview</span>
                          <span className="text-[7px] bg-slate-900 text-amber-400 font-bold px-1 py-0.5 rounded border border-slate-800 font-mono">
                            IN-APP
                          </span>
                        </div>

                        <div className="space-y-1 font-sans text-[10px]">
                          <p className="text-slate-350 leading-tight">
                            Hi <span className="font-bold text-white">{accountsState.caregiverName}</span>, your parent requested to deactivate the Elderly Protection layer.
                          </p>
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-955/40 space-y-2 font-sans">
                            <span className="text-[8px] font-bold uppercase tracking-wider block text-slate-500 font-mono">Approval Options</span>
                            <div className="flex gap-2">
                              <button className="flex-1 text-[10px] font-bold text-white bg-emerald-600/80 hover:bg-emerald-600 py-1.5 px-2 rounded border border-emerald-500/30 transition-colors">
                                ✓ Approve
                              </button>
                              <button className="flex-1 text-[10px] font-bold text-white bg-red-600/80 hover:bg-red-600 py-1.5 px-2 rounded border border-red-500/30 transition-colors">
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {setupAlertChannel === "SMS OTP" && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-amber-850">
                      <Smartphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-normal text-slate-600 font-sans">
                        <span className="font-bold text-amber-900 block font-sans">Deactivation Code Required</span>
                        A 6-digit code has been delivered to the caregiver's phone to confirm disabling safeguard protection.
                      </p>
                    </div>
                  )}

                  {/* Code verification input */}
                  <div className="space-y-1 font-sans">
                    <label className="block text-[10px] font-bold text-slate-600">
                      Enter Caregiver's Deactivation Code
                    </label>
                    <div className="relative font-sans">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔑</span>
                      <input 
                        type="text"
                        className="w-full text-xs font-mono tracking-widest text-center font-bold border border-slate-200 rounded-xl px-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#d31145] text-slate-800"
                        maxLength={6}
                        value={typedOtp}
                        onChange={(e) => {
                          setTypedOtp(e.target.value.trim());
                          setOtpVerificationError("");
                        }}
                        placeholder="• • • • • •"
                      />
                    </div>

                    {otpVerificationError && (
                      <p className="text-[10px] text-[#d31145] font-bold font-sans">
                        ⚠️ {otpVerificationError}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 font-sans">
                    <button 
                      type="button"
                      onClick={() => setShowElderlySetup(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button 
                      type="button"
                      onClick={verifyDisable}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 4. Humble footer */}
      <footer className="bg-slate-50 border-t border-slate-100 pt-7 pb-8 text-center text-[10px] text-slate-400 select-none">
        <div className="max-w-7xl mx-auto px-4 space-y-1 font-sans">
          <p className="font-bold text-slate-500">Bank4U Demonstration Portal • Enhanced with NEURA Cognitive AI Safeguard Layer</p>
          <p className="text-slate-400">© 2026 Bank4U Demo Financial. Powered by integrated NEURA active machine-learning protection sandbox.</p>
        </div>
      </footer>

    </div>
  );
}
