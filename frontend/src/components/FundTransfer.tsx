import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Clock, AlertTriangle, CheckCircle, XCircle, Zap, 
  HelpCircle, UserCheck, ShieldCheck, Heart, ArrowRight, ArrowLeftRight,
  Smartphone, Fingerprint, Book, Globe, Building, CreditCard, Coins, Gift, FileText, ChevronRight, User, Shield, Sparkles
} from "lucide-react";
import { AccountsState } from "../types";

interface FundTransferProps {
  accountsState: AccountsState;
  onRefreshData: () => void;
  onUpdateState: (state: AccountsState) => void;
  initialPresetMode?: "transfer" | "pay" | "reload";
}

type FundTransferStep = 
  | "select_method"     // Choose Channel (Account, Mobile, NRIC, etc.)
  | "duitnow_details"   // Form to Enter Recipient Details
  | "pay_select"        // Choose Sadaqa, Bill, JomPAY, Zakat, etc.
  | "pay_form"          // Enter reference, payee, bill details
  | "reload_form"       // Enter mobile number & topup value
  | "select"            // Original select favourite page
  | "details"           // Original amount & reference entry
  | "secure_bimb"       // NEURA authorization gateway
  | "fraud_screening"   // NEW: Fraud screening in progress
  | "intercept"         // Warning delay timer cooling delay
  | "neura_lock_info";  // NEURA Secure protection audit card

