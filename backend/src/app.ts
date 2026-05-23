import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { router as scamPreventionRouter, setGeminiAI, router as caregiverOTPRouter } from "./modules/scamPrevention";
import { createRealityLensRouter, setRealityLensGeminiAI } from "./modules/realityLens";
import { router as chatbotRouter, setChatbotGeminiAI, setChatbotStateGetter } from "./modules/chatbot/index";
// Prediction / Analytics routers

import predictionChatbotRouter from "./modules/predictionAnalysis/chatbot/chatbot.routes";
import financeRouter from "./modules/predictionAnalysis/finance/finance.routes";
import trackerRouter from "./modules/predictionAnalysis/tracker/tracker.routes";
import wishlistRouter from "./modules/predictionAnalysis/wishlist/wishlist.routes";
import { checkBlacklist } from "./modules/scamPrevention/service";
import { env } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import trackerRoutes  from "./modules/predictionAnalysis/tracker/tracker.routes";
import financeRoutes  from "./modules/predictionAnalysis/finance/finance.routes";
import { purchaseRouter, historyRouter } from "./modules/predictionAnalysis/prediction/predict.routes";
import stateRoutes    from "./modules/predictionAnalysis/state/state.routes";
import wishlistRoutes from "./modules/predictionAnalysis/wishlist/wishlist.routes";
import chatbotRoutes  from "./modules/predictionAnalysis/chatbot/chatbot.routes";

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

// Tracker — GET/POST/DELETE incomes & expenses
  app.use("/api/tracker", trackerRoutes);

  // Finance summary
  app.use("/api/finance", financeRoutes);

  // Predict purchase — POST /api/predict-purchase
  app.use("/api/predict-purchase", purchaseRouter);

  // Predict history — GET/POST/DELETE /api/predict-history
  app.use("/api/predict-history", historyRouter);

  // State — /api/state, /api/toggle-elderly, /api/reset-state,
  //         /api/delay-lock, /api/complete-transfer,
  //         /api/auto-debits
  app.use("/api", stateRoutes);

  // Wishlist Vault — GET/POST/PATCH/DELETE /api/wishlist
  app.use("/api/wishlist", wishlistRoutes);

  // Chatbot intent router — POST /api/chatbot/intent
  app.use("/api/chatbot", chatbotRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
// 7. MODULE 2: MULTIMODAL AGENTIC ORCHESTRATOR CHATBOT
// Orchestrator moved to a dedicated chatbot module for clarity and maintainability
app.use("/api", chatbotRouter);

// Prediction & analytics endpoints used by frontend
// Mount Predictive purchase evaluation and history
app.use("/api/predict-purchase", purchaseRouter);
app.use("/api/predict-history", historyRouter);

// Mount finance helpers (pattern analysis) used by the Predictive page
app.use("/api/finance", financeRouter);

// Mount prediction-analysis chatbot endpoint (intent handler used by Predictive intercepts)
app.use("/api/chatbot", predictionChatbotRouter);

// Tracker & wishlist APIs used by frontend pages
app.use("/api/tracker", trackerRouter);
app.use("/api/wishlist", wishlistRouter);

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