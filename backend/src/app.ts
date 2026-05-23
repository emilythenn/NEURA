import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";

import { router as scamPreventionRouter, setGeminiAI, router as caregiverOTPRouter } from "./modules/scamPrevention";
import { createRealityLensRouter, setRealityLensGeminiAI } from "./modules/realityLens";
import { router as chatbotRouter, setChatbotGeminiAI, setChatbotStateGetter } from "./modules/chatbot/index";
import { checkBlacklist } from "./modules/scamPrevention/service";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

// Optional Firebase Admin SDK initialization
const serviceAccountKeyPath = path.join(process.cwd(), "firebase-service-account.json");
if (fs.existsSync(serviceAccountKeyPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, "utf8"));
    initializeApp({ credential: cert(serviceAccount) });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", err);
  }
} else {
  console.warn("⚠️ firebase-service-account.json not found. Skipping Firebase Admin initialization.");
}

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = Number(process.env.PORT) || 3000;

// Initialize GoogleGenAI client lazy style
let generativeAI: GoogleGenAI | null = null;
function getGeminiAI() {
  if (!generativeAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI functions will run in simulated demo mode.");
    }
    generativeAI = new GoogleGenAI({ apiKey: apiKey || "MOCK_KEY", httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    setGeminiAI(generativeAI);
    setRealityLensGeminiAI(generativeAI);
    setChatbotGeminiAI(generativeAI);
    setChatbotStateGetter(() => accountsState);
  }
  return generativeAI;
}

// Initialize Gemini client once (no-op in demo mode)
getGeminiAI();

// SIMULATED DATABASE STATE
let accountsState: any = {
  totalBalance: 10000.0,
  discretionaryBudget: 800.0,
  discretionaryBudgetTotal: 2000.0,
  fixedExpenses: 1200.0,
  userName: "Encik Mohamad Zulhilmy",
  accountNo: "150123456789",
  financingAccounts: [
    { id: "fin-1", type: "Vehicle Financing-i", nextPayment: 577.0, originalAmount: 45000.0, remaining: 18000.0 },
    { id: "fin-2", type: "Baiti Home Financing-i", nextPayment: 2100.0, originalAmount: 350000.0, remaining: 280000.0 }
  ],
  transactions: [],
  elderlyMode: false,
  elderlyLimit: 300.0,
  caregiverName: "Sara",
  caregiverPhone: "+60 12-345 6789",
  isCaregiverApproved: false,
  lockedVaults: [
    { id: "v-1", name: "Mudharabah Saving Account-i", amount: 1540.0, type: "investment" },
    { id: "v-2", name: "Shopee Delay Vault (Locked)", amount: 0.0, type: "locked" }
  ]
};

// Scam & Mule Registry - Now managed in scamPrevention module



// API ROUTES

// 1. GET Current state
app.get("/api/state", (req, res) => {
  res.json(accountsState);
});

// 2. TOGGLE Elderly Mode
app.post("/api/toggle-elderly", (req, res) => {
  const { enabled, limit, caregiverName, caregiverPhone } = req.body;
  if (typeof enabled === "boolean") accountsState.elderlyMode = enabled;
  if (typeof limit === "number") accountsState.elderlyLimit = limit;
  if (typeof caregiverName === "string") accountsState.caregiverName = caregiverName;
  if (typeof caregiverPhone === "string") accountsState.caregiverPhone = caregiverPhone;
  res.json({ success: true, state: accountsState });
});

// 3. RETRIEVE simulated mule databases - Now in scamPrevention module via /api/check-blacklist

// 4. RESET database state to default
app.post("/api/reset-state", (req, res) => {
  accountsState.totalBalance = 10000.00;
  accountsState.discretionaryBudget = 800.00;
  accountsState.isCaregiverApproved = false;
  accountsState.transactions = accountsState.transactions.filter((t: any) => !t.id.startsWith("new-"));
  res.json({ success: true, state: accountsState });
});

// 5. CAREGIVER ACTION: APPROVE/REJECT PENDING TRANSACTION
app.post("/api/caregiver-approval", (req, res) => {
  const { status } = req.body;
  accountsState.isCaregiverApproved = status === "approve";
  res.json({ success: true, approvedState: accountsState.isCaregiverApproved });
});

// 6. MODULE 1: PREDICTIVE INTELLIGENCE PURCHASE EVALUATION PIPELINE
app.post("/api/predict-purchase", async (req, res) => {
  const { amount, category, itemName, isImpulseSignal } = req.body;
  const purchaseAmount = parseFloat(amount || "0");
  const parsedCategory = category || "Wants";
  const labelText = itemName || "Generic Item";

  if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
    return res.status(400).json({ error: "Invalid purchase amount specified" });
  }

  const baselineMean = 150.0;
  const baselineStdDev = 75.0;
  const zScore = (purchaseAmount - baselineMean) / baselineStdDev;
  const isSpendingNormal = Math.abs(zScore) <= 1.5;

  let classification: "reasonable" | "risky" | "impulsive" | "financially heavy" = "reasonable";
  if (purchaseAmount > 1000) {
    classification = "financially heavy";
  } else if (purchaseAmount > accountsState.discretionaryBudget) {
    classification = "risky";
  } else if (isImpulseSignal) {
    classification = "impulsive";
  } else if (purchaseAmount > baselineMean + baselineStdDev) {
    classification = "risky";
  }

  const remainingDiscretionaryBudget = accountsState.discretionaryBudget;
  const budgetImpactPct = (purchaseAmount / remainingDiscretionaryBudget) * 100;
  const postSpendingCapacity = remainingDiscretionaryBudget - purchaseAmount;
  const budgetPressure = budgetImpactPct > 90 ? "CRITICAL" : budgetImpactPct > 50 ? "HIGH" : "LOW";

  const hour = new Date().getUTCHours() + 8;
  const isLateNight = hour >= 23 || hour <= 4;
  const impulseProbability = Math.min(
    100,
    (isImpulseSignal ? 40 : 10) + (isLateNight ? 35 : 0) + (classification === "impulsive" ? 25 : 0)
  );

  let riskScore = 0;
  if (zScore > 0) riskScore += Math.min(25, zScore * 10);
  if (budgetPressure === "CRITICAL") riskScore += 40;
  else if (budgetPressure === "HIGH") riskScore += 25;
  riskScore += (impulseProbability / 100) * 35;

  let recommendation: "PROCEED" | "REVIEW" | "RECONSIDER" = "PROCEED";
  let color = "🟢";
  if (riskScore >= 65 || postSpendingCapacity < -200) {
    recommendation = "RECONSIDER";
    color = "🔴";
  } else if (riskScore >= 35 || postSpendingCapacity < 0) {
    recommendation = "REVIEW";
    color = "🟡";
  }

  const isDemoMode = !process.env.GEMINI_API_KEY;
  let textExplanation = `This purchase is ${(purchaseAmount / baselineMean).toFixed(1)}x higher than your usual baseline of RM ${baselineMean}. Paying RM ${purchaseAmount} will put high pressure on your remaining discretionary budget (RM ${remainingDiscretionaryBudget} remaining). We suggest delaying and thinking it over.`;

  if (!isDemoMode) {
    try {
      const gAI = getGeminiAI();
      const prompt = `You are a respectful personal Islamic financial CFO.
Analyze this proposed purchase for user "${accountsState.userName}":
Item: "${labelText}"
Price: RM ${purchaseAmount}
Category: "${parsedCategory}"
User Current Discretionary Budget left: RM ${remainingDiscretionaryBudget}
Z-score relative to normal spending: ${zScore.toFixed(2)}
Impulse score: ${impulseProbability}%
Predicted Type of Decision: ${classification}
Risk recommendations: ${recommendation} (Z-Score is ${zScore.toFixed(2)}, budget remaining is RM ${postSpendingCapacity}).

Generate a concise, honest, comforting Shariah-oriented 2-sentence explanation saying WHY this prediction is "${recommendation}" and what they should consider. Do not mention HTML or variables. Be extremely humble. Keep it around 40 words.`;

      const response = await gAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      if (response && response.text) {
        textExplanation = response.text.trim();
      }
    } catch (e: any) {
      console.error("Gemini Purchase Predictor call failed, fallback used: ", e.message);
    }
  }

  res.json({
    amount: purchaseAmount,
    category: parsedCategory,
    itemName: labelText,
    baseline: {
      userBaselineMean: baselineMean,
      zScore: zScore,
      isNormal: isSpendingNormal
    },
    decisionType: classification,
    affordability: {
      budgetRemaining: remainingDiscretionaryBudget,
      remainingAfterPurchase: postSpendingCapacity,
      pressure: budgetPressure,
      budgetImpactPct: budgetImpactPct
    },
    behavioral: {
      lateNightActive: isLateNight,
      impulseProbability: impulseProbability
    },
    result: {
      recommendation,
      color,
      explanation: textExplanation,
      riskScore: Math.round(riskScore)
    }
  });
});

