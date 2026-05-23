<<<<<<< HEAD
import React, { useEffect, useMemo, useRef, useState } from "react";
=======
import React, { useState, useRef } from "react";
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
import { 
  Send, Sparkles, Shield, BarChart2, Heart, Moon, 
  HelpCircle, User, Paperclip, CheckCircle, AlertTriangle, Coins, FileText, Gift,
  Compass, Calendar, Plane, MapPin
} from "lucide-react";
import { ChatMessage, AccountsState } from "../types";

interface AgentChatbotProps {
  accountsState: AccountsState;
  chatbotMessages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onRefreshData: () => void;
}

export default function AgentChatbot({ accountsState, chatbotMessages, onAddMessage, onRefreshData }: AgentChatbotProps) {
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [safarActionStates, setSafarActionStates] = useState<Record<string, string>>({});
<<<<<<< HEAD
  const [pendingQuery, setPendingQuery] = useState<string>("");
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
=======
  const chatBottomRef = useRef<HTMLDivElement>(null);
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1

  // Suggested direct agents mapping as specified
  const QUICK_PROMPTS = [
    {
      label: "🧠 1. Orchestrator Agent (Master)",
      text: "Who are you and how do you coordinate the other specialist agents?",
      file: null
    },
    {
      label: "🛡️ 2. Shield Agent (Security Check)",
<<<<<<< HEAD
      text: "Validate this WhatsApp screenshot for scam language, fake authority claims, and suspicious links.",
      file: null
=======
      text: "Validate this WhatsApp message: 'Your LHDN account is frozen, transfer money immediately to prevent arrest!'",
      file: "lhdn_threat.jpg"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
    },
    {
      label: "💰 3. Mizan Agent (Personal CFO)",
      text: "Can I afford high dining this weekend? Check my remaining budget.",
      file: null
    },
    {
      label: "🕌 4. Barakah Agent (Halal & Zakat)",
      text: "How do I calculate Zakat on my gold investments compliant with official Shariah guidelines?",
      file: null
    },
    {
      label: "🤲 5. Ehsan Agent (Elderly Support)",
      text: "Tolong semak baki akaun makcik dalam Bahasa Melayu",
      file: null
    },
    {
      label: "✈️ 6. Safar Agent (Travel Planner)",
      text: "I want to go to China for 7 days with a budget of RM3,000. Give me a feasibility check, flight hacks, and complete itinerary!",
      file: null
    }
  ];

<<<<<<< HEAD
  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1] || "");
        } else {
          reject(new Error("Unable to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const loadingStages = useMemo(() => {
    const lower = pendingQuery.toLowerCase();
    if (/budget|afford|save|savings|car|purchase|buy|cost/.test(lower)) {
      return [
        "Reading your affordability question",
        "Checking live budget and savings",
        "Calculating monthly car capacity",
        "Preparing buffer warnings and next steps",
      ];
    }

    if (/scam|fraud|urgent|otp|tac|frozen|transfer|lhdn|bank/.test(lower)) {
      return [
        "Scanning the message for scam pressure",
        "Checking registry and fraud signals",
        "Drafting a safe response",
        "Preparing next-action advice",
      ];
    }

    if (/zakat|halal|shariah|riba|investment|contract/.test(lower)) {
      return [
        "Reading the Shariah question",
        "Checking halal and contract terms",
        "Pulling JAKIM guidance",
        "Writing a careful compliance answer",
      ];
    }

    if (/travel|trip|flight|hotel|itinerary/.test(lower)) {
      return [
        "Reading your travel plan",
        "Checking route and budget feasibility",
        "Building a trip structure",
        "Preparing booking actions",
      ];
    }

    return [
      "Reading your message",
      "Routing to the right specialist",
      "Preparing a useful answer",
      "Finalizing response details",
    ];
  }, [pendingQuery]);

  useEffect(() => {
    if (!isSending) {
      setLoadingStageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStageIndex((current) => (current + 1) % loadingStages.length);
    }, 1100);

    return () => window.clearInterval(timer);
  }, [isSending, loadingStages.length]);