export default function FundTransfer({ 
  accountsState, 
  onRefreshData, 
  onUpdateState,
  initialPresetMode = "transfer"
}: FundTransferProps) {
  const [step, setStep] = useState<FundTransferStep>("select_method");
  const [selectedChannel, setSelectedChannel] = useState<string>("Account");

  const [recipient, setRecipient] = useState({
    name: "Aliff Harith",
    accountNo: "150123456789",
    bank: "Maybank",
    avatar: "AH"
  });

  const [form, setForm] = useState({
    amount: "150",
    reference: "Weekly Allowance",
    customAccountNo: "",
    customBank: "Touch n Go",
    transferType: "Fund Transfer to Savings/Current",
    transferMode: "DuitNow Transfer"
  });

  // Pay/Bills Form States
  const [payeeCategory, setPayeeCategory] = useState<string>("Pay Bill");
  const [billBiller, setBillBiller] = useState<string>("TNB (Tenaga Nasional)");
  const [billRefNo, setBillRefNo] = useState<string>("");

  // Mobile Reload Form States
  const [reloadOperator, setReloadOperator] = useState<string>("Maxis Hotlink");
  const [reloadNumber, setReloadNumber] = useState<string>("");
  const [reloadAmount, setReloadAmount] = useState<string>("30");

  // Security Interception states
  const [coolingSeconds, setCoolingSeconds] = useState(0);
  const [coolingProgress, setCoolingProgress] = useState(100);
  const [interceptReason, setInterceptReason] = useState("");
  const [isCanceledBySafety, setIsCanceledBySafety] = useState(false);
  const [muleData, setMuleData] = useState<any>(null);
  const [transferError, setTransferError] = useState("");
  const [successTx, setSuccessTx] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fraud Screening States (NEW)
  const [fraudScreening, setFraudScreening] = useState<{
    riskLevel: "GREEN" | "AMBER" | "RED";
    riskScore: number;
    reason: string;
    warnings: { en: string; ms: string };
    actionRequired: string;
    quarantineId?: string;
  } | null>(null);
  const [fraudOverrideVerification, setFraudOverrideVerification] = useState("");
  const [fraudOverrideError, setFraudOverrideError] = useState("");

  // Caregiver states (for Elderly protection limit)
  const [caregiverApprovalWait, setCaregiverApprovalWait] = useState(false);
  const [caregiverOtpCode, setCaregiverOtpCode] = useState("");
  const [caregiverOtpInput, setCaregiverOtpInput] = useState("");
  const [caregiverOtpError, setCaregiverOtpError] = useState("");
  const [interceptMode, setInterceptMode] = useState<"mule" | "blacklist">("mule");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Simulation handlers for review demos
  const triggerMuleDemo = () => {
    setRecipient({
      name: "Syndicate Cashout Hub",
      accountNo: "8888888888",
      bank: "Touch n Go eWallet",
      avatar: "👤"
    });
    setForm({
      amount: "850",
      reference: "Urgent Offshore Investment Return",
      customAccountNo: "8888888888",
      customBank: "Touch n Go eWallet",
      transferType: "DuitNow eWallet Transfer",
      transferMode: "DuitNow Transfer"
    });
    setMuleData({
      accountNo: "8888888888",
      bank: "Touch n Go eWallet",
      holder: "Syndicate Cashout Hub",
      scamSpikes: 15,
      riskScore: 0.95
    });
    setInterceptMode("mule");
    setInterceptReason(
      "Our system has detected that '8888888888' is a designated financial mule node interconnected with offshore IP addresses. Spikes of incoming transfers from elderly users were recorded today."
    );
    startCoolingCounter(60);
    setStep("intercept");
  };

  const triggerBlacklistDemo = () => {
    setRecipient({
      name: "Mohamad Scam Bin Ali",
      accountNo: "9999999999",
      bank: "Maybank",
      avatar: "👤"
    });
    setForm({
      amount: "1500",
      reference: "Pre-Approved Crypto Mining Licence Package",
      customAccountNo: "9999999999",
      customBank: "Maybank",
      transferType: "Fund Transfer to Savings/Current",
      transferMode: "DuitNow Transfer"
    });
    setMuleData({
      accountNo: "9999999999",
      bank: "Maybank",
      holder: "Mohamad Scam Bin Ali",
      scamSpikes: 24,
      riskScore: 0.99
    });
    setInterceptMode("blacklist");
    setInterceptReason(
      "This criminal registry match is flagged under CCID Reference PDRM-90218-MAL. Outstanding police reports confirm high volumes of online scam sales. NEURA advises IMMEDIATE transaction cancellation."
    );
    startCoolingCounter(60);
    setStep("intercept");
  };

  const triggerElderlyDemo = () => {
    fetch("/api/toggle-elderly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true, limit: 300 })
    }).then(() => {
      onRefreshData();
    });
    setRecipient({
      name: "Aliff Harith",
      accountNo: "150123456789",
      bank: "Maybank",
      avatar: "AH"
    });
    setForm({
      amount: "450",
      reference: "Emergency Cash Allowance",
      customAccountNo: "150123456789",
      customBank: "Maybank",
      transferType: "Fund Transfer to Savings/Current",
      transferMode: "DuitNow Transfer"
    });
    setStep("secure_bimb");
    setCaregiverApprovalWait(true);
  };

  useEffect(() => {
    if (initialPresetMode === "pay") {
      setStep("pay_select");
    } else if (initialPresetMode === "reload") {
      setStep("reload_form");
    } else {
      setStep("select_method");
    }
  }, [initialPresetMode]);

  const FAVORITES = [
    { name: "Dad (DuitNow)", bank: "Touch n Go", accountNo: "8888888888", avatar: "👨", style: "border-rose-100 bg-rose-50/50" }, // Registered Mule mock
    { name: "Sarafina (Sara)", bank: "CIMB Bank", accountNo: "121234432121", avatar: "👩", style: "border-teal-100 bg-teal-50/50" },
    { name: "Abang Zul", bank: "Maybank", accountNo: "152011119021", avatar: "👦", style: "border-slate-100 bg-slate-50/50" },
    { name: "Mohamad Scam", bank: "CIMB Bank", accountNo: "9999999999", avatar: "👤", style: "border-rose-100 bg-rose-50/50" } // Registered Mule mock
  ];

  const PAY_BILL_SERVICES = [
    { id: "sadaqa", name: "Sadaqa (Mosque Fund)", icon: <Gift className="w-5 h-5 text-rose-500" /> },
    { id: "bill", name: "Pay Bill (TNB, Syabas, etc)", icon: <FileText className="w-5 h-5 text-blue-500" /> },
    { id: "jompay", name: "JomPAY", icon: <Coins className="w-5 h-5 text-amber-500" /> },
    { id: "card", name: "Pay Card", icon: <CreditCard className="w-5 h-5 text-teal-500" /> },
    { id: "financing", name: "Pay Financing", icon: <Building className="w-5 h-5 text-indigo-500" /> },
    { id: "zakat", name: "Pay Zakat", icon: <Shield className="w-5 h-5 text-emerald-500" /> },
  ];

  const handleSelectFavorite = (fav: any) => {
    setRecipient({
      name: fav.name,
      accountNo: fav.accountNo,
      bank: fav.bank,
      avatar: fav.avatar
    });
    setForm({ 
      ...form, 
      customAccountNo: fav.accountNo, 
      customBank: fav.bank,
      transferType: "DuitNow eWallet Transfer"
    });
    setStep("details");
  };

  const handleSelectChannel = (channel: string) => {
    setSelectedChannel(channel);
    setForm({
      ...form,
      customAccountNo: "",
      customBank: channel === "Mobile Number" ? "Touch n Go" : "Bank Islam",
    });
    setStep("duitnow_details");
  };

  const handleNextDuitNowDetails = () => {
    if (!form.customAccountNo) {
      // Auto fill a mock placeholder so it proceeds easily
      const mockNo = selectedChannel === "Mobile Number" ? "0123456789" : "150198765432";
      setForm({ ...form, customAccountNo: mockNo });
      setRecipient({
        name: `Recipient (${selectedChannel})`,
        accountNo: mockNo,
        bank: form.customBank,
        avatar: "👤"
      });
    } else {
      setRecipient({
        name: recipient.name === "Aliff Harith" ? `Recipient (${selectedChannel})` : recipient.name,
        accountNo: form.customAccountNo,
        bank: form.customBank,
        avatar: "👤"
      });
    }
    setStep("details");
  };

  const handleSelectPayService = (service: any) => {
    setPayeeCategory(service.name);
    setBillBiller(
      service.id === "sadaqa" ? "State Mosque Sadaqah Fund" 
      : service.id === "zakat" ? "MAIWP Zakat Agency"
      : service.id === "jompay" ? "JomPAY Code: 5122 (TNB)"
      : "Main Utility Biller"
    );
    setStep("pay_form");
  };

  const handleNextPayForm = () => {
    setRecipient({
      name: `Biller: ${billBiller}`,
      accountNo: billRefNo || "PAY-REF-908122",
      bank: payeeCategory,
      avatar: "🧾"
    });
    setForm({
      ...form,
      amount: reloadAmount, // default prefill
      reference: `${payeeCategory} Payment`
    });
    setStep("details");
  };

  const handleNextReloadForm = () => {
    setRecipient({
      name: `Prepaid Reload: ${reloadOperator}`,
      accountNo: reloadNumber || "019-281-9022",
      bank: reloadOperator,
      avatar: "📱"
    });
    setForm({
      ...form,
      amount: reloadAmount || "30",
      reference: `Mobile Prepaid Reload`
    });
    setStep("details");
  };

  const handleNextDetails = () => {
    setStep("secure_bimb");
  };

  // CLEANUP TIMER
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Generate random caregiver OTP safety code when Modal opens
  useEffect(() => {
    if (caregiverApprovalWait) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setCaregiverOtpCode(code);
      setCaregiverOtpInput("");
      setCaregiverOtpError("");
    }
  }, [caregiverApprovalWait]);

  // START 60S COOL-DOWN COUNTDOWN
  const startCoolingCounter = (totalSeconds: number) => {
    setCoolingSeconds(totalSeconds);
    setCoolingProgress(100);
    
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCoolingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        const nextSec = prev - 1;
        setCoolingProgress((nextSec / totalSeconds) * 100);
        return nextSec;
      });
    }, 1000);
  };

  // CHECK MULE PROTOCOL, ELDERLY LIMITS, AND NEW FRAUD SCREENING
  const handleAuthorizeTransfer = async () => {
    setTransferError("");
    setFraudOverrideError("");
    const amountVal = parseFloat(form.amount);

    if (isNaN(amountVal) || amountVal <= 0) {
      setTransferError("Please specify a valid transaction amount.");
      return;
    }

    if (accountsState.totalBalance < amountVal) {
      setTransferError("Insufficient balance in Qard Savings Account-i.");
      return;
    }

    // A. ELDERLY OVER-LIMIT CAREGIVER INTERCEPT
    if (accountsState.elderlyMode && amountVal >= accountsState.elderlyLimit && !accountsState.isCaregiverApproved) {
      setCaregiverApprovalWait(true);
      return;
    }

    // B. NEW: REAL-TIME FRAUD SCREENING (SafeSend-inspired)
    setStep("fraud_screening");
    try {
      const screenRes = await fetch("/api/screen-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAccountNo: recipient.accountNo,
          recipientName: recipient.name,
          amount: amountVal,
          senderAccountNo: accountsState.accountNo
        })
      });

      const screenData = await screenRes.json();
      setFraudScreening({
        riskLevel: screenData.riskLevel,
        riskScore: screenData.riskScore,
        reason: screenData.reason,
        warnings: screenData.warnings,
        actionRequired: screenData.actionRequired,
        quarantineId: screenData.quarantineId
      });

      // Handle different risk levels
      if (screenData.riskLevel === "GREEN") {
        // Silent approval - proceed immediately
        executeBankDebit();
      } else if (screenData.riskLevel === "AMBER") {
        // Soft warning - user can manually confirm
        // UI will show confirmation dialog
      } else if (screenData.riskLevel === "RED") {
        // Hard interception - stay on fraud_screening step
        // User must provide OTP or security override
      }
    } catch (e) {
      console.error("Fraud screening failed: ", e);
      setTransferError("Security screening service unavailable. Transaction blocked.");
      setStep("details");
    }
  };

  const executeBankDebit = async () => {
    try {
      const res = await fetch("/api/complete-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          accountNo: recipient.accountNo,
          recipientName: recipient.name,
          reference: form.reference
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessTx(data.transaction);
        onRefreshData();
      } else {
        setTransferError(data.error || "Execution error.");
      }
    } catch (e: any) {
      setTransferError("Network transaction offline.");
    }
  };

  const handleSimulateCaregiver = (approve: boolean) => {
    setCaregiverApprovalWait(false);
    if (approve) {
      accountsState.isCaregiverApproved = true;
      executeBankDebit();
    } else {
      setIsCanceledBySafety(true);
    }
  };

  const handleSafetyCancel = () => {
    setIsCanceledBySafety(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("select_method");
  };

  const handleFraudOverride = async (method: "caregiver_otp" | "security_override") => {
    setFraudOverrideError("");
    
    if (method === "caregiver_otp" && !fraudOverrideVerification) {
      setFraudOverrideError("Please enter OTP code");
      return;
    }

    try {
      const overrideRes = await fetch("/api/override-quarantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantineId: fraudScreening?.quarantineId,
          verificationMethod: method,
          verificationCode: fraudOverrideVerification
        })
      });

      const overrideData = await overrideRes.json();
      if (overrideRes.ok && overrideData.success) {
        executeBankDebit();
        setFraudScreening(null);
      } else {
        setFraudOverrideError(overrideData.error || "Verification failed");
      }
    } catch (e) {
      setFraudOverrideError("Override service unavailable");
    }
  };

  const handleProceedInsist = () => {
    executeBankDebit();
    setStep("select_method");
  };

  const resetFlow = () => {
    setStep("select_method");
    setSuccessTx(null);
    setIsCanceledBySafety(false);
    setMuleData(null);
    setCaregiverApprovalWait(false);
    setFraudScreening(null);
    setFraudOverrideVerification("");
    setFraudOverrideError("");
    setBillRefNo("");
    setReloadNumber("");
    setForm({
      amount: "150",
      reference: "Weekly Allowance",
      customAccountNo: "",
      customBank: "Touch n Go",
      transferType: "Fund Transfer to Savings/Current",
      transferMode: "DuitNow Transfer"
    });
  };

  const isAlertActive = !!successTx || isCanceledBySafety || step === "intercept" || step === "fraud_screening" || caregiverApprovalWait;

  return (
    <div id="transfer-funds-section" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden select-none">
      
      {/* FLOW METADATA STEAM */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 rounded-lg text-bimb-red shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800">
              {step === "pay_select" || step === "pay_form" ? "BIMB PAYMENTS & BILLS" : step === "reload_form" ? "MOBILE PREPAID RELOAD" : "DUITNOW QUANTUM PROTECTION GATEWAY"}
            </h3>
            <p className="text-[10px] text-slate-400">Secure Shariah Guard Protocol Active</p>
          </div>
        </div>
        <span className="text-[9px] bg-bimb-peach text-bimb-red font-bold px-2 py-0.5 rounded uppercase font-mono">
          NEURA SECURED
        </span>
      </div>

      {/* NEURA SANDBOX DEMO DIRECT TEST TRIGGERS */}
      {!isAlertActive && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 rounded-2xl p-4 mb-5 space-y-2 select-none shadow-xxs">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-bimb-red fill-bimb-red animate-pulse" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">NEURA AI Guard Sandbox Testing Hub</span>
            </div>
            <span className="text-[8px] bg-bimb-red/10 text-bimb-red font-bold px-1.5 py-0.2 rounded uppercase font-mono">Simulators</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Regulators & review teams: use these direct shortcuts to instantly load and test NEURA protective scenarios.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans">
            <button
              onClick={triggerMuleDemo}
              className="bg-white hover:bg-rose-50/50 hover:border-bimb-red border border-slate-200/80 p-2.5 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between hover:scale-102"
            >
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[10.5px] font-black text-rose-700 uppercase leading-none">1. Mule Flows</span>
              </div>
              <span className="text-[9px] text-slate-400 leading-normal mt-1">Populates 60s cooldown warning with interactive nodes diagram.</span>
            </button>
            <button
              onClick={triggerBlacklistDemo}
              className="bg-white hover:bg-amber-50/50 hover:border-amber-400 border border-slate-200/80 p-2.5 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between hover:scale-102"
            >
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10.5px] font-black text-amber-800 uppercase leading-none">2. CCID Blacklist</span>
              </div>
              <span className="text-[9px] text-slate-400 leading-normal mt-1">Demos high-security blocker for verified registry criminal match.</span>
            </button>
            <button
              onClick={triggerElderlyDemo}
              className="bg-white hover:bg-teal-50/50 hover:border-teal-400 border border-slate-200/80 p-2.5 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between hover:scale-102"
            >
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span className="text-[10.5px] font-black text-teal-700 uppercase leading-none">3. Caregiver Consent</span>
              </div>
              <span className="text-[9px] text-slate-400 leading-normal mt-1">Triggers prominent pending approval screen for elderly budget limit.</span>
            </button>
          </div>
        </div>
      )}

      {successTx ? (
        /* SUCCESS SCREEN */
        <div className="text-center py-6 space-y-4 animate-fade-in select-none">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-sm">
            <CheckCircle className="w-9 h-9" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Transaction Completed Successfully</h3>
            <p className="text-xs text-slate-400 mt-0.5">Qard Shariah Savings Account-i Mutual Debit Outbound Processed</p>
            <p className="text-xl font-mono font-black text-emerald-600 mt-2">RM {parseFloat(form.amount).toFixed(2)}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-2 border border-slate-100 font-medium font-sans">
            <div className="flex justify-between"><span className="text-slate-400">Recipient Name:</span> <span className="font-bold text-slate-800">{recipient.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Account No:</span> <span className="font-mono text-slate-800">{recipient.accountNo}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Destination:</span> <span className="font-medium text-slate-800">{recipient.bank}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Reference Msg:</span> <span className="italic text-slate-700">"{form.reference}"</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Fraud Audited:</span> <span className="text-bimb-red font-extrabold uppercase">Pass - Verified Clear</span></div>
          </div>

          <button
            onClick={resetFlow}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer transition-transform"
          >
            Start Another Transaction
          </button>
        </div>
      ) : isCanceledBySafety ? (
        /* SAFETY DE-ESCALATION THANKS */
        <div className="text-center py-8 space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-bimb-peach rounded-full flex items-center justify-center mx-auto text-bimb-red border border-rose-100 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 font-black">Wise Decision Completed</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
              You chose to cancel this transaction. Your hard-earned funds remain safe in your high-audit custody. Signals were sent to network security teams to register parent concern records.
            </p>
          </div>
          <button
            onClick={resetFlow}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer transition-transform"
          >
            Return to Gateway Home
          </button>
        </div>
      ) : step === "select_method" ? (
        /* STEP: DUITNOW METHOD SELECTION (Image 3 & 4) */
        <div className="space-y-4 animate-fade-in font-sans">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="block text-xs font-black text-slate-400 uppercase tracking-wider">Favourites (DuitNow)</span>
              <span className="text-[11px] font-bold text-bimb-red cursor-pointer hover:underline">View All</span>
            </div>
            {/* horizontal list of favorites with DuitNow styling */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FAVORITES.map((fav, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectFavorite(fav)}
                  className={`p-3 border rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-bimb-red transition-all ${fav.style}`}
                >
                  <span className="text-2xl mb-1">{fav.avatar}</span>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-[11px] font-black text-slate-800 line-clamp-1">{fav.name.split(" ")[0]}</span>
                    {fav.name.includes("DuitNow") && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d31145] shrink-0" title="DuitNow Registered"></span>
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 font-mono mt-0.5 uppercase">{fav.bank}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">Choose Transfer Method</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-sans">
              {[
                { name: "Account", icon: <User className="w-5 h-5" /> },
                { name: "Mobile Number", icon: <Smartphone className="w-5 h-5" /> },
                { name: "Malaysian ID (NRIC)", icon: <Fingerprint className="w-5 h-5" /> },
                { name: "Passport Number", icon: <Book className="w-5 h-5" /> },
                { name: "Business Registration", icon: <Building className="w-5 h-5" /> },
                { name: "Overseas", icon: <Globe className="w-5 h-5" /> },
              ].map((chan) => (
                <button
                  key={chan.name}
                  onClick={() => handleSelectChannel(chan.name)}
                  className="p-3 bg-slate-50 hover:bg-rose-50/40 border border-slate-100 hover:border-bimb-red rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <div className="text-bimb-red mb-1.5">{chan.icon}</div>
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">{chan.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button 
              onClick={() => {
                setStep("pay_select");
              }} 
              className="text-xs text-slate-500 hover:text-slate-850 font-bold flex items-center gap-1 underline"
            >
              Or Pay Bills / Zakat
            </button>
            <button 
              onClick={() => {
                setStep("reload_form");
              }} 
              className="text-xs text-slate-500 hover:text-slate-850 font-bold flex items-center gap-1 underline"
            >
              Or Topup Mobile
            </button>
          </div>
        </div>
      ) : step === "duitnow_details" ? (
        /* STEP: ENTER RECIPIENT DETAILS (Image 5 & 6) */
        <div className="space-y-4 animate-fade-in font-sans">
          <div className="bg-slate-50 p-4 rounded-2xl border border-rose-100 shadow-xs">
            <h4 className="text-xs font-black text-slate-400 uppercase mb-2">DuitNow Selected Channel</h4>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bimb-peach text-bimb-red rounded-xl">
                {selectedChannel === "Mobile Number" ? <Smartphone className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">DuitNow Channel Mode: {selectedChannel}</p>
                <p className="text-[10px] text-slate-400">Transactions processed via national real-time payment switch</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Transfer to Bank / Institution</label>
              <select
                value={form.customBank}
                onChange={(e) => setForm({ ...form, customBank: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Touch n Go">Touch n Go eWallet</option>
                <option value="Bank Islam">Bank Islam Malaysia Berhad</option>
                <option value="Maybank">Maybank (Malayan Banking)</option>
                <option value="CIMB Bank">CIMB Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Transfer Type</label>
              <select
                value={form.transferType}
                onChange={(e) => setForm({ ...form, transferType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Fund Transfer to Savings/Current">Fund Transfer to Savings/Current</option>
                <option value="DuitNow eWallet Transfer">DuitNow eWallet Transfer (Instant)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                {selectedChannel === "Mobile Number" ? "Recipient Mobile ID Number (e.g., 0123456789)" : "Recipient Account / Identifier Number"}
              </label>
              <input
                type="text"
                value={form.customAccountNo}
                onChange={(e) => setForm({ ...form, customAccountNo: e.target.value })}
                placeholder={selectedChannel === "Mobile Number" ? "e.g. 0123456789" : "e.g. 150123456789 (Try Dad's registered mule 8888888888)"}
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Transfer Mode</label>
              <select
                disabled
                value={form.transferMode}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-slate-500"
              >
                <option value="DuitNow Transfer">DuitNow Transfer (Guaranteed Immediate Outbound)</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setStep("select_method")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer"
              >
                Back To Channels
              </button>
              <button
                onClick={handleNextDuitNowDetails}
                className="flex-1 bg-bimb-red hover:bg-bimb-darkred text-white py-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                Next (Enter Amount)
              </button>
            </div>
          </div>
        </div>
      ) : step === "pay_select" ? (
        /* STEP: SELECTION OF PAY SERVICES (Image 7 & 8) */
        <div className="space-y-4 animate-fade-in font-sans">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-black text-slate-700 uppercase">Interactive Billers Directory</span>
            <button className="text-[10px] text-bimb-red font-bold">+ Add Favourite</button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            {PAY_BILL_SERVICES.map((serv) => (
              <button
                key={serv.id}
                onClick={() => handleSelectPayService(serv)}
                className="w-full p-4 hover:bg-rose-50/20 bg-white flex items-center justify-between cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    {serv.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{serv.name}</h4>
                    <p className="text-[10px] text-slate-400">Shariah-Compliant Settlement Agency</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("select_method")}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Back to Fund Transfer
          </button>
        </div>
      ) : step === "pay_form" ? (
        /* STEP: PAY DETAILS INPUT FORM */
        <div className="space-y-4 animate-fade-in font-sans">
          <h4 className="text-xs font-black text-slate-400 uppercase">Input Payment Details</h4>
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 shadow-xs">
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase">Category</span>
              <p className="text-xs font-bold text-slate-800">{payeeCategory}</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase">Favourited Payee Biller</span>
              <p className="text-xs font-bold text-bimb-red font-display">{billBiller}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                Enter Bill / Biller Account Reference ID
              </label>
              <input
                type="text"
                value={billRefNo}
                onChange={(e) => setBillRefNo(e.target.value)}
                placeholder="e.g. TNB-8710212354"
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Bill Amount (RM)</label>
              <input
                type="number"
                value={reloadAmount}
                onChange={(e) => setReloadAmount(e.target.value)}
                placeholder="RM 0.00"
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setStep("pay_select")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-medium cursor-pointer"
              >
                Back To Billers
              </button>
              <button
                onClick={handleNextPayForm}
                className="flex-1 bg-bimb-red hover:bg-bimb-darkred text-white py-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                Confirm Payment Details
              </button>
            </div>
          </div>
        </div>
      ) : step === "reload_form" ? (
        /* STEP: MOBILE RELOAD DETAILS FORM */
        <div className="space-y-4 animate-fade-in font-sans">
          <h4 className="text-xs font-black text-slate-400 uppercase">Input Prepaid Mobile Reload Details</h4>
          
          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Network Operator</label>
              <select
                value={reloadOperator}
                onChange={(e) => setReloadOperator(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="Maxis Hotlink">Maxis Hotlink (Prepaid)</option>
                <option value="Celcom Xpax">Celcom Xpax (Prepaid)</option>
                <option value="Digi Prepaid">Digi Prepaid (Prepaid)</option>
                <option value="U Mobile">U Mobile (Prepaid)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Enter Mobile Number</label>
              <input
                type="text"
                value={reloadNumber}
                onChange={(e) => setReloadNumber(e.target.value)}
                placeholder="e.g. 012-345 6789"
                className="w-full bg-slate-50 border border-slate-200 focus:border-bimb-red focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Reload Amount (RM)</label>
              <div className="grid grid-cols-4 gap-2.5">
                {["10", "30", "50", "100"].map((am) => (
                  <button
                    key={am}
                    type="button"
                    onClick={() => setReloadAmount(am)}
                    className={`py-3 text-xs font-mono font-bold border rounded-xl cursor-pointer ${
                      reloadAmount === am ? "border-bimb-red bg-rose-50/50 text-bimb-red" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    RM {am}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                onClick={() => setStep("select_method")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-medium cursor-pointer"
              >
                Back to Gateway
              </button>
              <button
                onClick={handleNextReloadForm}
                className="flex-1 bg-bimb-red hover:bg-bimb-darkred text-white py-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                Confirm Reload Details
              </button>
            </div>
          </div>
        </div>
      ) : step === "details" ? (
        /* STEP: ENTER TRANSFER VALUE (RM AMOUNT & REF) */
        <div className="space-y-4 animate-fade-in font-sans">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-bimb-peach text-sm rounded-xl flex items-center justify-center border border-rose-100 font-black">{recipient.avatar}</div>
              <div>
                <h4 className="text-xs font-black text-slate-800">{recipient.name}</h4>
                <p className="text-[10px] font-mono text-slate-500">{recipient.bank} • {recipient.accountNo}</p>
              </div>
            </div>
            <button onClick={() => setStep("select_method")} className="text-xs font-extrabold text-bimb-red hover:underline cursor-pointer">Change</button>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Enter Amount to Transfer (RM)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-xs">RM</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-bimb-red outline-none rounded-xl pl-9 pr-4 py-3 text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Payment Reference Message</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Weekly allowance, bills etc"
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-bimb-red outline-none rounded-xl px-3 py-3 text-xs font-bold"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setStep("select_method")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNextDetails}
                className="flex-1 bg-bimb-red hover:bg-bimb-darkred text-white py-3 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
              >
                Next Details
              </button>
            </div>
          </div>
        </div>
      ) : step === "secure_bimb" ? (
        /* STEP: NEURA SECURE TEMPLATE (AUTHORIZE PROMPT) */
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 animate-fade-in select-none">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs tracking-wide text-bimb-gold uppercase">NEURA Cognitive AI Session Protection</span>
            <span className="bg-red-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Secure Stream</span>
          </div>

          <div className="space-y-2 border-b border-white/5 pb-3 font-medium">
            <p className="text-[10px] text-slate-400">Please authorize this fund transfer securely.</p>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Transfer To:</span> <span className="font-bold text-white">{recipient.name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Account No:</span> <span className="font-mono text-slate-300">{recipient.accountNo}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Transaction Destination:</span> <span className="text-bimb-gold font-bold">{recipient.bank}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Payment Reference:</span> <span className="text-slate-300 italic">"{form.reference}"</span></div>
            <div className="flex justify-between text-xs border-t border-white/5 pt-2"><span className="text-slate-400 font-bold">Total Debit Value:</span> <span className="font-mono font-bold text-white text-sm">RM {parseFloat(form.amount || "0").toFixed(2)}</span></div>
          </div>

          {transferError && (
            <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{transferError}</p>
          )}

          {/* CAREGIVER TIMED APPROVAL WAITING ELEMENT */}
          {caregiverApprovalWait ? (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-2 text-slate-200">
              <div className="flex items-center gap-1.5 text-bimb-gold">
                <Heart className="w-4 h-4 animate-pulse shrink-0 fill-bimb-gold text-bimb-gold" />
                <span className="text-xs font-bold uppercase tracking-wider">Elderly Guard Intercept: {accountsState.caregiverName} Approval Requested</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                You've hit your parent safety daily RM {accountsState.elderlyLimit} budget limit. We sent in a tap check to {accountsState.caregiverName}'s mobile dashboard and are currently awaiting live tap clearance!
              </p>
              
              <div className="pt-2 flex justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => handleSimulateCaregiver(false)}
                  className="bg-rose-500/25 hover:bg-rose-500/35 text-rose-300 text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer"
                >
                  Block (Caregiver Sim)
                </button>
                <button
                  onClick={() => handleSimulateCaregiver(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-transform"
                >
                  Approve (Caregiver Sim)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => setStep("details")}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Reject / Cancel
              </button>
              <button
                onClick={handleAuthorizeTransfer}
                className="flex-1 bg-bimb-red hover:bg-bimb-darkred hover:shadow-lg text-white py-3 rounded-2xl text-xs font-bold tracking-tight cursor-pointer transition-all"
              >
                Authorise (NEURA Secure)
              </button>
            </div>
          )}
        </div>
      ) : step === "fraud_screening" ? (
        /* STEP: REAL-TIME FRAUD SCREENING (SafeSend 3-Way Branch) */
        <div className={`rounded-3xl p-5 space-y-4 animate-fade-in border shadow-sm ${
          fraudScreening?.riskLevel === "RED" ? "bg-red-50 border-red-200" :
          fraudScreening?.riskLevel === "AMBER" ? "bg-amber-50 border-amber-200" :
          "bg-emerald-50 border-emerald-200"
        }`}>
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 text-lg ${
              fraudScreening?.riskLevel === "RED" ? "bg-red-100 border-red-300 text-red-600" :
              fraudScreening?.riskLevel === "AMBER" ? "bg-amber-100 border-amber-300 text-amber-600" :
              "bg-emerald-100 border-emerald-300 text-emerald-600"
            }`}>
              {fraudScreening?.riskLevel === "RED" ? "🛑" :
               fraudScreening?.riskLevel === "AMBER" ? "⚠️" :
               "✅"}
            </div>
            <div className="flex-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest block font-mono ${
                fraudScreening?.riskLevel === "RED" ? "text-red-600" :
                fraudScreening?.riskLevel === "AMBER" ? "text-amber-600" :
                "text-emerald-600"
              }`}>
                Real-Time Fraud Screening
              </span>
              <h3 className={`font-display font-extrabold text-base mt-0.5 ${
                fraudScreening?.riskLevel === "RED" ? "text-red-700" :
                fraudScreening?.riskLevel === "AMBER" ? "text-amber-700" :
                "text-emerald-700"
              }`}>
                {fraudScreening?.riskLevel === "RED" ? "🚨 HIGH RISK - HARD INTERCEPT" :
                 fraudScreening?.riskLevel === "AMBER" ? "⚠️ MODERATE RISK - SOFT WARNING" :
                 "✅ LOW RISK - APPROVED"}
              </h3>
            </div>
            <div className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg ${
              fraudScreening?.riskLevel === "RED" ? "bg-red-100 text-red-700" :
              fraudScreening?.riskLevel === "AMBER" ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {fraudScreening?.riskScore}/100
            </div>
          </div>

          {/* Risk Reason */}
          <div className={`p-3.5 rounded-2xl border ${
            fraudScreening?.riskLevel === "RED" ? "bg-white border-red-100" :
            fraudScreening?.riskLevel === "AMBER" ? "bg-white border-amber-100" :
            "bg-white border-emerald-100"
          }`}>
            <p className="text-xs text-slate-600 leading-relaxed">{fraudScreening?.reason}</p>
          </div>

          {/* Bilingual Warning (RED level only) */}
          {fraudScreening?.riskLevel === "RED" && fraudScreening.warnings && (
            <div className="space-y-2.5">
              <div className="bg-white border border-red-200 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-red-700 uppercase tracking-wider">🇬🇧 English Warning</div>
                <p className="text-xs text-slate-700 leading-relaxed italic">{fraudScreening.warnings.en}</p>
              </div>
              <div className="bg-white border border-red-200 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-red-700 uppercase tracking-wider">🇲🇾 Amaran Bahasa Melayu</div>
                <p className="text-xs text-slate-700 leading-relaxed italic">{fraudScreening.warnings.ms}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {fraudScreening?.riskLevel === "GREEN" ? (
            <div className="text-center py-2">
              <p className="text-xs text-emerald-600 font-bold">Processing approved transfer...</p>
            </div>
          ) : fraudScreening?.riskLevel === "AMBER" ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setFraudScreening(null);
                  setStep("details");
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Cancel Transaction
              </button>
              <button
                onClick={() => executeBankDebit()}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Confirm & Proceed
              </button>
            </div>
          ) : (
            // RED level - requires verification
            <div className="space-y-3">
              <div className="bg-white border border-red-200 rounded-2xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-red-700 uppercase">Secondary Verification Required</div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block">Caregiver OTP Code (Demo: 123456)</label>
                  <input
                    type="text"
                    value={fraudOverrideVerification}
                    onChange={(e) => setFraudOverrideVerification(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                    maxLength={6}
                  />
                </div>
                {fraudOverrideError && (
                  <p className="text-xs text-red-600 font-bold">{fraudOverrideError}</p>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setFraudScreening(null);
                    setStep("details");
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Cancel (Safe Choice)
                </button>
                <button
                  onClick={() => handleFraudOverride("caregiver_otp")}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Verify with OTP
                </button>
              </div>
              
              <button
                onClick={() => handleFraudOverride("security_override")}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Override (30s Cooldown Required)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STEP: INTERCEPTIVE PROTOCOL SCREEN (MULE BLOCKS WITH 60S COOLING TIMER) */
        <div id="mule-intercept-panel" className="bg-[#fff5f5] text-slate-900 border border-rose-200 rounded-3xl p-5 space-y-5 animate-fade-in relative z-10 select-none shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 shadow-xs animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block font-mono">Core Security S-Intercept Active</span>
              <h3 className="font-display font-extrabold text-[#d31145] text-base leading-tight mt-0.5">
                {interceptMode === "mule" ? "⚠️ Potential Scam Mule Account Detected" : "🚨 HIGH RISK SECURITY VETO ACTIVE"}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-100 space-y-3 font-medium text-slate-700">
            <div className="flex justify-between text-xs pb-1.5 border-b border-slate-100 font-mono">
              <span className="text-slate-400 font-bold whitespace-nowrap">Target Account:</span>
              <span className="font-bold text-slate-900 break-all pl-2">{recipient.accountNo} ({muleData?.bank || recipient.bank})</span>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed italic pr-1">"{interceptReason}"</p>
          </div>

          {/* RENDERING DYNAMIC GRAPH OR BLACKLIST WARNING */}
          {interceptMode === "mule" ? (
            /* Mule network node flow chart */
            <div className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-xxs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">POLICE-INTEGRATED MULE CASH FLOW MAP</span>
                <span className="text-[9.5px] text-[#d31145] font-mono font-black animate-pulse bg-red-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                  Linked Outflow Spikes
                </span>
              </div>
              
              {/* SVG Graph container */}
              <div className="relative h-44 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
                <svg className="w-full h-full" viewBox="0 0 400 180" style={{ pointerEvents: "all" }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                    </marker>
                    <marker id="arrow-dashed" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                    </marker>
                  </defs>

                  {/* Connection paths */}
                  {/* You -> Target Mule */}
                  <line x1="45" y1="90" x2="160" y2="90" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow)" strokeDasharray="3 3" className="animate-pulse" />
                  
                  {/* Target Mule -> Outflow A */}
                  <path d="M 160 90 Q 210 50 280 40" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow-dashed)" />
                  {/* Target Mule -> Outflow B */}
                  <line x1="160" y1="90" x2="280" y2="90" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow-dashed)" />
                  {/* Target Mule -> Outflow C */}
                  <path d="M 160 90 Q 210 130 280 140" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow-dashed)" />

                  {/* Node Circles */}
                  {/* YOU Node */}
                  <g 
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredNode("you")}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx="45" cy="90" r="15" fill="#1e293b" stroke="#475569" strokeWidth="2" className="transition-all hover:stroke-[#d31145]" />
                    <text x="45" y="93" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">YOU</text>
                  </g>

                  {/* TARGET MULE Node */}
                  <g 
                    className="cursor-pointer group animate-pulse"
                    onMouseEnter={() => setHoveredNode("mule")}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx="160" cy="90" r="23" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" />
                    <circle cx="160" cy="90" r="17" fill="#e11d48" stroke="#f43f5e" strokeWidth="2" />
                    <text x="160" y="93" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">MULE</text>
                  </g>

                  {/* OUTFLOW A NODE */}
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode("nodeA")}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx="280" cy="40" r="11" fill="#334155" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="280" y="43" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">A</text>
                  </g>

                  {/* OUTFLOW B NODE */}
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode("nodeB")}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx="280" cy="90" r="11" fill="#334155" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="280" y="93" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">B</text>
                  </g>

                  {/* OUTFLOW C NODE */}
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode("nodeC")}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx="280" cy="140" r="11" fill="#334155" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="280" y="143" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">C</text>
                  </g>

                  {/* SVG Labels */}
                  <text x="45" y="118" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="semibold">Your Wallet</text>
                  <text x="160" y="121" textAnchor="middle" fill="#f43f5e" fontSize="7.5" fontWeight="bold">Suspect Payout Hub</text>
                  <text x="298" y="43" textAnchor="start" fill="#94a3b8" fontSize="7.5">Layer-2 Wallet A</text>
                  <text x="298" y="93" textAnchor="start" fill="#94a3b8" fontSize="7.5">ATM Mule B</text>
                  <text x="298" y="143" textAnchor="start" fill="#94a3b8" fontSize="7.5">Offshore Escrow C</text>
                </svg>

                {/* SVG Hover feedback card */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-xs border border-white/10 rounded-lg p-2 text-[9px] text-slate-300 font-mono">
                  {hoveredNode === "you" ? (
                    <div><span className="text-emerald-400 font-bold">● Source Account</span> - Secured credentials. Clear history.</div>
                  ) : hoveredNode === "mule" ? (
                    <div><span className="text-rose-500 font-bold">● L1 Cashout Mule Hub</span> - Flagged 1.8 mins ago by bio-behavioral sensors. Incoming flow: 15 spikes/hour.</div>
                  ) : hoveredNode === "nodeA" ? (
                    <div><span className="text-amber-400 font-bold">● Layer-2 Node A</span> - Immediate outbound micro-routes. RM 15,200 funnelled out today.</div>
                  ) : hoveredNode === "nodeB" ? (
                    <div><span className="text-amber-400 font-bold">● Layer-2 Node B</span> - Card mule endpoint operated by syndicate runner. RM 24,000 cash withdraw path.</div>
                  ) : hoveredNode === "nodeC" ? (
                    <div><span className="text-amber-400 font-bold">● Layer-2 Node C</span> - Remote virtual cryptocurrency escrow sandbox. RM 9,500.</div>
                  ) : (
                    <div className="text-slate-400 italic text-center animate-pulse">💡 Place cursor overland (Nodes: YOU, MULE, A, B, C) to audit suspect routing telemetry.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Blacklisted Scam Offender Warnings */
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 space-y-3 text-slate-800 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-800">
                <div className="p-1 bg-rose-100 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
                </div>
                <div>
                  <span className="text-[9px] font-mono tracking-widest font-black text-rose-500 uppercase block leading-none">REGISTRY CRIMINALLY BLACKLISTED</span>
                  <h4 className="text-[11.5px] font-extrabold uppercase text-rose-800 mt-0.5">Verified Fraud Offender Match</h4>
                </div>
              </div>

              <div className="bg-white p-3 border border-red-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-rose-50">
                  <span className="text-slate-400 font-black font-sans uppercase">DATABASE STATUS:</span>
                  <span className="font-mono bg-red-150 text-red-600 font-bold px-1.5 py-0.5 rounded text-[9.5px]">CCID BLACKLIST MATCH</span>
                </div>
                
                <p className="text-[11.5px] leading-relaxed text-slate-600 font-sans">
                  The receiving account holder <strong className="text-slate-800 font-semibold">{muleData?.holder || "Mohamad Scam Bin Ali"}</strong> is registered under active criminal databases with <strong className="text-[#d31145] font-black">{muleData?.scamSpikes || 24} active civil & police reports</strong> for online task scams and fake investment schemings.
                </p>
              </div>

              <div className="p-3 bg-red-100/55 border border-red-250/50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider font-sans">NEURA Safeguard Directive:</p>
                <div className="text-[10px] text-red-700 leading-normal font-sans">
                  We <strong>STRICTLY ADVISE AGAINST PROCEEDING</strong>. Continuing with this transfer puts your funds at immediate risk. Action has been flagged on central reports.
                </div>
              </div>
            </div>
          )}

          {/* 60S COUNTDOWN GRAPHICS */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-bimb-gold">
                <Clock className="w-4 h-4 animate-spin shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Bio-Behavioral Cooling State</span>
              </div>
              <span className="font-mono text-xs font-bold tracking-tight bg-white/15 px-2.5 py-0.5 rounded-full">
                {coolingSeconds}s Remaining
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              A 60-second cooling delay has been activated to help you step back. Scammers often use pressure prompts to accelerate transfers. Make a calm, objective decision.
            </p>

            {/* Micro progress bar */}
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-bimb-gold h-full transition-all duration-1000"
                style={{ width: `${coolingProgress}%` }}
              />
            </div>
          </div>

          {/* S-INTERCEPT CONTROL BUTTONS */}
          <div className="flex flex-col gap-2.5">
            {/* Primary recommendation: cancel */}
            <button
              onClick={handleSafetyCancel}
              className="w-full bg-[#d31145] hover:bg-[#a10b31] hover:scale-[1.01] text-white py-3.5 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              🤝 Cancel Payment Immediately (Keep My Money Safe)
            </button>

            {/* Secondary insistence pathway */}
            <div className="flex items-center justify-between pt-1 px-1">
              <button
                disabled={coolingSeconds > 0}
                onClick={handleProceedInsist}
                className={`text-[10px] font-semibold underline transition-colors ${
                  coolingSeconds > 0 ? "text-slate-400 cursor-not-allowed" : "text-bimb-red hover:text-bimb-darkred cursor-pointer"
                }`}
              >
                {coolingSeconds > 0 ? `Proceed Enabled in ${coolingSeconds}s` : "Proceed to Purchase anyway"}
              </button>
              
              <span className="text-[9px] text-slate-400 font-mono">Incident ID: NEURA-EV-{recipient.accountNo.slice(-4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CAREGIVER TIMED APPROVAL WAITING MODAL OVERLAY */}
      {caregiverApprovalWait && (
        <div id="caregiver-approval-gate" className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-3xl w-full border border-rose-100 shadow-2xl relative overflow-hidden text-slate-800 animate-fade-in select-none">
            {/* Interactive slide colored bar */}
            <div className="h-2 bg-[#d31145] w-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-6 gap-6">
              
              {/* LEFT SIDE: ELDERLY PARENT'S DEVICE (CODE GENERATOR) */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-bimb-red">
                      <Heart className="w-5 h-5 text-[#d31145] fill-[#d31145] animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[8px] font-mono font-black text-[#d31145] bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider block w-max">
                        NEURA Cognitive Shield Active
                      </span>
                      <h3 className="font-display font-black text-sm text-slate-900">
                        Parent's Verification Token
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This transfer of <span className="font-bold text-slate-800">RM {parseFloat(form.amount || "0").toFixed(2)}</span> exceeds your daily safety limit threshold setup of <span className="font-bold text-rose-600">RM {accountsState.elderlyLimit.toFixed(2)}</span>.
                    </p>

                    <div className="py-2.5 px-3 bg-slate-900 rounded-xl my-2 border border-slate-800 text-center space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        SHARE WITH SARA (CAREGIVER)
                      </span>
                      <div className="text-2xl font-mono text-emerald-400 font-extrabold tracking-widest py-1 px-4">
                        {caregiverOtpCode ? `${caregiverOtpCode.slice(0, 3)} ${caregiverOtpCode.slice(3)}` : "......"}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                      💬 Pass this 6-digit pin directly to your designated guardian, <strong>{accountsState.caregiverName}</strong> ({accountsState.caregiverPhone}). They must type this code on their caregiver simulator on the right to authorize and release funds!
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Beneficiary Account:</span>
                      <span className="font-bold text-slate-800">{recipient.name} ({recipient.bank})</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Account Number:</span>
                      <span className="font-bold text-slate-800">{recipient.accountNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Active Guardian:</span>
                      <span className="font-bold text-slate-800">{accountsState.caregiverName} ({accountsState.caregiverPhone})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCaregiverApprovalWait(false);
                    setIsCanceledBySafety(true);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors mt-4 text-center"
                >
                  Cancel Transaction (Emergency Lockout)
                </button>
              </div>

              {/* RIGHT SIDE: CAREGIVER'S MOBILE PHONE SIMULATOR */}
              <div className="space-y-4 md:pl-6 pt-5 md:pt-0 flex flex-col items-center">
                <div className="flex items-center gap-2 self-start md:self-center">
                  <span className="text-xs">📱</span>
                  <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-widest">
                    Caregiver Mobile Phone (Sandbox)
                  </h3>
                </div>

                {/* Simulated Smartphone viewport */}
                <div className="bg-slate-950 border-[6px] border-slate-850 rounded-[2.3rem] p-4 relative text-slate-100 shadow-2xl overflow-hidden font-sans w-full max-w-[275px]">
                  {/* Speaker slot and Notch */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center z-10">
                    <span className="w-8 h-1 bg-slate-800 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full ml-1" />
                  </div>

                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 pt-1 pb-1">
                    <span>{new Date().getUTCHours() + 8 > 23 ? "08" : String(new Date().getUTCHours() + 8).padStart(2, '0')}:43 PM</span>
                    <span>NEURA Net-i 📶 98%</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Phone App Header */}
                    <div className="text-center">
                      <span className="text-[7.5px] font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/40 uppercase tracking-widest">
                        🤲 EHSAN KASIH CARE
                      </span>
                      <h4 className="text-xs font-black text-white mt-1 leading-snug">
                        Guardian Consent Node
                      </h4>
                    </div>

                    {/* Pending Request Detail Panel */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-[9.5px] space-y-1 leading-tight">
                      <p className="text-slate-350 font-medium">
                        Request holding for confirmation:
                      </p>
                      <div className="border-t border-slate-800/40 my-1 pt-1 space-y-0.5 text-[8.5px] font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>User:</span> <span className="font-bold text-white">Mohamad Zulhilmy</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Value:</span> <span className="font-bold text-emerald-400">RM {form.amount}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Dest:</span> <span className="font-bold text-white truncate max-w-[100px]">{recipient.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* PIN Interface */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] text-center font-bold text-slate-450 uppercase tracking-widest font-mono">
                        Enter 6-Digit Active PIN
                      </label>
                      
                      <div className="flex items-center justify-center gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const char = caregiverOtpInput[index] || "";
                          return (
                            <div 
                              key={index} 
                              className={`w-6 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-all ${
                                char 
                                  ? "bg-emerald-950 border-emerald-500 text-emerald-400" 
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              }`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>

                      {caregiverOtpError ? (
                        <p className="text-[7.5px] text-rose-500 text-center font-bold font-mono py-0.5 animate-pulse">
                          ⚠️ {caregiverOtpError}
                        </p>
                      ) : (
                        <p className="text-[7px] text-slate-400 text-center font-sans py-0.5">
                          Tap numeric pad below to authorize.
                        </p>
                      )}
                    </div>

                    {/* Numeric Touch Keypad */}
                    <div className="grid grid-cols-3 gap-1 px-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            if (caregiverOtpInput.length < 6) {
                              const newVal = caregiverOtpInput + num;
                              setCaregiverOtpInput(newVal);
                              setCaregiverOtpError("");
                              if (newVal.length === 6) {
                                // auto verify
                                if (newVal === caregiverOtpCode) {
                                  setCaregiverOtpError("");
                                  handleSimulateCaregiver(true);
                                } else {
                                  setCaregiverOtpError("Incorrect PIN code. Try again.");
                                }
                              }
                            }
                          }}
                          className="bg-slate-900 hover:bg-slate-850 active:bg-slate-800 text-slate-100 font-bold font-mono py-1.5 rounded-lg text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-slate-800/40"
                        >
                          {num}
                        </button>
                      ))}
                      
                      {/* Clear Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setCaregiverOtpInput("");
                          setCaregiverOtpError("");
                        }}
                        className="bg-slate-900/60 hover:bg-slate-900 text-rose-400 font-bold py-1.5 rounded-lg text-[8.5px] cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-slate-800/20 uppercase tracking-tighter"
                      >
                        Reset
                      </button>

                      {/* Zero Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (caregiverOtpInput.length < 6) {
                            const newVal = caregiverOtpInput + "0";
                            setCaregiverOtpInput(newVal);
                            setCaregiverOtpError("");
                            if (newVal.length === 6) {
                              if (newVal === caregiverOtpCode) {
                                setCaregiverOtpError("");
                                handleSimulateCaregiver(true);
                              } else {
                                setCaregiverOtpError("Incorrect PIN code. Try again.");
                              }
                            }
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-850 active:bg-slate-800 text-slate-100 font-bold font-mono py-1.5 rounded-lg text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-slate-800/40"
                      >
                        0
                      </button>

                      {/* Backspace Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = caregiverOtpInput.slice(0, -1);
                          setCaregiverOtpInput(newVal);
                          setCaregiverOtpError("");
                        }}
                        className="bg-slate-900/65 hover:bg-slate-900 text-slate-300 font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-slate-800/20"
                      >
                        ⌫
                      </button>
                    </div>

                    {/* Shariah check indicators on caregiver end */}
                    <div className="border-t border-slate-900 pt-1.5 text-[6.5px] text-slate-500 font-mono text-center pb-2">
                      🔒 SECURE NEURA CRYPTO-HANDSHAKE V3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
