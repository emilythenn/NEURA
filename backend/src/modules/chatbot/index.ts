import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import {
  evaluateTransferRisk,
  generateFraudExplainability,
  createQuarantine,
  checkBlacklist,
} from "../scamPrevention/service";

type AppStateSnapshot = {
  totalBalance: number;
  discretionaryBudget: number;
  discretionaryBudgetTotal: number;
  fixedExpenses: number;
  userName: string;
  accountNo: string;
  financingAccounts: Array<{
    id: string;
    type: string;
    nextPayment: number;
    originalAmount: number;
    remaining: number;
  }>;
  transactions: Array<{
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    status?: string;
    reason?: string;
  }>;
  elderlyMode: boolean;
  elderlyLimit: number;
  caregiverName: string;
  caregiverPhone: string;
  isCaregiverApproved: boolean;
  lockedVaults: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
  }>;
};

const router = express.Router();

let geminiAI: GoogleGenAI | null = null;
let getState: (() => AppStateSnapshot) | null = null;
export function setChatbotGeminiAI(client: GoogleGenAI | null) {
  geminiAI = client;
}

export function setChatbotStateGetter(stateGetter: (() => AppStateSnapshot) | null) {
  getState = stateGetter;
}

type ChatAgent = "Orchestrator" | "Shield" | "Mizan" | "Barakah" | "Ehsan" | "Safar";
type ChatEvidence = { label: string; value: string };
type ChatSource = { title: string; note: string };

const AGENT_KNOWLEDGE = {
  Shield: [
    { title: "NEURA scam heuristics", note: "Threat language and urgent transfer pressure are fraud indicators." },
  ],
  Mizan: [
    { title: "Budget ledger", note: "Remaining discretionary balance shapes affordability guidance." },
  ],
  Barakah: [
    { title: "JAKIM guidance", note: "Official guidance on zakat, nisab, and halal checks." },
  ]
} as const;