=======
  // Mock visual OCR files
  const MOCK_FILES: Record<string, string> = {
    "lhdn_threat.jpg": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // minimal dummy base64
  };
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1

  const handleSendMessage = async (customText?: string, fileToInject?: string | null) => {
    const textToSend = customText || userInput;
    const activeFile = fileToInject || selectedFileLabel;
<<<<<<< HEAD
    const base64Content = selectedFileBase64;
=======
    const base64Content = activeFile ? MOCK_FILES[activeFile] : selectedFileBase64;
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1

    if (!textToSend.trim() && !activeFile) return;

    // 1. User Message
    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend || `View visual attachment: ${activeFile}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: base64Content ? `data:image/jpeg;base64,${base64Content}` : undefined
    };

    onAddMessage(userMsg);
<<<<<<< HEAD
    setPendingQuery(textToSend || activeFile || "");
=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
    setUserInput("");
    setSelectedFileLabel(null);
    setSelectedFileBase64(null);
    setIsSending(true);

    // Scroll chat boundary
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // 2. Query Full-Stack Orchestrator backend
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          elderlyActive: accountsState.elderlyMode,
<<<<<<< HEAD
          isVoice: false,
=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
          imageBase64: base64Content || undefined
        })
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: data.responseText,
        agent: data.agent,
        tip: data.tip,
<<<<<<< HEAD
        mode: data.mode,
        confidence: data.confidence,
        reasoning: data.reasoning,
        evidence: data.evidence,
        sources: data.sources,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionNeeded: data.actionNeeded,
        actionDetails: data.actionDetails,
        structured: data.structured
      };

      onAddMessage(botMsg);
      setPendingQuery("");
=======
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionNeeded: data.actionNeeded,
        actionDetails: data.actionDetails
      };

      onAddMessage(botMsg);
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1

      // Auto trigger refresh if emergency funds activated
      if (data.actionNeeded) {
        onRefreshData();
      }

    } catch (err) {
      console.error("Chat orchestration error: ", err);
      onAddMessage({
        id: `msg-bot-fail-${Date.now()}`,
        sender: "bot",
        text: "My apologies. Our core Shariah ledger is undergoing routine maintenance. Please try your question again in a minute.",
        agent: "Orchestrator",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsSending(false);
<<<<<<< HEAD
      setPendingQuery("");
=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

<<<<<<< HEAD
  // Auto-calc connected portfolio zakat (calls backend demo endpoint)
  const autoCalculatePortfolio = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/zakat/auto-calc', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-bot-zakat-${Date.now()}`,
        sender: 'bot',
        text: `Auto-calculated portfolio value: ${data.portfolioValue}. Zakat due: ${data.zakatDue}`,
        agent: 'Barakah',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: 95,
        reasoning: 'Auto-calculation from connected portfolio',
        structured: {
          zakatStructured: {
            nisabThreshold: { amount: '85 grams', value: data.nisab },
            haulPeriod: { duration: '1 Gregorian Year', days: '365 days', requirement: 'Asset must be held continuously for minimum 1 year' },
            zakatRate: '2.5% (per annum)',
            calculation: {
              formula: data.details?.formula || '[Total Portfolio Value] × 2.5%',
              example: {
                assetHeld: data.portfolioValue,
                unitPrice: 'Market value',
                totalValue: data.portfolioValue,
                zakatDue: data.zakatDue
              }
            },
            suggestedActions: [
              `Verify holdings exceed 85 grams (${data.nisab})`,
              'Confirm Haul period completion',
              'Calculate current market value',
              `Apply 2.5% zakat formula to ${data.portfolioValue}`
            ]
          }
        }
      };

      onAddMessage(botMsg);
      onRefreshData();
    } catch (e) {
      console.error('Auto-calc failed', e);
      onAddMessage({ id: `msg-bot-zakatfail-${Date.now()}`, sender: 'bot', text: 'Auto-calculation failed. Please try again later.', agent: 'Barakah', time: new Date().toLocaleTimeString() });
    } finally {
      setIsSending(false);
    }
  };

  const payCurrentZakat = async (structuredBlock?: any) => {
    // Try to extract amount (supports formats like 'RM 875')
    const candidate = structuredBlock?.zakatStructured?.calculation?.example?.zakatDue || structuredBlock?.zakatStructured?.calculation?.example?.totalValue;
    if (!candidate) {
      onAddMessage({ id: `msg-bot-payfail-${Date.now()}`, sender: 'bot', text: 'No calculated Zakat found. Please use Auto-Calculate first.', agent: 'Barakah', time: new Date().toLocaleTimeString() });
      return;
    }

    const amt = parseFloat(String(candidate).replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      onAddMessage({ id: `msg-bot-payfail-${Date.now()}`, sender: 'bot', text: 'Unable to determine Zakat amount from calculation.', agent: 'Barakah', time: new Date().toLocaleTimeString() });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/zakat/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Payment failed');

      const botMsg: ChatMessage = {
        id: `msg-bot-paid-${Date.now()}`,
        sender: 'bot',
        text: `Zakat payment successful: ${data.paid}. Transaction id: ${data.transaction?.id}`,
        agent: 'Barakah',
        time: new Date().toLocaleTimeString(),
        confidence: 99,
        structured: { payment: data }
      };
      onAddMessage(botMsg);
      onRefreshData();
    } catch (e: any) {
      console.error('Pay zakat failed', e);
      onAddMessage({ id: `msg-bot-payerr-${Date.now()}`, sender: 'bot', text: `Payment failed: ${e.message || e}`, agent: 'Barakah', time: new Date().toLocaleTimeString() });
    } finally {
      setIsSending(false);
    }
  };