// 7. MODULE 2: MULTIMODAL AGENTIC ORCHESTRATOR CHATBOT
// Orchestrator moved to a dedicated chatbot module for clarity and maintainability
app.use("/api", chatbotRouter);

// 7b. MODULE 3: REALITY LENS VISION SCAN
app.use(
  "/api",
  createRealityLensRouter({
    getState: () => accountsState,
  })
);

// 8. ROUTE TO COMPLETE ACTUAL FUND TRANSFER
app.post("/api/complete-transfer", async (req, res) => {
  const { amount, accountNo, recipientName, reference } = req.body;
  const transferVal = parseFloat(amount || "0");

  if (isNaN(transferVal) || transferVal <= 0) {
    return res.status(400).json({ error: "Invalid transfer amount." });
  }

  if (accountsState.totalBalance < transferVal) {
    return res.status(400).json({ error: "Insufficient funds in current Qard Account-i." });
  }

  const muleMatch = await checkBlacklist(accountNo);
  if (muleMatch && !accountsState.isCaregiverApproved) {
    return res.status(403).json({
      error: "WARNING: Intercepted potential fraudulent mule transaction. Cool-down is mandatory.",
      requiresCoolDown: true
    });
  }

  accountsState.totalBalance -= transferVal;
  if (transferVal < 500) {
    accountsState.discretionaryBudget = Math.max(0, accountsState.discretionaryBudget - transferVal);
  }

  const newTx = {
    id: `new-tx-${Date.now()}`,
    date: new Date().toISOString().substring(0, 10),
    category: "Transfer",
    description: `Trsf to ${recipientName || accountNo}`,
    amount: -transferVal,
    status: "completed" as const
  };
  accountsState.transactions.unshift(newTx);
  accountsState.isCaregiverApproved = false;

  res.json({
    success: true,
    newBalance: accountsState.totalBalance,
    transaction: newTx,
    updatedState: accountsState
  });
});