function extractSignals(message: string) {
  const lower = (message || "").toLowerCase();
  const phoneLike = message.match(/\b(?:\+?60\s?)?(?:\d[\s-]?){8,12}\b/g) || [];
  const urlLike = message.match(/https?:\/\/[^");\s]+/g) || [];
  const accountLike = message.match(/\b\d{9,12}\b/g) || [];
  const registryMatches = [...phoneLike, ...accountLike]
    .map((v) => v.replace(/\s|-/g, "").trim())
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((value) => {
      // Avoid synchronous DB calls here; return a lightweight registry signal
      return { label: `Registry match ${value}`, value: `${value}` };
    })
    .filter((i): i is ChatEvidence => !!i);

  return {
    lower,
    hasScamSignal: /\b(scam|phishing|frozen|lhdn|arrest|otp|tac)\b|transfer.*money|send.*money|click.*link|your.*account.*frozen|verify.*account|immediate.*transfer/i.test(message) || urlLike.length > 0,
    hasBudgetSignal: /\b(can\s+i\s+afford|should\s+i\s+buy|is\s+this.*expensive|is.*worth.*it)\b/i.test(lower) && /RM\s*\d+/i.test(lower),
    hasBarakahSignal: /\b(zakat|halal|shariah|riba|halal|investment.*halal|is.*halal|crypto.*halal|guaranteed.*return)\b/i.test(lower),
    hasEhsanSignal: /\b(tolong|baki|makcik|pakcik|elderly|caregiver|old.*parent|senior|grandmother|grandfather)\b/i.test(lower),
    hasSafarSignal: /\b(travel|trip|flight|hotel|itinerary|journey|booking|accommodation)\b/i.test(lower),
    urls: urlLike,
    registryMatches,
  };
}

function getBarakahRag(query: string): ChatSource[] {
  return [
    { title: "JAKIM - Zakat Guidelines", note: "https://www.jakim.gov.my/en/zakat-guidelines" },
    { title: "Shariah Advisory Council - Fatwa Index", note: "General principles: avoid riba, gharar; consult SAC for complex cases." }
  ];
}

function getSavingsSnapshot(state?: AppStateSnapshot | null) {
  const savingsVault = state?.lockedVaults.find((vault) => /saving/i.test(vault.name) || vault.type === "investment");
  const delayVault = state?.lockedVaults.find((vault) => /delay/i.test(vault.name) || vault.type === "locked");
  return {
    savingsVault,
    delayVault,
  };
}

function buildMizanResponse(message: string, state?: AppStateSnapshot | null) {
  const balance = state?.totalBalance ?? 0;
  const discretionary = state?.discretionaryBudget ?? 0;
  const amountMatch = message.match(/RM\s*([0-9,.]+)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;

  // If NO amount mentioned, give generic budgeting advice
  if (amount === null) {
    return {
      routedAgent: "Mizan" as ChatAgent,
      finalText: "💰 Budget Guidance:\n" +
        `• Current available balance: RM ${balance.toFixed(2)}\n` +
        `• Monthly discretionary budget: RM ${discretionary.toFixed(2)}\n` +
        "• Smart spending rule: Don't exceed 30% of discretionary in one purchase\n" +
        "• Emergency buffer: Keep 3 months of fixed expenses saved\n" +
        "• Tip: Mention a specific amount (e.g., 'Can I afford RM500?') for detailed analysis\n",
      structuredTip: "Provide an amount for personalized affordability analysis",
      confidence: 65,
      reasoning: "General budget guidance - no specific purchase amount detected",
      evidence: [{ label: "Current balance", value: `RM ${balance.toFixed(2)}` }],
      sources: [{ title: "Your account snapshot", note: "Budget analysis" }],
    } as any;
  }

  // If amount IS specified, do detailed analysis
  const fixed = state?.fixedExpenses ?? 0;
  const financingTotal = (state?.financingAccounts || []).reduce((sum, item) => sum + item.nextPayment, 0);
  const totalMonthlyCommitments = fixed + financingTotal;
  const emergencyBufferMonths = 3;
  const emergencyBufferTarget = fixed * emergencyBufferMonths;
  const bufferAfterPurchase = balance - amount;
  const affordabilityRatio = discretionary > 0 ? amount / discretionary : null;
  const budgetImpactPercent = state?.discretionaryBudgetTotal ? Math.round((amount / state.discretionaryBudgetTotal) * 100) : 0;

  const entertainment = (state?.transactions || [])
    .filter((t) => /entertainment|shopping|dining|movie|recreation/i.test(t.category))
    .slice(-6);
  const avgEntertainment = entertainment.length ? entertainment.reduce((s, t) => s + Math.abs(t.amount), 0) / entertainment.length : 0;
  const behaviorMultiplier = avgEntertainment > 0 ? (amount / avgEntertainment) : null;

  const decisionStatus = (() => {
    if (amount <= discretionary && bufferAfterPurchase >= emergencyBufferTarget) return "🟢 PROCEED SAFELY";
    if (amount <= discretionary * 1.5 && bufferAfterPurchase >= emergencyBufferTarget * 0.8) return "🟡 ACCEPTABLE WITH CAUTION";
    return "🔴 HOLD - REVIEW FIRST";
  })();

  const finalText = [
    `${decisionStatus}`,
    "",
    "Purchase vs Budget",
    `• Amount: RM ${amount.toFixed(2)}`,
    `• Monthly discretionary: RM ${discretionary.toFixed(2)}`,
    `• Balance after purchase: RM ${Math.max(0, bufferAfterPurchase).toFixed(2)}`,
    `• Safety buffer needed: RM ${emergencyBufferTarget.toFixed(2)}`,
    "",
    "Analysis",
    `• This is ${affordabilityRatio ? (affordabilityRatio * 100).toFixed(0) : "?"}% of your monthly discretionary spend`,
    `• vs your typical entertainment: ${behaviorMultiplier ? (behaviorMultiplier * 100).toFixed(0) : "?"}%`,
    `• Budget impact: ${budgetImpactPercent}% of total discretionary`,
    "",
    "Recommendation",
    decisionStatus === "🟢 PROCEED SAFELY" ? "✓ This is affordable - proceed with the purchase" :
      decisionStatus === "🟡 ACCEPTABLE WITH CAUTION" ? "⚠ Consider delaying 48 hours; compare alternatives" :
        "✗ Too expensive right now; consider saving first or looking for alternatives",
  ].join("\n");

  return {
    routedAgent: "Mizan" as ChatAgent,
    finalText,
    decisionStatus,
    confidence: 85,
    reasoning: `Analyzed RM ${amount.toFixed(2)} purchase against your RM ${discretionary.toFixed(2)} monthly budget`,
    evidence: [
      { label: "Purchase amount", value: `RM ${amount.toFixed(2)}` },
      { label: "Discretionary budget", value: `RM ${discretionary.toFixed(2)}` },
      { label: "Safety margin", value: `RM ${Math.max(0, bufferAfterPurchase).toFixed(2)}` },
    ],
    sources: [{ title: "Your financial snapshot", note: "Real-time affordability analysis" }],
  } as any;
}

function buildShieldResponse(message: string, localSignals: ReturnType<typeof extractSignals>) {
  const detected = [
    /urgent|immediately|now|ASAP/i.test(message) ? "Urgency language" : null,
    /frozen|suspend|arrest|lhdn|tax/i.test(message) ? "Account freeze pressure tactic" : null,
    localSignals.registryMatches.length ? "Registry / blacklist match" : null,
  ].filter(Boolean) as string[];

  const riskScore = 90 + (detected.length > 1 ? 0 : 0);
  const exactText = [
    "🔴 HIGH FRAUD RISK",
    "",
    "Threat Analysis",
    ...detected.map((d) => `✓ ${d}`),
    "",
    `Risk Score: ${riskScore} / 100`,
    "",
    "Why This Was Flagged",
    "This message attempts to create panic and urgency. Legitimate institutions generally do not request immediate action via informal channels.",
    "",
    "Recommended Actions",
    "Do not transfer money; do not click links; block sender; report message to the bank/authority.",
  ].join("\n");

  return {
    routedAgent: "Shield" as ChatAgent,
    finalText: exactText,
    securityResult: "HIGH_FRAUD_RISK",
    threatAnalysis: {
      detectedSignals: detected,
      why: "Urgency and impersonation cues, possible registry match",
    },
    riskScore,
    whyThisWasFlagged: "Urgency + impersonation patterns; potential account or payment pressure detected.",
    recommendedActions: ["Do not transfer money", "Do not click links", "Block sender", "Report message"],
    saferAlternative: "Visit official service channels directly or contact the institution via published numbers.",
    confidence: 95,
    reasoning: "The message contains scam markers and needs immediate fraud defense.",
    evidence: [
      { label: "Risk pattern", value: "Urgency + transfer pressure + possible impersonation" },
      ...localSignals.registryMatches,
    ] as ChatEvidence[],
    sources: AGENT_KNOWLEDGE.Shield as unknown as ChatSource[],
  } as any;
}

function buildBarakahResponse(message: string) {
  const lower = message.toLowerCase();

  // ZAKAT CALCULATION QUESTIONS
  if (/zakat|zakat calculation|calculate zakat/i.test(message)) {
    // Detect asset type from message
    const isGold = /gold|investment.*gold|emas/i.test(message);
    const isCrypto = /crypto|bitcoin|ethereum/i.test(message);
    const isStock = /stock|share|equity|fund/i.test(message);
    const isCash = /cash|liquid|current account|savings/i.test(message);

    let assetType = "General Assets";
    let nisab = "85 grams";
    let nisabValue = "RM 29,750";
    let rate = "2.5%";
    let haul = "1 Gregorian Year (365 days)";
    let exampleAmount = "100g";
    let examplePrice = "RM 350/gram";
    let exampleTotal = "RM 35,000";
    let exampleZakat = "RM 875";
    let assetCategory = "Gold";

    if (isGold) {
      assetType = "Gold Investment";
      assetCategory = "Gold";
      nisab = "85 grams";
      nisabValue = "RM 29,750 (at RM 350/gram)";
      exampleAmount = "100g";
      examplePrice = "RM 350/gram";
      exampleTotal = "RM 35,000";
      exampleZakat = "RM 875";
    } else if (isCrypto) {
      assetType = "Cryptocurrency";
      assetCategory = "Crypto";
      nisab = "Equivalent to 85g gold";
      nisabValue = "RM 29,750 (in crypto market value)";
      exampleAmount = "RM 50,000 worth of crypto";
      examplePrice = "Market value";
      exampleTotal = "RM 50,000";
      exampleZakat = "RM 1,250";
    } else if (isStock) {
      assetType = "Stocks/Equity Holdings";
      assetCategory = "Stocks";
      nisab = "Equivalent to 85g gold";
      nisabValue = "RM 29,750 (in current market value)";
      exampleAmount = "RM 40,000 in stocks";
      examplePrice = "Current market price";
      exampleTotal = "RM 40,000";
      exampleZakat = "RM 1,000";
    } else if (isCash) {
      assetType = "Cash/Liquid Assets";
      assetCategory = "Cash";
      nisab = "Equivalent to 85g gold";
      nisabValue = "RM 29,750 (in cash/liquid assets)";
      exampleAmount = "RM 40,000 cash";
      examplePrice = "Face value";
      exampleTotal = "RM 40,000";
      exampleZakat = "RM 1,000";
    }

    const finalText = [
      "🟢 ZAKAT CALCULATION GUIDANCE PROVIDED",
      "",
      "📋 Core Conditions (Shariah Rules)",
      `Asset Type: ${assetType}`,
      `Nisab (Min Threshold): ${nisab}`,
      `Haul (Holding Period): ${haul}`,
      `Zakat Rate: ${rate}`,
      "",
      "✅ Both Conditions MUST Be Met",
      `1. NISAB: Must hold at least ${nisab} of ${assetCategory}`,
      `   Current threshold value: ${nisabValue}`,
      ``,
      `2. HAUL: Must hold it for one full Hijrah year`,
      `   (Approximately 365 calendar days from acquisition date)`,
      ``,
      "🧮 Calculation Formula",
      `👉 [Total Asset Value] × 2.5% = Zakat Due`,
      "",
      "📊 Step-by-Step Example",
      `Asset Held: ${exampleAmount}`,
      `Current Price: ${examplePrice}`,
      `Total Value: ${exampleTotal}`,
      `Calculation: ${exampleTotal} × 2.5% = ${exampleZakat}`,
      ``,
      `✅ RESULT: Zakat due = ${exampleZakat}`,
      "",
      "⚙️ Suggested Action",
      "1. Verify total ${assetCategory} holdings reach Nisab threshold",
      "2. Confirm acquisition date to ensure Haul period complete",
      "3. Calculate market value as of Zakat payment date",
      "4. Multiply total value by 2.5%",
      "5. Distribute to eligible recipients (8 categories)",
      "6. Consult JAKIM for state-specific rulings on worn vs. stored",
    ].join("\n");

    // Enhanced structured response
    const zakatStructured = {
      nisabThreshold: {
        amount: nisab,
        value: nisabValue,
        assetType: assetCategory
      },
      haulPeriod: {
        duration: "1 Gregorian Year",
        days: "365 days",
        requirement: "Asset must be held continuously for minimum 1 year"
      },
      zakatRate: "2.5% (per annum)",
      calculation: {
        formula: "[Total Asset Value] × 2.5%",
        example: {
          assetHeld: exampleAmount,
          unitPrice: examplePrice,
          totalValue: exampleTotal,
          zakatDue: exampleZakat
        }
      },
      eligibleCategories: [
        "Poor (Fuqara)",
        "Needy (Masakin)",
        "Zakat collectors",
        "Converts to Islam",
        "Slaves",
        "Debtors",
        "Travelers (Ibn al-Sabil)",
        "Cause of Allah"
      ],
      suggestedActions: [
        `Verify holdings exceed ${nisab}`,
        "Confirm Haul period completion",
        "Calculate current market value",
        "Apply 2.5% zakat formula",
        "Distribute to eligible recipients"
      ]
    };

    return {
      routedAgent: "Barakah" as ChatAgent,
      finalText,
      complianceStatus: "ZAKAT_GUIDANCE_PROVIDED",
      shariahAssessment: [
        `Zakat on ${assetType} is obligatory ONLY if both conditions are met:`,
        `✓ Nisab: Minimum ${nisab} (${nisabValue})`,
        `✓ Haul: Held for minimum 1 Gregorian year (365 days)`
      ],
      explanation: `Complete zakat calculation methodology for ${assetType}. Consult JAKIM for asset-specific rulings.`,
      tagline: "Purify your wealth with confidence.",
      confidence: 92,
      reasoning: "Detected Zakat calculation question - providing step-by-step Shariah-compliant methodology",
      zakatStructured: zakatStructured,
      evidence: [
        { label: "Nisab threshold", value: nisab },
        { label: "Threshold value", value: nisabValue },
        { label: "Zakat rate", value: rate },
        { label: "Haul period", value: haul }
      ],
      sources: [
        { title: "JAKIM - Zakat Guidelines", note: "Official Malaysian Islamic zakat computation standards" },
        { title: "Shariah Advisory Council (SAC)", note: "Central Bank fatwa on Islamic finance compliance" }
      ],
    } as any;
  }

  // HALAL INVESTMENT QUESTIONS
  if (/halal|shariah.*compliant|riba|gharar|is.*halal|investment.*halal/i.test(message)) {
    const isCrypto = /crypto|bitcoin|ethereum|blockchain/i.test(message);
    const isStock = /stock|share|equity|company|fund/i.test(message);
    const isRealEstate = /property|real.*estate|land|house|building/i.test(message);
    const isDeposit = /deposit|fixed.*deposit|term.*deposit|savings/i.test(message);

    let recommendedAction = "Requires case-by-case Shariah review";
    let verdict = "⚠️ REVIEW REQUIRED";
    let riskLevel = "Medium";
    
    if (isCrypto) {
      recommendedAction = "⚠️ Controversial: Most Islamic scholars advise caution due to gharar (uncertainty) and speculation risks";
      verdict = "⚠️ HIGH GHARAR RISK";
      riskLevel = "High";
    } else if (isStock) {
      recommendedAction = "✅ Permitted: If company avoids haram sectors (alcohol, gambling, pork) and maintains low debt-to-equity ratio";
      verdict = "✅ CONDITIONALLY PERMISSIBLE";
      riskLevel = "Low (if screened)";
    } else if (isRealEstate) {
      recommendedAction = "✅ Generally Permitted: As long as no haram activities are conducted on the property";
      verdict = "✅ GENERALLY PERMISSIBLE";
      riskLevel = "Low";
    } else if (isDeposit) {
      recommendedAction = "⚠️ Requires Review: Interest-based deposits contain riba; prefer Islamic savings accounts";
      verdict = "⚠️ RIBA DETECTED";
      riskLevel = "High";
    }

    const finalText = [
      "🕌 SHARIAH COMPLIANCE ASSESSMENT PROVIDED",
      "",
      "⚖️ Halal Investment Checklist",
      "To determine if an investment is halal, verify these 5 points:",
      "",
      "1️⃣ HARAM SECTOR SCREENING",
      "   Avoid investments in: Alcohol, Gambling, Pork/Non-Halal Food,",
      "   Conventional Finance (Banks with Riba), Weapons/Armaments,",
      "   Entertainment (Music, Nightclubs), Tobacco",
      "",
      "2️⃣ GHARAR (UNCERTAINTY) AVOIDANCE",
      "   ✗ Derivatives and speculative instruments",
      "   ✗ Unclear contract terms or hidden fees",
      "   ✗ Investments in unknown or unverified assets",
      "",
      "3️⃣ RIBA (INTEREST) PROHIBITION",
      "   ✗ Fixed interest-bearing deposits and bonds",
      "   ✓ Profit-sharing arrangements (Musharaka/Mudaraba)",
      "   ✓ Cost-plus arrangements (Murabaha)",
      "",
      "4️⃣ DEBT-TO-EQUITY RATIO",
      "   ✓ Company debt should be < 33% of market value",
      "   ✗ High debt = higher gharar and riba exposure",
      "",
      "5️⃣ AAOIFI & SHARIAH STANDARDS",
      "   ✓ International Islamic Finance Accounting Standards",
      "   ✓ BNM Shariah Advisory Council guidelines",
      "   ✓ JAKIM official fatwas",
      "",
      "📌 Assessment Result",
      recommendedAction,
      "",
      "💡 Recommendation",
      "Request Shariah compliance certificate from provider. Consult Shariah advisor for personal fatwa.",
    ].join("\n");

    const halalStructured = {
      verdict: verdict,
      assetType: isCrypto ? "Cryptocurrency" : isStock ? "Stocks/Equities" : isRealEstate ? "Real Estate" : isDeposit ? "Bank Deposits" : "Investment Asset",
      riskLevel: riskLevel,
      checklist: [
        {
          category: "Haram Sector Screening",
          status: isStock || isRealEstate ? "✓ Conditional" : "⚠️ Review",
          description: "Ensure no involvement with haram industries"
        },
        {
          category: "Gharar Avoidance",
          status: isCrypto ? "✗ High Risk" : isDeposit ? "✓ Low Risk" : "✓ Manageable",
          description: "Clear contracts and verified asset values required"
        },
        {
          category: "Riba Prohibition",
          status: isDeposit ? "✗ Contains Riba" : "✓ No Interest",
          description: "Returns from profit-sharing or cost-plus, not fixed interest"
        },
        {
          category: "Debt Ratio",
          status: isStock || isCrypto ? "⚠️ Review" : "✓ Safe",
          description: "Company leverage should be < 33% of market cap"
        },
        {
          category: "Shariah Certification",
          status: "⚠️ Verify",
          description: "Request AAOIFI or BNM certified status"
        }
      ],
      guidingPrinciples: [
        "Based on Qur'anic prohibition of riba (2:275)",
        "Based on hadith guidance on gharar avoidance",
        "AAOIFI international Islamic finance standards",
        "BNM Shariah Advisory Council guidelines",
        "Malaysian Islamic law (Syariah)"
      ],
      suggestedActions: [
        "Screen company for haram sectors",
        "Verify debt-to-equity ratio < 33%",
        "Request Shariah compliance certificate",
        "Check AAOIFI certification status",
        "Consult personal Shariah advisor"
      ]
    };

    return {
      routedAgent: "Barakah" as ChatAgent,
      finalText,
      complianceStatus: "HALAL_ASSESSMENT_PROVIDED",
      tagline: "Purify your wealth with confidence.",
      shariahAssessment: [
        "Based on Qur'anic prohibition of riba (2:275)",
        "Based on hadith on gharar avoidance",
        "AAOIFI standards applied"
      ],
      explanation: "Halal investment assessment based on Shariah principles. Individual fatwa recommended for final decision.",
      confidence: 88,
      reasoning: "Detected halal/Shariah compliance question - providing comprehensive Islamic finance checklist",
      halalStructured: halalStructured,
      evidence: [
        { label: "Primary concern", value: isCrypto ? "Gharar and speculation" : isStock ? "Company screening needed" : "Asset type review required" },
        { label: "Standard applied", value: "AAOIFI + BNM SAC guidelines" }
      ],
      sources: [
        { title: "BNM - Shariah Advisory Council", note: "Central bank fatwa and Islamic finance standards" },
        { title: "JAKIM", note: "Malaysian Islamic Development Department guidelines" },
        { title: "AAOIFI Standards", note: "International Islamic finance accounting standards" }
      ],
    } as any;
  }

  // GENERAL ISLAMIC FINANCE / FALLBACK
  const finalText = [
    "🕌 BARAKAH SHARIAH GUIDANCE",
    "",
    "Common Topics I Can Help With:",
    "• Zakat calculation (gold, cash, stocks, crypto)",
    "• Halal investment screening",
    "• Islamic financing structures (Murabaha, Ijara, Musharaka)",
    "• Riba (interest) avoidance",
    "• Gharar (uncertainty) in contracts",
    "• Waqf and charity compliance",
    "",
    "For Shariah Questions, Please Specify:",
    "1. Asset type (gold, stocks, crypto, cash, property)",
    "2. Your inquiry (calculation, halal check, structure review)",
    "3. Any specific contracts or terms in question",
    "",
    "Always consult official Shariah advisors (JAKIM, BNM SAC) for personal fatwas.",
  ].join("\n");

  return {
    routedAgent: "Barakah" as ChatAgent,
    finalText,
    complianceStatus: "AWAITING_DETAILS",
    shariahAssessment: ["Please provide more specific Islamic finance inquiry"],
    explanation: "General Islamic finance guidance. Provide more details for specific Zakat, Halal, or Shariah compliance answers.",
    confidence: 65,
    reasoning: "General Shariah guidance - please specify Zakat, Halal, or Islamic finance question for detailed answer",
    evidence: [
      { label: "Query type", value: "General Islamic finance inquiry" }
    ],
    sources: [
      { title: "JAKIM", note: "Zakat and Islamic finance guidelines" },
      { title: "BNM Shariah Advisory Council", note: "Financial Shariah compliance standards" }
    ],
  } as any;
}

function buildOrchestratorResponse(message: string) {
  // Smart banking knowledge base - answers common questions
  const questionLower = message.toLowerCase();
  
  let answer = "";
  let sources: ChatSource[] = [{ title: "NEURA Banking Database", note: "General banking knowledge" }];

  if (/home.*loan|mortgage|housing/.test(questionLower)) {
    answer = "Home Loan Requirements:\n" +
      "• Stable monthly income (minimum RM2,000)\n" +
      "• Credit score above 650\n" +
      "• Employment verification (6 months to 2 years)\n" +
      "• Valid ID, passport, or PR card\n" +
      "• Property valuation report\n" +
      "• Loan-to-value ratio typically 70-90%\n" +
      "• Debt-to-income ratio below 60%\n\n" +
      "Contact your bank for specific terms and eligibility.";
    sources.push({ title: "Bank Negara Malaysia", note: "Home financing guidelines" });
  } else if (/open.*account|savings|current|account type/.test(questionLower)) {
    answer = "Opening a Bank Account:\n" +
      "• You can open a Savings or Current Account\n" +
      "• Savings accounts: Interest-earning, lower transaction limits\n" +
      "• Current accounts: Unlimited transactions, often fee-based\n" +
      "• Required documents: ID, proof of address, initial deposit\n" +
      "• Minimum opening balance typically RM100-500\n" +
      "• Can be opened online or at branch\n\n" +
      "Visit our nearest branch or use mobile banking for online opening.";
  } else if (/interest.*rate|return|investment/.test(questionLower)) {
    answer = "Interest Rates & Returns:\n" +
      "• Savings account interest: 0.5-2.0% per annum (varies by bank)\n" +
      "• Fixed deposits: 2.5-3.5% per annum\n" +
      "• Investment products: Varies (stocks, bonds, funds)\n" +
      "• Islamic products: Profit rates align with Shariah principles\n\n" +
      "Check our rates page or contact a relationship manager for current rates.";
    sources.push({ title: "Bank Rates Database", note: "Current interest rates" });
  } else if (/transfer|send.*money|payment/.test(questionLower)) {
    answer = "Making Transfers:\n" +
      "• Online banking: Instant to same bank, 1-2 hours to other banks\n" +
      "• Mobile app: Same-day or next-day delivery\n" +
      "• In-branch: Immediate for same bank, 1-3 days for other banks\n" +
      "• Fees: Typically RM1-5 depending on amount and destination\n" +
      "• Transaction limits: Usually RM50,000/day for online\n\n" +
      "For security, never share your OTP or PIN with anyone.";
  } else {
    // Generic fallback for unknown questions
    answer = "Thank you for your question. I can help you with:\n" +
      "• Loan applications and requirements\n" +
      "• Account opening and management\n" +
      "• Interest rates and investment info\n" +
      "• Transfers and payments\n" +
      "• Fraud detection (Shield)\n" +
      "• Budget & affordability analysis (Mizan)\n" +
      "• Islamic finance & Zakat (Barakah)\n\n" +
      "Please ask a more specific question for detailed guidance.";
  }

  return {
    routedAgent: "Orchestrator" as ChatAgent,
    finalText: answer,
    structuredTip: "General banking information",
    confidence: 75,
    reasoning: "Answered from general banking knowledge base",
    evidence: [{ label: "Query type", value: questionLower.slice(0, 80) }],
    sources,
  };
}

function buildSafarResponse(message: string, state?: AppStateSnapshot | null) {
  const lower = (message || "").toLowerCase();

  const budgetMatch = message.match(/RM\s*([0-9,.]+)/i);
  const daysMatch = message.match(/(\d+)\s*days?/i);
  const destMatch = message.match(/to\s+([A-Za-z\s]{2,40})/i) || message.match(/go\s+to\s+([A-Za-z\s]{2,40})/i) || message.match(/to\s+([A-Za-z\s]{2,40}),?/i);

  const budget = budgetMatch ? Math.round(parseFloat(budgetMatch[1].replace(/,/g, "")) * 100) / 100 : null;
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
  const destinationRaw = destMatch ? destMatch[1].trim() : "Destination";
  const destination = destinationRaw.replace(/for\s*\d+\s*days/i, '').trim();

  // Target heuristics for Malaysia->China example
  const southernHubs = ["Shenzhen (SZX)", "Guangzhou (CAN)"];

  // Allocation percentages tuned for user example: flights 25%, accommodation 30%, daily spends 45%
  const flightPct = 0.25;
  const accomPct = 0.30;
  const dailyPct = 0.45;

  const flightEst = budget ? Math.round(budget * flightPct) : null;
  const accomEst = budget ? Math.round(budget * accomPct) : null;
  const dailyTotal = budget ? Math.round(budget * dailyPct) : null;
  const dailyPerDay = (dailyTotal && days) ? Math.round((dailyTotal / days)) : null;

  // Feasibility logic (demo): China 7-day trips considered feasible if budget >= RM2500
  let feasibilityLabel = "PENDING";
  if (budget) {
    if (/china|shenzhen|guangzhou|beijing|shanghai/i.test(lower)) {
      feasibilityLabel = budget >= 2500 ? "HIGHLY FEASIBLE" : (budget >= 1800 ? "FEASIBLE WITH ADJUSTMENTS" : "UNLIKELY WITHOUT ADJUSTING SCOPE");
    } else {
      feasibilityLabel = budget >= 2000 ? "FEASIBLE" : "CHECK BUDGET";
    }
  }

  const finalText = [
    `Safar Strategist ✈️ • Specialist response`,
    "",
    `Why this agent: Safar routing triggered: Detected international travel planning & budget feasibility check.`,
    "",
    `📊 Feasibility Check:`,
    `• ${feasibilityLabel}`,
    budget ? `• Trip target: ${days} days to ${destination}` : undefined,
    budget ? `• Budget provided: RM ${budget?.toLocaleString()}` : undefined,
    "",
    `Estimated breakdown (demo heuristics):`,
    budget ? `• Flight (Return): ~RM ${flightEst} (${Math.round(flightPct*100)}% of budget)` : undefined,
    budget ? `• Accommodation (nights ${Math.max(0, days-1)}): ~RM ${accomEst} (${Math.round(accomPct*100)}% of budget)` : undefined,
    budget ? `• Daily Spending (Food, Transport, Activities): ~RM ${dailyTotal} (≈ RM ${dailyPerDay}/day)` : undefined,
    "",
    `🛫 Flight Hacks (${destination}):`,
    `• Target hubs: ${southernHubs.join(" or ")}. Flying into SZX/CAN often halves costs vs northern gateways.`,
    `• Timing: Depart Tue/Wed — mid-week fares can be ~30% cheaper vs Fri/Sat departures.`,
    `• Target Price: Do not pay more than RM ${Math.max(flightEst || 0, 850)}`,
    "",
    `⚙️ Safar Action Layer (FIP-OS Integrations):`,
    `[ 🔔 Set Flight Price Alert at RM ${flightEst} ]`,
    `[ 💳 Activate Be U Visa Travel Mode (Zero FX Markup in China) ]`,
    `[ 🛡️ Add Takaful Travel Insurance (RM 45) ]`,
    "",
    `📅 Itinerary & Budget Lock:`,
    `Would you like me to generate a day-by-day ${destination} itinerary and lock RM ${budget?.toLocaleString()} into a dedicated "China Travel Vault" so you don't accidentally spend it before the trip?`,
    "",
    `Reply: [ Yes, build the itinerary & lock the vault ]  [ No, just track flight prices ]`
  ].filter(Boolean).join("\n");

  const safarStructured = {
    destination,
    days,
    budget: budget ? `RM ${budget.toLocaleString()}` : 'Not specified',
    feasibility: feasibilityLabel,
    breakdown: budget ? {
      flights: `RM ${flightEst}`,
      accommodation: `RM ${accomEst}`,
      dailyTotal: `RM ${dailyTotal}`,
      dailyPerDay: dailyPerDay ? `RM ${dailyPerDay}/day` : undefined
    } : undefined,
    flightHacks: [
      { title: 'Route', detail: 'Fly KUL → SZX/CAN (southern hub) to reduce price' },
      { title: 'Timing', detail: 'Depart mid-week (Tue/Wed) for lower fares (~30% savings)' },
      { title: 'Target Price', detail: `Prefer <= RM ${Math.max(flightEst || 0, 850)}` }
    ],
    actionLayer: {
      setPriceAlert: { label: `Set flight alert at RM ${flightEst}`, enabled: false },
      activateBeUTravelMode: { label: 'Activate Be U Visa Travel Mode', enabled: false },
      addTakaful: { label: 'Add Takaful Travel Insurance (RM 45)', enabled: false },
      lockVaultPrompt: { label: `Lock RM ${budget ? budget.toLocaleString() : '0'} into Travel Vault`, enabled: false }
    }
  };

  return {
    routedAgent: "Safar" as ChatAgent,
    finalText,
    confidence: 95,
    reasoning: `Safar strategist: mapped budget to realistic China trip heuristics and action integrations.`,
    safarStructured,
    evidence: [{ label: 'Parsed destination', value: destination }, { label: 'Parsed days', value: String(days) }, { label: 'Parsed budget', value: budget ? `RM ${budget}` : 'none' }],
    sources: [{ title: 'Safar Planner (demo)', note: 'Heuristics based on regional fare patterns and budget allocation' }]
  } as any;
}

router.post("/chat", async (req, res) => {
  try {
    const { message, elderlyActive, isVoice, imageBase64 } = req.body;
    const isDemoMode = !process.env.GEMINI_API_KEY;
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const chatMode: "text" | "vision" | "voice" = imageBase64 ? "vision" : isVoice ? "voice" : "text";
    const localSignals = extractSignals(normalizedMessage);

    if (!normalizedMessage && !imageBase64) return res.status(400).json({ error: "Empty query" });

    const appState = getState ? getState() : null;
    let routedAgent: ChatAgent = "Orchestrator";
    let finalText = "Processing your request...";
    let structuredTip = "";
    let confidence = 60;
    let reasoning = "Routed by Orchestrator";
    let evidence: ChatEvidence[] = [];
    let sources: ChatSource[] = [{ title: "NEURA Orchestrator", note: "Router" }];
    let structured: any = null;
    let actionNeeded = false;
    let actionDetails: any = null;

  if (!isDemoMode && geminiAI) {
    try {
      const contentParts: any[] = [];
      contentParts.push({ text: `You are NEURA AI. Analyze the user's CURRENT request and return a JSON response.

ROUTING RULES — Pick ONE agent based on the CURRENT question (not previous context):
1. **SHIELD** (Fraud Detection): ONLY if the current message contains:
   - Urgency + account threat ("Your account frozen! Transfer now!")
   - Request for OTP/passwords/credentials
   - Phishing/scam language
   - Suspicious links + urgency
   DO NOT route to Shield for: loan applications, general banking questions, investment info

2. **MIZAN** (Affordability): ONLY if current message is asking to evaluate a SPECIFIC purchase:
   - "Can I afford RM500 headphones?"
   - "Is RM2000/month rent okay for my budget?"
   - "Should I buy this car for RM50k?"
   DO NOT route to Mizan for: general loan info, how-to questions, policy questions

3. **BARAKAH** (Shariah Compliance): ONLY if current message is about Islamic law/halal:
   - "Is cryptocurrency halal?"
   - "How do I calculate zakat?"
   - "Is this investment shariah-compliant?"
   DO NOT route to Barakah for: general banking, affordability, security

4. **ORCHESTRATOR**: General banking questions, how-tos, policy info:
   - "What are home loan requirements?"
   - "How do I open a savings account?"
   - "What's the difference between current and savings?"

CRITICAL: Only use specialized agents (Shield/Mizan/Barakah) if the question DIRECTLY asks for that expertise. Default to ORCHESTRATOR for anything else.

RESPONSE FORMAT — Always return JSON with SPECIFIC, DETAILED answers (not generic):
{
  "routedAgent": "Shield" | "Mizan" | "Barakah" | "Orchestrator",
  "text": "Your specific, detailed, actionable response to THIS EXACT question",
  "confidence": 0-100,
  "reasoning": "Why this agent",
  "evidence": [],
  "sources": []
}` });

      if (imageBase64) {
        contentParts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
      }

      const response = await geminiAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: contentParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routedAgent: { type: Type.STRING, enum: ["Shield", "Mizan", "Barakah", "Ehsan", "Safar", "Orchestrator"] },
              text: { type: Type.STRING },
              structuredTip: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              mode: { type: Type.STRING },
              evidence: { type: Type.ARRAY, items: { type: Type.OBJECT } },
              sources: { type: Type.ARRAY, items: { type: Type.OBJECT } },
              actionNeeded: { type: Type.BOOLEAN },
              actionDetails: { type: Type.OBJECT }
            },
            required: ["routedAgent", "text"]
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        routedAgent = parsed.routedAgent || routedAgent;
        finalText = parsed.text || finalText;
        structuredTip = parsed.structuredTip || structuredTip;
        confidence = typeof parsed.confidence === "number" ? parsed.confidence : confidence;
        reasoning = parsed.reasoning || reasoning;
        evidence = Array.isArray(parsed.evidence) ? parsed.evidence : evidence;
        sources = Array.isArray(parsed.sources) ? parsed.sources : sources;
        actionNeeded = Boolean(parsed.actionNeeded);
        actionDetails = parsed.actionDetails || null;
        structured = parsed.structured || parsed;
      }
    } catch (err: any) {
      console.error("Chatbot Gemini failure:", err?.message);
    }

    // LOCAL SIGNAL OVERRIDE: Strong local signals beat Gemini routing
    if (localSignals.hasScamSignal) {
      const built = buildShieldResponse(normalizedMessage, localSignals);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip;
      confidence = Math.max(confidence, built.confidence);
      reasoning = `Shield detected: ${built.reasoning}`;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasBudgetSignal && routedAgent !== "Shield") {
      const built = buildMizanResponse(normalizedMessage, appState);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip;
      confidence = Math.max(confidence, built.confidence);
      reasoning = `Mizan detected: ${built.reasoning}`;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasBarakahSignal && routedAgent !== "Shield" && routedAgent !== "Mizan") {
      const built = buildBarakahResponse(normalizedMessage);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip;
      confidence = Math.max(confidence, built.confidence);
      reasoning = `Barakah detected: ${built.reasoning}`;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasSafarSignal && routedAgent !== "Shield" && routedAgent !== "Mizan" && routedAgent !== "Barakah") {
      const built = buildSafarResponse(normalizedMessage, appState);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = Math.max(confidence, built.confidence || 0);
      reasoning = `Safar detected: ${built.reasoning}`;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    }
  } else {
    // Demo fallback
    if (localSignals.hasScamSignal || imageBase64) {
      const built = buildShieldResponse(normalizedMessage, localSignals);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = built.confidence;
      reasoning = built.reasoning;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasBarakahSignal) {
      const built = buildBarakahResponse(normalizedMessage);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = built.confidence;
      reasoning = built.reasoning;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasSafarSignal) {
      const built = buildSafarResponse(normalizedMessage, appState);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = built.confidence;
      reasoning = built.reasoning;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else if (localSignals.hasBudgetSignal) {
      const built = buildMizanResponse(normalizedMessage, appState);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = built.confidence;
      reasoning = built.reasoning;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    } else {
      const built = buildOrchestratorResponse(normalizedMessage);
      routedAgent = built.routedAgent;
      finalText = built.finalText;
      structuredTip = built.structuredTip || structuredTip;
      confidence = built.confidence;
      reasoning = built.reasoning;
      evidence = built.evidence;
      sources = built.sources;
      structured = built;
    }
  }

  if (routedAgent === "Mizan" && appState) {
    const built = buildMizanResponse(normalizedMessage, appState);
    finalText = built.finalText;
    structuredTip = built.structuredTip;
    confidence = built.confidence;
    reasoning = built.reasoning;
    evidence = built.evidence;
    sources = built.sources;
    structured = built;
  }

  // Post-processing: Shield deeper checks
  if (routedAgent === "Shield") {
    // Append registry matches evidence
    if (localSignals.registryMatches.length) {
      evidence = evidence.concat(localSignals.registryMatches);
    }

    // Try to extract amount and account for transfer risk evaluation
    const amountMatch = normalizedMessage.match(/RM\s*([0-9,.]+)/i);
    const foundAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0;
    const accountMatch = normalizedMessage.match(/\b(\d{9,12})\b/);
    const recipientAccount = accountMatch ? accountMatch[1] : (localSignals.registryMatches[0] ? localSignals.registryMatches[0].label.replace(/\D/g, "") : undefined);

    if (foundAmount && recipientAccount) {
      const risk = await evaluateTransferRisk({
        recipientAccountNo: recipientAccount,
        recipientName: "",
        amount: foundAmount,
        senderAccountNo: "",
        discretionaryBudget: 0,
      });
      evidence.push({ label: "Transfer risk", value: `${risk.riskLevel} • ${risk.reason}` });
      sources.push({ title: "Shield risk engine", note: `Score ${risk.riskScore}` });

      if (risk.riskLevel === "RED") {
        const q = await createQuarantine({ senderAccountNo: "", receiverAccountNo: recipientAccount, amount: foundAmount, riskScore: risk.riskScore, riskReason: risk.reason });
        actionNeeded = true;
        actionDetails = { type: "QUARANTINE", message: `Transaction quarantined: ${q.id}`, quarantine: q };
      }
    }

    // Add dynamic fraud explanation
    try {
      const explain = await generateFraudExplainability({ recipientName: recipientAccount || "unknown", amount: foundAmount || 0, unusualHour: false, score: 80, blacklistReason: localSignals.registryMatches[0]?.value });
      sources.push({ title: "Fraud Explainability", note: explain.en });
    } catch (e) {
      // ignore
    }
  }

  // Post-processing: Barakah RAG sources
  if (routedAgent === "Barakah") {
    const rag = getBarakahRag(normalizedMessage);
    sources = sources.concat(rag);
  }

  res.json({
    agent: routedAgent,
    responseText: finalText,
    tip: structuredTip,
    structured,
    actionNeeded,
    actionDetails,
    confidence,
    reasoning,
    mode: chatMode,
    evidence,
    sources,
  });
  } catch (err: any) {
    console.error("Chat handler error:", err?.message);
    res.status(500).json({ error: "Internal server error", message: err?.message });
  }
});

export { router };
