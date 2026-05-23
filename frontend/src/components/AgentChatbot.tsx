import React, { useState, useRef } from "react";
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Suggested direct agents mapping as specified
  const QUICK_PROMPTS = [
    {
      label: "🧠 1. Orchestrator Agent (Master)",
      text: "Who are you and how do you coordinate the other specialist agents?",
      file: null
    },
    {
      label: "🛡️ 2. Shield Agent (Security Check)",
      text: "Validate this WhatsApp message: 'Your LHDN account is frozen, transfer money immediately to prevent arrest!'",
      file: "lhdn_threat.jpg"
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

  // Mock visual OCR files
  const MOCK_FILES: Record<string, string> = {
    "lhdn_threat.jpg": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // minimal dummy base64
  };

  const handleSendMessage = async (customText?: string, fileToInject?: string | null) => {
    const textToSend = customText || userInput;
    const activeFile = fileToInject || selectedFileLabel;
    const base64Content = activeFile ? MOCK_FILES[activeFile] : selectedFileBase64;

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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionNeeded: data.actionNeeded,
        actionDetails: data.actionDetails
      };

      onAddMessage(botMsg);

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
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const getAgentStyles = (agentName?: string) => {
    switch (agentName) {
      case "Shield":
        return {
          banner: "bg-rose-50 border-rose-200 text-rose-800",
          icon: <Shield className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />,
          title: "Shield Agent 🛡️",
          subtitle: "Fraud, Security & Mule Defense"
        };
      case "Mizan":
        return {
          banner: "bg-teal-50 border-teal-200 text-teal-800",
          icon: <BarChart2 className="w-4 h-4 text-teal-600 shrink-0" />,
          title: "Mizan CFO 💰",
          subtitle: "Bio-Behavioral Ledger & Savings"
        };
      case "Barakah":
        return {
          banner: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />,
          title: "Barakah Expert 🕌",
          subtitle: "Strict Islamic Shariah Compliance"
        };
      case "Ehsan":
        return {
          banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: <Heart className="w-4 h-4 text-emerald-600 shrink-0" />,
          title: "Ehsan Assistance 🤲",
          subtitle: "Accessibility & Elderly Compassion Center"
        };
      case "Safar":
        return {
          banner: "bg-blue-50 border-blue-200 text-blue-800",
          icon: <Compass className="w-4 h-4 text-blue-600 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />,
          title: "Safar Strategist ✈️",
          subtitle: "AI Trip Optimizer & Budget Planner"
        };
      default:
        return {
          banner: "bg-slate-50 border-slate-200 text-slate-800",
          icon: <Sparkles className="w-4 h-4 text-bimb-red shrink-0" />,
          title: "The Orchestrator 🧠",
          subtitle: "Multi-Agent Router Cop"
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
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 mb-3 select-none">
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
              </div>

              {/* Msg Box */}
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isBot
                    ? "bg-slate-50 border-slate-100 text-slate-800 rounded-tl-xs"
                    : "bg-bimb-red border-bimb-darkred text-white rounded-tr-xs"
                }`}
              >
                {/* Visual Image component if any */}
                {msg.image && (
                  <div className="mb-2 bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-bimb-gold animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-300 font-semibold">[Vision OCR Screenshot Processing]</span>
                  </div>
                )}
                
                {accountsState.elderlyMode ? (
                  // Simple human friendly output translation
                  <p className="text-sm font-semibold">{msg.text}</p>
                ) : (
                  <p>{msg.text}</p>
                )}

                {/* Sub-card active recommendations */}
                {isBot && msg.tip && (
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
                {msg.actionNeeded && msg.actionDetails && (
                  <div className="mt-3 bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-bimb-gold font-bold uppercase tracking-wider">
                      <Heart className="w-3.5 h-3.5 animate-pulse" />
                      Musafir Emergency Active
                    </div>
                    <p className="text-[10px] text-slate-300">{msg.actionDetails.message}</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        ✓ RM 100 Deposited
                      </span>
                      <span className="text-[9px] text-slate-400">Guardian Sarafina was alerted.</span>
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
          <div className="self-start max-w-[85%] bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-xs flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium italic">Routing query through NEURA Cognitive Agents...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Direct inputs field */}
      <div className="mt-auto shrink-0 space-y-2">
        {selectedFileLabel && (
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-slate-600 font-bold">📄 Screenshot: {selectedFileLabel} (Fake Whatsapp Alert)</span>
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
          {/* Mock attachment clip */}
          <button
            onClick={() => {
              setSelectedFileLabel("whatsapp_scam.jpg");
              setSelectedFileBase64(MOCK_FILES["lhdn_threat.jpg"]);
            }}
            title="Attach threat screenshot (Simulate Vision Scan)"
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
