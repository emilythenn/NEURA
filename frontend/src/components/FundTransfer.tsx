import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Clock, AlertTriangle, CheckCircle, XCircle, Zap, 
  HelpCircle, UserCheck, ShieldCheck, Heart, ArrowRight, ArrowLeftRight,
  Smartphone, Fingerprint, Book, Globe, Building, CreditCard, Coins, Gift, FileText, ChevronRight, User, Shield
} from "lucide-react";
import { AccountsState } from "../types";
import { isValidOtp, isInvalidOtp, getSuccessCodes, getFailureCodes, DEMO_OTP_CODES } from "../demoOTP";

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
  | "fraud_screening"   // Real-time anti-fraud and mule account detection
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
    amount: "",
    reference: "",
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
  const [reloadAmount, setReloadAmount] = useState<string>("");

  // Security Interception states
  const [coolingSeconds, setCoolingSeconds] = useState(0);
  const [coolingProgress, setCoolingProgress] = useState(100);
  const [interceptReason, setInterceptReason] = useState("");
  const [isCanceledBySafety, setIsCanceledBySafety] = useState(false);
  const [muleData, setMuleData] = useState<any>(null);
  const [transferError, setTransferError] = useState("");
  const [successTx, setSuccessTx] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [screeningSlowWarn, setScreeningSlowWarn] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
    { name: "Dad (DuitNow)", bank: "Touch n Go", accountNo: "8888888888", avatar: "👨", style: "border-rose-100 bg-rose-50/50" },
    { name: "Sarafina (Sara)", bank: "CIMB Bank", accountNo: "121234432121", avatar: "👩", style: "border-teal-100 bg-teal-50/50" },
    { name: "Abang Zul", bank: "Maybank", accountNo: "152011119021", avatar: "👦", style: "border-slate-100 bg-slate-50/50" },
    { name: "Mohamad Scam", bank: "CIMB Bank", accountNo: "9999999999", avatar: "👤", style: "border-rose-100 bg-rose-50/50" }
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
      amount: reloadAmount || "",
      reference: ""
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
      amount: reloadAmount || "",
      reference: ""
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
      if (abortRef.current) abortRef.current.abort();
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
  setScreeningSlowWarn(false);
  const amountVal = parseFloat(form.amount);

  if (isNaN(amountVal) || amountVal <= 0) {
    setTransferError("Please specify a valid transaction amount.");
    return;
  }

  if (accountsState.totalBalance < amountVal) {
    setTransferError("Insufficient balance in Qard Savings Account-i.");
    return;
  }

  // A. REAL-TIME FRAUD SCREENING (check for mule/blacklist FIRST, regardless of elderly mode)
  setStep("fraud_screening");
  setFraudScreening(null); // reset so spinner shows

  // Abort any previous in-flight request
  if (abortRef.current) abortRef.current.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  // Show a "taking longer than expected" warning after 8 seconds
  const slowWarnTimer = setTimeout(() => setScreeningSlowWarn(true), 8000);

  try {
    const screenRes = await fetch("/api/screen-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        recipientAccountNo: recipient.accountNo,
        recipientName: recipient.name,
        amount: amountVal,
        senderAccountNo: accountsState.accountNo,
        discretionaryBudget: accountsState.discretionaryBudget
      })
    });

    clearTimeout(slowWarnTimer);
    setScreeningSlowWarn(false);

    if (!screenRes.ok) {
      const errData = await screenRes.json().catch(() => ({}));
      setTransferError(errData.error || "Security screening failed. Transaction blocked for safety.");
      setFraudScreening(null); // Clear out screening state to prevent layout locks
      setStep("secure_bimb");  // Go back to the auth step so the error is visible
      return;
    }

    const screenData = await screenRes.json();

    if (screenData.riskLevel === "GREEN") {
      // B. If account is safe, NOW check elderly limit
      if (accountsState.elderlyMode && amountVal >= accountsState.elderlyLimit && !accountsState.isCaregiverApproved) {
        setCaregiverApprovalWait(true);
        setStep("secure_bimb");  // Return to auth step
        return;
      }
      // Account is safe and no elderly limit issue, proceed with transfer
      executeBankDebit();
    } else if (screenData.riskLevel === "AMBER") {
      // Show AMBER warning but still check elderly limit
      if (accountsState.elderlyMode && amountVal >= accountsState.elderlyLimit && !accountsState.isCaregiverApproved) {
        setCaregiverApprovalWait(true);
        setStep("secure_bimb");
        return;
      }
      // Show AMBER warning for override
      setFraudScreening({
        riskLevel: screenData.riskLevel,
        riskScore: screenData.riskScore,
        reason: screenData.reason,
        warnings: screenData.warnings || { en: "", ms: "" },
        actionRequired: screenData.actionRequired,
        quarantineId: screenData.quarantineId ?? undefined
      });
    } else if (screenData.riskLevel === "RED") {
      // RED = Mule or Blacklist → ALWAYS BLOCK regardless of elderly mode
      const isBlacklist = !!screenData.blacklistMatch;
      const scamSpikes = Math.floor(10 + Math.random() * 20);

      setMuleData({
        accountNo: recipient.accountNo,
        bank: recipient.bank,
        holder: screenData.blacklistMatch?.holderName || recipient.name,
        scamSpikes,
        riskScore: (screenData.riskScore || 90) / 100,
        incidentCategory: screenData.blacklistMatch?.incidentCategory,
        reportedBy: screenData.blacklistMatch?.reportedBy,
        confidenceScore: screenData.blacklistMatch?.confidenceScore
      });

      setInterceptMode(isBlacklist ? "blacklist" : "mule");
      setInterceptReason(
        isBlacklist
          ? `This account is registered in PDRM/CCID criminal databases under incident category: "${screenData.blacklistMatch.incidentCategory}". Reported by ${screenData.blacklistMatch.reportedBy}. NEURA advises IMMEDIATE transaction cancellation.`
          : `Our system has detected that '${recipient.accountNo}' is flagged as a financial mule node. ${screenData.reason}. Incoming transfer spikes from multiple users were recorded recently.`
      );

      setFraudScreening({
        riskLevel: screenData.riskLevel,
        riskScore: screenData.riskScore,
        reason: screenData.reason,
        warnings: screenData.warnings || { en: "", ms: "" },
        actionRequired: screenData.actionRequired,
        quarantineId: screenData.quarantineId ?? undefined
      });

      startCoolingCounter(60);
      setStep("intercept");
    }
  } catch (e: any) {
    clearTimeout(slowWarnTimer);
    setScreeningSlowWarn(false);
    if (e?.name === "AbortError") return; 
    
    console.error("Fraud screening failed:", e);
    setTransferError("Security screening service unavailable. Transaction reverted to secure checkout.");
    setFraudScreening(null); // Clear layout locks
    setStep("secure_bimb");  // Kick user out of infinite spinner back to authorization card
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

  const handleCaregiveVerifyOtp = () => {
    setCaregiverOtpError("");
    
    if (!caregiverOtpInput) {
      setCaregiverOtpError("Please enter OTP code");
      return;
    }

    if (isValidOtp(caregiverOtpInput)) {
      // Success - proceed with transfer
      accountsState.isCaregiverApproved = true;
      executeBankDebit();
      setCaregiverApprovalWait(false);
      setCaregiverOtpInput("");
    } else if (isInvalidOtp(caregiverOtpInput)) {
      // Invalid demo code
      setCaregiverOtpError("Invalid OTP code. Caregiver blocked this transfer.");
      setCaregiverOtpInput("");
    } else {
      // Not a demo code
      setCaregiverOtpError("Code not recognized. Please try again.");
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

    // Demo OTP validation
    if (method === "caregiver_otp") {
      if (isValidOtp(fraudOverrideVerification)) {
        // Success - proceed with transfer
        executeBankDebit();
        setFraudScreening(null);
        setFraudOverrideVerification("");
      } else if (isInvalidOtp(fraudOverrideVerification)) {
        // Invalid demo code
        setFraudOverrideError("Invalid OTP code. Please try again.");
      } else {
        // Not a demo code
        setFraudOverrideError("Code not recognized. Try: " + getSuccessCodes()[0]);
      }
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
    setScreeningSlowWarn(false);
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setIsCanceledBySafety(false);
    setMuleData(null);
    setCaregiverApprovalWait(false);
    setFraudScreening(null);
    setFraudOverrideVerification("");
    setFraudOverrideError("");
    setBillRefNo("");
    setReloadNumber("");
    setReloadAmount("");
    setForm({
      amount: "",
      reference: "",
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {FAVORITES.map((fav, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectFavorite(fav)}
                  className={`p-2 sm:p-3 border rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-bimb-red transition-all ${fav.style}`}
                >
                  <span className="text-xl sm:text-2xl mb-1">{fav.avatar}</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-800 line-clamp-1">{fav.name.split(" ")[0]}</span>
                    {fav.name.includes("DuitNow") && (
                      <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#d31145] shrink-0" title="DuitNow Registered"></span>
                    )}
                  </div>
                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 font-mono mt-0.5 uppercase hidden sm:block">{fav.bank}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100">
            <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 sm:mb-2.5">Choose Transfer Method</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 font-sans">
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
                  className="p-2 sm:p-3 bg-slate-50 hover:bg-rose-50/40 border border-slate-100 hover:border-bimb-red rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <div className="text-bimb-red mb-1 sm:mb-1.5 text-4 sm:text-5">{chan.icon}</div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight">{chan.name}</span>
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
                placeholder={selectedChannel === "Mobile Number" ? "e.g. 0123456789" : "e.g. 150123456789"}
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

                {transferError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{transferError}</p>
                )}
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
        
        /* STEP: REAL-TIME FRAUD SCREENING — Loading spinner or AMBER soft warning */
        !fraudScreening ? (
          <div className="rounded-3xl p-8 space-y-4 animate-fade-in border border-slate-100 bg-slate-50 text-center">
            <div className="w-12 h-12 border-4 border-bimb-red border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">NEURA Shield Scanning</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Verifying recipient against fraud registries…</p>
            </div>
          </div>) : (
        <div className={`rounded-3xl p-5 space-y-4 animate-fade-in border shadow-sm ${
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
                  <label className="text-xs font-semibold text-slate-600 block">Caregiver OTP Code</label>
                  <input
                    type="text"
                    value={fraudOverrideVerification}
                    onChange={(e) => setFraudOverrideVerification(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                    maxLength={6}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Demo: {getSuccessCodes()[0]} (success) or {getFailureCodes()[0]} (fail)</p>
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
        )
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

          <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-4 font-medium text-slate-700">
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Target Account</div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono font-bold text-slate-900 text-sm">{recipient.accountNo}</span>
                <span className="text-xs text-slate-500">({muleData?.bank || recipient.bank})</span>
              </div>
            </div>
            <div className="border-t border-rose-100 pt-3">
              <div className="text-[10px] text-rose-600 font-black uppercase tracking-wider block mb-2">Detection Reason</div>
              <p className="text-xs leading-relaxed text-slate-700">{interceptReason}</p>
            </div>
          </div>

          {/* RENDERING DYNAMIC GRAPH OR BLACKLIST WARNING */}
          {interceptMode === "mule" ? (
            /* Mule network node flow chart */
            <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-xxs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">MULE ACCOUNT NETWORK GRAPH</span>
                <span className="text-[9.5px] text-[#d31145] font-mono font-black animate-pulse bg-red-50 border border-rose-100 px-3 py-1 rounded-full shrink-0">
                  Outflow Pattern
                </span>
              </div>
              
              {/* SVG Graph container */}
              <div className="relative h-60 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
                <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: "all" }}>
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
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3 text-slate-800 animate-fade-in">
              <div className="flex items-center gap-3 text-rose-800">
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

          {/* AI Bilingual Warnings from NEURA (populated from real API) */}
          {fraudScreening?.warnings && (fraudScreening.warnings.en || fraudScreening.warnings.ms) && (
            <div className="space-y-2">
              {fraudScreening.warnings.en && (
                <div className="bg-white border border-rose-100 rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider font-mono">🇬🇧 NEURA AI Warning</span>
                  <p className="text-[11px] text-slate-700 leading-relaxed italic">{fraudScreening.warnings.en}</p>
                </div>
              )}
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

      {/* CAREGIVER OTP VERIFICATION MODAL - SIMPLE UI */}
      {caregiverApprovalWait && (
        <div id="caregiver-otp-gate" className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] max-w-md w-full border border-rose-100 shadow-2xl relative overflow-hidden text-slate-800 animate-fade-in select-none max-h-[90vh] overflow-y-auto">
            {/* Top accent bar */}
            <div className="h-2 bg-[#d31145] w-full" />
            
            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-bimb-red shrink-0">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#d31145] fill-[#d31145]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] sm:text-[8px] font-mono font-black text-[#d31145] bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider block w-max">
                    Caregiver Verification
                  </span>
                  <h3 className="font-display font-black text-xs sm:text-sm text-slate-900 truncate">
                    Confirm Transfer Request
                  </h3>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <p className="text-[12px] sm:text-xs text-slate-600 leading-relaxed">
                  This transfer of <span className="font-bold text-slate-900">RM {parseFloat(form.amount || "0").toFixed(2)}</span> exceeds your daily safety limit of <span className="font-bold text-rose-600">RM {accountsState.elderlyLimit.toFixed(2)}</span>.
                </p>
                <p className="text-[12px] sm:text-xs text-slate-600">
                  Enter the OTP code your caregiver <strong>{accountsState.caregiverName}</strong> received via SMS to approve this transfer.
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 block">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  value={caregiverOtpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCaregiverOtpInput(val);
                    setCaregiverOtpError("");
                  }}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg px-3 py-2 sm:py-2.5 text-sm font-mono outline-none text-center tracking-widest font-bold"
                  maxLength={6}
                />
              </div>

              {/* Error Message */}
              {caregiverOtpError && (
                <p className="text-[11px] sm:text-xs text-rose-600 font-bold bg-rose-50 p-2 sm:p-2.5 rounded-lg border border-rose-200">{caregiverOtpError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button
                  onClick={() => {
                    setCaregiverApprovalWait(false);
                    setCaregiverOtpInput("");
                    setCaregiverOtpError("");
                    setIsCanceledBySafety(true);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaregiveVerifyOtp}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer transition-colors"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}