// 9. ZAKAT: Auto-calculate from connected portfolio (demo)
app.post("/api/zakat/auto-calc", (req, res) => {
  const nisabValueRM = 29750; // demo value based on 85g @ RM350/g
  // Sum liquid balances: totalBalance + lockedVaults amounts
  const totalBalance = accountsState.totalBalance || 0;
  const vaultsTotal = (accountsState.lockedVaults || []).reduce((s: number, v: any) => s + (Number(v.amount) || 0), 0);
  const portfolioValue = Math.round((totalBalance + vaultsTotal) * 100) / 100;
  const meetsNisab = portfolioValue >= nisabValueRM;
  const zakatDue = meetsNisab ? Math.round(portfolioValue * 0.025 * 100) / 100 : 0;

  const response = {
    portfolioValue: `RM ${portfolioValue.toLocaleString()}`,
    nisab: `85 grams (~RM ${nisabValueRM.toLocaleString()})`,
    meetsNisab,
    zakatDue: `RM ${zakatDue.toLocaleString()}`,
    details: {
      totalBalance: `RM ${totalBalance.toLocaleString()}`,
      vaultsTotal: `RM ${vaultsTotal.toLocaleString()}`,
      formula: `[Total Portfolio Value] × 2.5%`,
    },
  };

  res.json({ success: true, ...response });
});

// 10. ZAKAT: Mock payment flow (demo)
app.post("/api/zakat/pay", (req, res) => {
  const { amount } = req.body;
  const parsed = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : Number(amount || 0);
  if (isNaN(parsed) || parsed <= 0) return res.status(400).json({ success: false, error: "Invalid amount" });
  if (accountsState.totalBalance < parsed) return res.status(400).json({ success: false, error: "Insufficient funds" });

  accountsState.totalBalance = Math.round((accountsState.totalBalance - parsed) * 100) / 100;
  const tx = { id: `new-pay-${Date.now()}`, date: new Date().toISOString().slice(0,10), category: 'Zakat', description: 'Zakat payment (demo)', amount: -parsed, status: 'completed' };
  accountsState.transactions.unshift(tx);

  res.json({ success: true, paid: `RM ${parsed.toLocaleString()}`, transaction: tx, state: accountsState });
});

// ============================================================================
// SCAM PREVENTION MODULE - Moved to src/modules/scamPrevention
// Register module routes with /api prefix
app.use("/api", scamPreventionRouter);


// VITE SERVER OR FALLBACK STATIC SERVING
export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "..", "frontend")
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "..", "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEURA Cognitive Banking Engine booted successfully on port ${PORT}`);
  });
}

export { app, PORT };