=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
  const getAgentStyles = (agentName?: string) => {
    switch (agentName) {
      case "Shield":
        return {
          banner: "bg-rose-50 border-rose-200 text-rose-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-rose-50 via-white to-white border-rose-200 shadow-[0_18px_50px_rgba(244,63,94,0.12)]",
          accent: "bg-rose-500",
          rail: "from-rose-500 via-rose-400 to-orange-400",
          icon: <Shield className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />,
          title: "Shield Agent 🛡️",
          subtitle: "Fraud, Security & Mule Defense",
          mission: "Lock the threat down fast.",
          chip: "text-rose-700 bg-rose-100 border-rose-200"
=======
          icon: <Shield className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />,
          title: "Shield Agent 🛡️",
          subtitle: "Fraud, Security & Mule Defense"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
      case "Mizan":
        return {
          banner: "bg-teal-50 border-teal-200 text-teal-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-teal-50 via-white to-white border-teal-200 shadow-[0_18px_50px_rgba(13,148,136,0.12)]",
          accent: "bg-teal-500",
          rail: "from-teal-500 via-emerald-400 to-cyan-400",
          icon: <BarChart2 className="w-4 h-4 text-teal-600 shrink-0" />,
          title: "Mizan CFO 💰",
          subtitle: "Bio-Behavioral Ledger & Savings",
          mission: "Turn cash flow into a clear plan.",
          chip: "text-teal-700 bg-teal-100 border-teal-200"
=======
          icon: <BarChart2 className="w-4 h-4 text-teal-600 shrink-0" />,
          title: "Mizan CFO 💰",
          subtitle: "Bio-Behavioral Ledger & Savings"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
      case "Barakah":
        return {
          banner: "bg-amber-50 border-amber-200 text-amber-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200 shadow-[0_18px_50px_rgba(245,158,11,0.13)]",
          accent: "bg-amber-500",
          rail: "from-amber-500 via-yellow-400 to-emerald-400",
          icon: <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />,
          title: "Barakah Expert 🕌",
          subtitle: "Strict Islamic Shariah Compliance",
          mission: "Keep the contract clean and halal.",
          chip: "text-amber-700 bg-amber-100 border-amber-200"
=======
          icon: <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />,
          title: "Barakah Expert 🕌",
          subtitle: "Strict Islamic Shariah Compliance"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
      case "Ehsan":
        return {
          banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200 shadow-[0_18px_50px_rgba(16,185,129,0.12)]",
          accent: "bg-emerald-500",
          rail: "from-emerald-500 via-lime-400 to-sky-400",
          icon: <Heart className="w-4 h-4 text-emerald-600 shrink-0" />,
          title: "Ehsan Assistance 🤲",
          subtitle: "Accessibility & Elderly Compassion Center",
          mission: "Make the message gentle and clear.",
          chip: "text-emerald-700 bg-emerald-100 border-emerald-200"
=======
          icon: <Heart className="w-4 h-4 text-emerald-600 shrink-0" />,
          title: "Ehsan Assistance 🤲",
          subtitle: "Accessibility & Elderly Compassion Center"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
      case "Safar":
        return {
          banner: "bg-blue-50 border-blue-200 text-blue-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-sky-50 via-white to-white border-sky-200 shadow-[0_18px_50px_rgba(59,130,246,0.12)]",
          accent: "bg-sky-500",
          rail: "from-sky-500 via-indigo-400 to-violet-400",
          icon: <Compass className="w-4 h-4 text-blue-600 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />,
          title: "Safar Strategist ✈️",
          subtitle: "AI Trip Optimizer & Budget Planner",
          mission: "Map the trip before the booking.",
          chip: "text-sky-700 bg-sky-100 border-sky-200"
=======
          icon: <Compass className="w-4 h-4 text-blue-600 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />,
          title: "Safar Strategist ✈️",
          subtitle: "AI Trip Optimizer & Budget Planner"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
      default:
        return {
          banner: "bg-slate-50 border-slate-200 text-slate-800",
<<<<<<< HEAD
          shell: "bg-gradient-to-br from-slate-50 via-white to-white border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
          accent: "bg-slate-500",
          rail: "from-slate-500 via-slate-400 to-slate-300",
          icon: <Sparkles className="w-4 h-4 text-bimb-red shrink-0" />,
          title: "The Orchestrator 🧠",
          subtitle: "Multi-Agent Router Core",
          mission: "Route the question to the right specialist.",
          chip: "text-slate-700 bg-slate-100 border-slate-200"
=======
          icon: <Sparkles className="w-4 h-4 text-bimb-red shrink-0" />,
          title: "The Orchestrator 🧠",
          subtitle: "Multi-Agent Router Cop"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        };
    }
  };

  return (
    <div id="ai-orchestrator-chatbot" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3 shrink-0">
        <div className="w-9 h-9 bg-bimb-red text-white flex items-center justify-center rounded-xl font-display font-black text-sm">
          Be
        </div>
        <div>
          <h3 className="font-display font-bold text-sm tracking-tight text-slate-900">
            {accountsState.elderlyMode ? "Friendly AI Assistant" : "AI Multi-Agent Orchestrator"}
          </h3>
          <p className="text-[10px] text-slate-400">
            {accountsState.elderlyMode ? "Hold or tap buttons below to talk or check safety tips." : "6 Active Cores: Orchestrator, Shield, Mizan, Barakah, Ehsan, and Safar."}
          </p>
        </div>
      </div>

<<<<<<< HEAD
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const base64 = await readFileAsBase64(file);
            setSelectedFileLabel(file.name);
            setSelectedFileBase64(base64);
          } catch (error) {
            console.error(error);
          }
        }}
      />

=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
      {/* Suggestion Bubbles */}
      <div className="flex gap-2 pb-3 overflow-x-auto shrink-0 no-scrollbar">
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp.text, qp.file)}
            className="bg-slate-50 hover:bg-bimb-peach hover:text-bimb-red border border-slate-100 text-[11px] font-medium text-slate-600 px-3 py-1.5 rounded-full shrink-0 cursor-pointer transition-colors"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
<<<<<<< HEAD
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 mb-3 select-auto">
=======
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 mb-3 select-none">
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
        {chatbotMessages.map((msg) => {
          const isBot = msg.sender === "bot";
          const agentConfig = isBot ? getAgentStyles(msg.agent) : null;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isBot ? "self-start mr-auto align-left text-left" : "self-end ml-auto align-right text-right"
              } space-y-1`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-semibold text-slate-400">
                  {isBot ? agentConfig?.title : "You"} • {msg.time}
                </span>
<<<<<<< HEAD
                {isBot && msg.mode && (
                  <span className="text-[8px] uppercase font-black tracking-wide px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                    {msg.mode}
                  </span>
                )}
                {isBot && typeof msg.confidence === "number" && (
                  <span className="text-[8px] uppercase font-black tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    {msg.confidence}% confidence
                  </span>
                )}
=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
              </div>

              {/* Msg Box */}
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isBot
<<<<<<< HEAD
                    ? `${agentConfig?.shell || "bg-slate-50 border-slate-100 text-slate-800"} rounded-tl-xs`
                    : "bg-bimb-red border-bimb-darkred text-white rounded-tr-xs"
                }`}
              >
                {isBot && agentConfig && (
                  <div className="mb-3 overflow-hidden rounded-[20px] border border-black/5 bg-white/80">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${agentConfig.rail}`} />
                    <div className="flex items-start justify-between gap-3 px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 h-3.5 w-3.5 rounded-full ${agentConfig.accent} shadow-lg`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Specialist response</p>
                          <p className="mt-0.5 text-[12px] font-semibold text-slate-900">{agentConfig.title}</p>
                          <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-500">{agentConfig.mission}</p>
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${agentConfig.chip}`}>
                        {agentConfig.subtitle}
                      </span>
                    </div>
                  </div>
                )}

=======
                    ? "bg-slate-50 border-slate-100 text-slate-800 rounded-tl-xs"
                    : "bg-bimb-red border-bimb-darkred text-white rounded-tr-xs"
                }`}
              >
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
                {/* Visual Image component if any */}
                {msg.image && (
                  <div className="mb-2 bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-bimb-gold animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-300 font-semibold">[Vision OCR Screenshot Processing]</span>
                  </div>
                )}
                
<<<<<<< HEAD
                {/* Only show plain text if no structured data */}
                {!msg.structured && (
                  accountsState.elderlyMode ? (
                    <p className="text-sm font-semibold whitespace-pre-line leading-6">{msg.text}</p>
                  ) : (
                    <p className="whitespace-pre-line leading-6">{msg.text}</p>
                  )
                )}

                {isBot && msg.reasoning && (
                  <div className={`mt-2 rounded-xl border px-3 py-2 text-[10px] leading-relaxed ${agentConfig?.banner || "border-slate-200 bg-white text-slate-500"}`}>
                    <span className="font-black uppercase tracking-wider text-slate-400">Why this agent</span>
                    <p className="mt-1">{msg.reasoning}</p>
                  </div>
                )}

                {/* Mizan Structured Data: Decision Status, Financial Summary, AI Analysis, Recommendation */}
                {isBot && msg.agent === "Mizan" && msg.structured && (
                  <div className="mt-3 space-y-2.5">
                    {/* Decision Status */}
                    {msg.structured.decisionStatus && (
                      <div className="rounded-2xl border border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-teal-700 mb-2">📊 Decision</p>
                        <p className="text-base font-black text-teal-900">{msg.structured.decisionStatus}</p>
                      </div>
                    )}

                    {/* Financial Summary */}
                    {msg.structured.financialSummary && (
                      <div className="rounded-2xl border border-teal-200 bg-white p-3.5 shadow-sm">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-teal-700 mb-2">💳 Cash Position</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(msg.structured.financialSummary).map(([key, value]) => (
                            <div key={key} className="border-l-3 border-l-teal-400 bg-teal-50 rounded-lg p-2.5">
                              <p className="font-semibold text-[8px] text-teal-600 uppercase tracking-wider">{key === "purchaseAmount" ? "💰 Purchase" : key === "currentAvailableBalance" ? "💵 Balance" : key === "monthlyEntertainmentBudgetRemaining" ? "🎭 Monthly" : "📈 After"}</p>
                              <p className="text-sm font-black text-teal-900 mt-1">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {msg.structured.aiAnalysis && (
                      <div className="rounded-2xl border border-teal-200 bg-white p-3.5 shadow-sm">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-teal-700 mb-2">🤖 Analysis</p>
                        <div className="space-y-1.5">
                          {Object.entries(msg.structured.aiAnalysis).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1.5 border-b border-teal-100 last:border-0">
                              <span className="font-bold text-[9px] text-teal-600 uppercase">{key === "affordability" ? "Affordability" : key === "budgetImpact" ? "Budget Hit" : key === "behaviorPattern" ? "Pattern" : key === "impulseIndicator" ? "Impulse" : "Reason"}</span>
                              <span className="text-sm font-black text-teal-900 text-right">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {msg.structured.recommendation && (
                      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-emerald-700 mb-2">✅ Recommendation</p>
                        <div className="space-y-2">
                          <div>
                            <span className="font-bold text-[8px] text-emerald-600 uppercase">GO AHEAD:</span>
                            <p className="text-sm font-semibold text-emerald-900 mt-1">{msg.structured.recommendation.suggestedAction}</p>
                          </div>
                          <div className="border-t border-emerald-200 pt-2 mt-2">
                            <span className="font-bold text-[8px] text-emerald-600 uppercase">OR TRY:</span>
                            <p className="text-sm font-semibold text-emerald-900 mt-1">{msg.structured.recommendation.alternative}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ask Further Buttons */}
                    {msg.structured.askFurther && msg.structured.askFurther.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.structured.askFurther.map((action: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(`${action} on my current budget`)}
                            className="text-[10px] bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all shadow-sm hover:shadow-md"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Shield Structured Data: Security Result, Threat Analysis, Risk Score, Recommended Actions */}
                {isBot && msg.agent === "Shield" && msg.structured && (
                  <div className="mt-3 space-y-2.5">
                    {/* Security Result */}
                    {msg.structured.securityResult && (
                      <div className={`rounded-2xl border-2 p-3.5 shadow-md ${msg.structured.securityResult === "HIGH_FRAUD_RISK" ? "border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50" : "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50"}`}>
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-rose-700">🚨 Threat Level</p>
                        <p className={`text-lg font-black mt-2 ${msg.structured.securityResult === "HIGH_FRAUD_RISK" ? "text-rose-900" : "text-orange-900"}`}>
                          {msg.structured.securityResult === "HIGH_FRAUD_RISK" ? "🔴 HIGH RISK" : "🟠 MODERATE RISK"}
                        </p>
                      </div>
                    )}

                    {/* Risk Score with Visual Bar */}
                    {msg.structured.riskScore && (
                      <div className="rounded-2xl border border-rose-200 bg-white p-3.5 shadow-sm">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-rose-700 mb-2">📊 Risk Score</p>
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden border border-rose-200">
                              <div
                                className={`h-full transition-all ${msg.structured.riskScore > 70 ? "bg-gradient-to-r from-rose-500 to-red-600" : msg.structured.riskScore > 40 ? "bg-gradient-to-r from-orange-400 to-rose-500" : "bg-gradient-to-r from-yellow-400 to-orange-400"}`}
                                style={{ width: `${msg.structured.riskScore}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-black text-2xl text-rose-900 w-12 text-right">{msg.structured.riskScore}</span>
                        </div>
                      </div>
                    )}

                    {/* Threat Analysis */}
                    {msg.structured.threatAnalysis && (
                      <div className="rounded-2xl border border-rose-200 bg-white p-3.5 shadow-sm">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-rose-700 mb-2.5">🚩 Red Flags Detected</p>
                        {msg.structured.threatAnalysis.detectedSignals && msg.structured.threatAnalysis.detectedSignals.length > 0 && (
                          <div className="space-y-1.5 mb-2">
                            {msg.structured.threatAnalysis.detectedSignals.map((signal: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2.5 bg-rose-50 p-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="text-sm font-semibold text-rose-800">{signal}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.structured.threatAnalysis.why && (
                          <p className="text-[9px] text-rose-700 italic bg-rose-50 p-2 rounded-lg border-l-3 border-l-rose-400">{msg.structured.threatAnalysis.why}</p>
                        )}
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {msg.structured.recommendedActions && msg.structured.recommendedActions.length > 0 && (
                      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-emerald-700 mb-2.5">✅ What to Do</p>
                        <div className="space-y-1.5">
                          {msg.structured.recommendedActions.map((action: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-sm font-semibold text-emerald-900">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safer Alternative */}
                    {msg.structured.saferAlternative && (
                      <div className="rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-sky-700 mb-1.5">💡 Safe Alternative</p>
                        <p className="text-sm font-semibold text-sky-900">{msg.structured.saferAlternative}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Barakah Structured Data: Compliance Status, Shariah Assessment */}
                {isBot && msg.agent === "Barakah" && msg.structured && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => autoCalculatePortfolio()}
                        className="text-[12px] font-bold px-3 py-2 rounded-xl bg-amber-600 text-white hover:opacity-95"
                      >
                        Auto-Calculate My Connected Portfolio
                      </button>
                      <button
                        onClick={() => payCurrentZakat(msg.structured)}
                        className="text-[12px] font-bold px-3 py-2 rounded-xl bg-emerald-600 text-white hover:opacity-95"
                      >
                        Pay Zakat via Be U (Mock)
                      </button>
                    </div>
                    {/* Compliance Status */}
                    {msg.structured.complianceStatus && (
                      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-700 mb-2">🕌 Shariah Status</p>
                        <p className="text-lg font-black text-amber-900">{msg.structured.complianceStatus}</p>
                      </div>
                    )}

                    {/* ZAKAT STRUCTURED - Nisab & Haul Conditions */}
                    {msg.structured.zakatStructured && (
                      <div className="space-y-2.5">
                        {/* Nisab Condition */}
                        {msg.structured.zakatStructured.nisabThreshold && (
                          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-800 mb-2">📊 Condition 1: Nisab Threshold</p>
                            <div className="space-y-1.5">
                              <p className="text-sm font-bold text-amber-900">Minimum {msg.structured.zakatStructured.nisabThreshold.amount}</p>
                              <p className="text-xs text-amber-800">Equivalent to: {msg.structured.zakatStructured.nisabThreshold.value}</p>
                              <p className="text-[10px] italic text-amber-700 mt-2">Must hold at least this amount to be eligible for Zakat obligation.</p>
                            </div>
                          </div>
                        )}

                        {/* Haul Condition */}
                        {msg.structured.zakatStructured.haulPeriod && (
                          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-yellow-100 to-amber-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-800 mb-2">⏱️ Condition 2: Haul Period</p>
                            <div className="space-y-1.5">
                              <p className="text-sm font-bold text-amber-900">{msg.structured.zakatStructured.haulPeriod.duration}</p>
                              <p className="text-xs text-amber-800">{msg.structured.zakatStructured.haulPeriod.days}</p>
                              <p className="text-[10px] italic text-amber-700 mt-2">{msg.structured.zakatStructured.haulPeriod.requirement}</p>
                            </div>
                          </div>
                        )}

                        {/* Calculation Formula & Example */}
                        {msg.structured.zakatStructured.calculation && (
                          <div className="rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-emerald-800 mb-2">🧮 Calculation Formula</p>
                            <p className="text-sm font-bold text-emerald-900 mb-3">{msg.structured.zakatStructured.calculation.formula}</p>
                            
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-2">📝 Step-by-Step Example:</p>
                            <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-1.5">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-emerald-700 font-semibold">Asset Held:</span>
                                <span className="font-bold text-emerald-900">{msg.structured.zakatStructured.calculation.example.assetHeld}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-emerald-700 font-semibold">Unit Price:</span>
                                <span className="font-bold text-emerald-900">{msg.structured.zakatStructured.calculation.example.unitPrice}</span>
                              </div>
                              <div className="border-t border-emerald-200 pt-2 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-emerald-700 font-semibold">Total Value:</span>
                                  <span className="font-bold text-emerald-900">{msg.structured.zakatStructured.calculation.example.totalValue}</span>
                                </div>
                              </div>
                              <div className="bg-emerald-50 border-l-4 border-l-emerald-500 p-2.5 mt-2.5 rounded">
                                <p className="text-[9px] font-black text-emerald-700 uppercase">Calculation:</p>
                                <p className="text-xs font-bold text-emerald-900 mt-1">{msg.structured.zakatStructured.calculation.example.totalValue} × 2.5% = <span className="text-lg">{msg.structured.zakatStructured.calculation.example.zakatDue}</span></p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Eligible Recipients */}
                        {msg.structured.zakatStructured.eligibleCategories && (
                          <div className="rounded-2xl border border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-purple-800 mb-2">👥 8 Eligible Categories for Zakat Distribution</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {msg.structured.zakatStructured.eligibleCategories.map((cat: string, idx: number) => (
                                <div key={idx} className="bg-white border border-purple-200 rounded-lg p-2">
                                  <p className="text-[9px] font-bold text-purple-800">{idx + 1}. {cat}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Actions */}
                        {msg.structured.zakatStructured.suggestedActions && (
                          <div className="rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-sky-800 mb-2">✅ Next Steps (5-Step Process)</p>
                            <div className="space-y-1.5">
                              {msg.structured.zakatStructured.suggestedActions.map((action: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="bg-sky-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px] font-bold">{idx + 1}</span>
                                  <span className="text-sky-900 font-semibold">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* HALAL STRUCTURED - Investment Assessment */}
                    {msg.structured.halalStructured && (
                      <div className="space-y-2.5">
                        {/* Verdict */}
                        {msg.structured.halalStructured.verdict && (
                          <div className={`rounded-2xl border-2 p-3.5 shadow-md ${
                            msg.structured.halalStructured.riskLevel === "High" ? "border-orange-400 bg-gradient-to-br from-orange-50 to-red-50" :
                            msg.structured.halalStructured.riskLevel === "Medium" ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50" :
                            "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50"
                          }`}>
                            <p className={`font-black text-[9px] uppercase tracking-[0.1em] mb-2 ${
                              msg.structured.halalStructured.riskLevel === "High" ? "text-orange-800" :
                              msg.structured.halalStructured.riskLevel === "Medium" ? "text-yellow-800" :
                              "text-emerald-800"
                            }`}>🕌 Halal Assessment</p>
                            <p className={`text-lg font-black ${
                              msg.structured.halalStructured.riskLevel === "High" ? "text-orange-900" :
                              msg.structured.halalStructured.riskLevel === "Medium" ? "text-yellow-900" :
                              "text-emerald-900"
                            }`}>{msg.structured.halalStructured.verdict}</p>
                            <p className="text-xs mt-2 italic">Risk Level: {msg.structured.halalStructured.riskLevel}</p>
                          </div>
                        )}

                        {/* 5-Point Halal Checklist */}
                        {msg.structured.halalStructured.checklist && (
                          <div className="rounded-2xl border border-amber-300 bg-white p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-800 mb-2.5">✅ 5-Point Halal Checklist</p>
                            <div className="space-y-2">
                              {msg.structured.halalStructured.checklist.map((item: any, idx: number) => (
                                <div key={idx} className="border-l-4 border-l-amber-400 bg-amber-50 p-2.5 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-[9px] text-amber-900 uppercase">{idx + 1}. {item.category}</p>
                                    <p className={`text-[9px] font-black ${
                                      item.status.includes("✓") ? "text-emerald-700" :
                                      item.status.includes("✗") ? "text-rose-700" :
                                      "text-yellow-700"
                                    }`}>{item.status}</p>
                                  </div>
                                  <p className="text-[8px] text-amber-700">{item.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Guiding Principles */}
                        {msg.structured.halalStructured.guidingPrinciples && (
                          <div className="rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-indigo-800 mb-2.5">📖 Shariah Guiding Principles</p>
                            <div className="space-y-1.5">
                              {msg.structured.halalStructured.guidingPrinciples.map((principle: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                  <p className="text-xs text-indigo-900 font-semibold">{principle}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {msg.structured.halalStructured.suggestedActions && (
                          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-3.5 shadow-md">
                            <p className="font-black text-[9px] uppercase tracking-[0.1em] text-emerald-800 mb-2">✅ Recommended Actions</p>
                            <div className="space-y-1.5">
                              {msg.structured.halalStructured.suggestedActions.map((action: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="text-sm font-semibold text-emerald-900">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shariah Assessment (Fallback for both types) */}
                    {msg.structured.shariahAssessment && !msg.structured.zakatStructured && !msg.structured.halalStructured && (
                      <div className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-sm">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-700 mb-2.5">📖 Halal Checks</p>
                        <div className="space-y-1.5">
                          {Array.isArray(msg.structured.shariahAssessment) ? (
                            msg.structured.shariahAssessment.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2.5 bg-amber-50 p-2.5 rounded-lg">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-sm font-semibold text-amber-900">{item}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm font-semibold text-amber-900">{String(msg.structured.shariahAssessment)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {msg.structured.explanation && (
                      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-yellow-50 to-amber-50 p-3.5 shadow-md">
                        <p className="font-black text-[9px] uppercase tracking-[0.1em] text-amber-700 mb-2">💭 Shariah Details</p>
                        <p className="text-sm font-semibold text-amber-900 leading-relaxed">{msg.structured.explanation}</p>
                      </div>
                    )}
                  </div>
=======
                {accountsState.elderlyMode ? (
                  // Simple human friendly output translation
                  <p className="text-sm font-semibold">{msg.text}</p>
                ) : (
                  <p>{msg.text}</p>
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
                )}

                {/* Sub-card active recommendations */}
                {isBot && msg.tip && (
<<<<<<< HEAD
                  <div className={`mt-2.5 rounded-xl border px-3 py-2 flex items-start gap-2 text-[10px] font-medium ${agentConfig?.banner || "border-slate-200 bg-white text-slate-500"}`}>
                    {msg.agent === "Shield" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    ) : msg.agent === "Barakah" ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : msg.agent === "Safar" ? (
                      <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    ) : msg.agent === "Ehsan" ? (
                      <Heart className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                    )}
                    <span className="whitespace-pre-line leading-5">{msg.tip}</span>
                  </div>
                )}

                {isBot && msg.evidence && msg.evidence.length > 0 && !msg.structured && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {msg.evidence.map((item) => (
                      <div key={`${msg.id}-${item.label}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px]">
                        <p className="font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isBot && msg.sources && msg.sources.length > 0 && !msg.structured && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.sources.map((source) => (
                      <div key={`${msg.id}-${source.title}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] text-slate-600">
                        <span className="font-black uppercase tracking-wider text-slate-400">{source.title}</span>
                        <span className="ml-1">{source.note}</span>
                      </div>
                    ))}
                  </div>
                )}

=======
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-start gap-1 text-[10px] text-slate-500 font-medium">
                    {msg.agent === "Shield" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    )}
                    <span>{msg.tip}</span>
                  </div>
                )}

                {/* Simulated Emergency Activation */}
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
                {msg.actionNeeded && msg.actionDetails && (
                  <div className="mt-3 bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-bimb-gold font-bold uppercase tracking-wider">
                      <Heart className="w-3.5 h-3.5 animate-pulse" />
<<<<<<< HEAD
                      {msg.actionDetails.type.replace(/_/g, " ")}
                    </div>
                    <p className="text-[10px] text-slate-300">{msg.actionDetails.message}</p>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Action requested
                      </span>
                      <span className="text-[9px] text-slate-400">Backend response ready for follow-up.</span>
=======
                      Musafir Emergency Active
                    </div>
                    <p className="text-[10px] text-slate-300">{msg.actionDetails.message}</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        ✓ RM 100 Deposited
                      </span>
                      <span className="text-[9px] text-slate-400">Guardian Sarafina was alerted.</span>
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
                    </div>
                  </div>
                )}

                {/* Safar Travel Segment Actions (Plan -> Decide -> Execute) */}
                {isBot && msg.agent === "Safar" && (
                  <div className="mt-3 bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 space-y-3 text-white shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: "12s" }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 font-mono">Safar Action Layer</span>
                      </div>
                      <span className="text-[8.5px] bg-sky-950 text-sky-300 font-bold px-2 py-0.5 rounded border border-sky-500/20 font-mono">
                        PLAN • DECIDE • EXECUTE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {/* Flight */}
                      <button
                        onClick={() => {
                          setSafarActionStates(prev => ({ ...prev, [`${msg.id}-flight`]: "booked" }));
                        }}
                        className={`flex flex-col p-2 rounded-xl border text-left transition-all ${
                          safarActionStates[`${msg.id}-flight`] === "booked"
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-sky-500/30 text-slate-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold uppercase tracking-wider block text-[7.5px] text-slate-400">1. FLIGHT WINDOW</span>
                          <Plane className="w-3 h-3 text-sky-400" />
                        </div>
                        <span className="font-extrabold text-[10.5px] mt-1 block leading-tight">
                          {safarActionStates[`${msg.id}-flight`] === "booked" ? "✓ Skyscanner Booked" : "Book Skyscanner Flight"}
                        </span>
                        <span className="text-[8.5px] text-slate-400 mt-0.5 block leading-none">Feasible: RM 1,420 return</span>
                      </button>

                      {/* Hotel */}
                      <button
                        onClick={() => {
                          setSafarActionStates(prev => ({ ...prev, [`${msg.id}-hotel`]: "booked" }));
                        }}
                        className={`flex flex-col p-2 rounded-xl border text-left transition-all ${
                          safarActionStates[`${msg.id}-hotel`] === "booked"
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-sky-500/30 text-slate-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold uppercase tracking-wider block text-[7.5px] text-slate-400">2. HOTEL OPTIMIZER</span>
                          <MapPin className="w-3 h-3 text-sky-400" />
                        </div>
                        <span className="font-extrabold text-[10.5px] mt-1 block leading-tight">
                          {safarActionStates[`${msg.id}-hotel`] === "booked" ? "✓ Booking.com Reserved" : "Reserve Booking.com Stay"}
                        </span>
                        <span className="text-[8.5px] text-slate-400 mt-0.5 block leading-none">Metro Proximity Hubs</span>
                      </button>

                      {/* Transit */}
                      <button
                        onClick={() => {
                          setSafarActionStates(prev => ({ ...prev, [`${msg.id}-transport`]: "booked" }));
                        }}
                        className={`flex flex-col p-2 rounded-xl border text-left transition-all ${
                          safarActionStates[`${msg.id}-transport`] === "booked"
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-sky-500/30 text-slate-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold uppercase tracking-wider block text-[7.5px] text-slate-400">3. IN-COUNTRY TRANSIT</span>
                          <span className="font-bold text-sky-400 leading-none text-xs font-mono">¥</span>
                        </div>
                        <span className="font-extrabold text-[10.5px] mt-1 block leading-tight">
                          {safarActionStates[`${msg.id}-transport`] === "booked" ? "✓ Metro Card Secured" : "Buy 7-Day Transit Pass"}
                        </span>
                        <span className="text-[8.5px] text-slate-400 mt-0.5 block leading-none">Metro Card Savings (RM 140)</span>
                      </button>

                      {/* Calendar */}
                      <button
                        onClick={() => {
                          setSafarActionStates(prev => ({ ...prev, [`${msg.id}-calendar`]: "booked" }));
                        }}
                        className={`flex flex-col p-2 rounded-xl border text-left transition-all ${
                          safarActionStates[`${msg.id}-calendar`] === "booked"
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-sky-500/30 text-slate-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold uppercase tracking-wider block text-[7.5px] text-slate-400">4. ITINERARY SYNC</span>
                          <Calendar className="w-3 h-3 text-sky-400" />
                        </div>
                        <span className="font-extrabold text-[10.5px] mt-1 block leading-tight">
                          {safarActionStates[`${msg.id}-calendar`] === "booked" ? "✓ Calendar Synced" : "Add Itinerary to Calendar"}
                        </span>
                        <span className="text-[8.5px] text-slate-400 mt-0.5 block leading-none">Auto alarm alerts</span>
                      </button>
                    </div>

                    {Object.keys(safarActionStates).filter(k => k.startsWith(msg.id)).length > 0 && (
                      <div className="mt-1 bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 p-2.5 rounded-xl text-[9.5px] leading-tight flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping grow-0 shrink-0" />
                        <span>Safar Action Lock Successful: Sync complete. Ticket summaries generated in Bank4U alerts folder.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isSending && (
<<<<<<< HEAD
          <div className="self-start max-w-[92%] rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] rounded-tl-xs">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bimb-red/10 text-bimb-red">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">AI is working</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">Preparing a detailed answer</div>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                {pendingQuery ? "Live analysis" : "Routing"}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {loadingStages.map((stage, index) => {
                const active = index === loadingStageIndex;
                return (
                  <div
                    key={stage}
                    className={`rounded-2xl border px-3 py-2 text-[10px] leading-relaxed transition-all ${
                      active
                        ? "border-bimb-red/30 bg-bimb-red/5 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-bimb-red animate-pulse" : "bg-slate-300"}`} />
                      <span className="font-semibold">{stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
              {pendingQuery ? `Question: ${pendingQuery}` : "Waiting for the next message..."}
            </div>
=======
          <div className="self-start max-w-[85%] bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-xs flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium italic">Routing query through NEURA Cognitive Agents...</span>
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Direct inputs field */}
      <div className="mt-auto shrink-0 space-y-2">
        {selectedFileLabel && (
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
<<<<<<< HEAD
            <span className="font-mono text-[10px] text-slate-600 font-bold">📄 Screenshot: {selectedFileLabel}</span>
=======
            <span className="font-mono text-[10px] text-slate-600 font-bold">📄 Screenshot: {selectedFileLabel} (Fake Whatsapp Alert)</span>
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
            <button
              onClick={() => {
                setSelectedFileLabel(null);
                setSelectedFileBase64(null);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-semibold"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-2">
<<<<<<< HEAD
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            title="Attach screenshot or document"
=======
          {/* Mock attachment clip */}
          <button
            onClick={() => {
              setSelectedFileLabel("whatsapp_scam.jpg");
              setSelectedFileBase64(MOCK_FILES["lhdn_threat.jpg"]);
            }}
            title="Attach threat screenshot (Simulate Vision Scan)"
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
            className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${selectedFileLabel ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"}`}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            id="chat-user-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={accountsState.elderlyMode ? "Tanya saya soalan..." : "Ask Shield, Mizan, or Barakah Shariah agents..."}
            className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-bimb-red outline-none rounded-xl px-3.5 py-2.5 text-xs font-semibold"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!userInput.trim() && !selectedFileLabel}
            className="bg-bimb-red hover:bg-bimb-darkred disabled:opacity-40 text-white w-9.5 h-9.5 shrink-0 rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
