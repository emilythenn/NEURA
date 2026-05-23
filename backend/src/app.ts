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
import { purchaseRouter, historyRouter } from "./modules/predictionAnalysis/prediction/predict.routes";
import trackerRouter from "./modules/predictionAnalysis/tracker/tracker.routes";
import { checkBlacklist } from "./modules/scamPrevention/service";
import { getDb, COLLECTIONS } from "./config/firebase";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

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

getGeminiAI();

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

async function loadAccountStateFromFirestore() {
  try {
    const db = getDb();
    const snap = await db.collection(COLLECTIONS.STATE).doc("default_user").get();
    if (snap.exists) {
      const firestoreState = snap.data();
      accountsState = {
        ...accountsState,
        ...firestoreState,
      };
      console.log("✅ Account state loaded from Firestore");
      return true;
    } else {
      console.log("ℹ️ No account state in Firestore, using defaults");
      return false;
    }
  } catch (err: any) {
    console.error("⚠️ Failed to load account state from Firestore:", err.message);
    return false;
  }
}

app.get("/api/state", (req, res) => {
  res.json(accountsState);
});

app.post("/api/state/refresh", async (req, res) => {
  const success = await loadAccountStateFromFirestore();
  res.json({ success, state: accountsState });
});

app.post("/api/toggle-elderly", (req, res) => {
  const { enabled, limit, caregiverName, caregiverPhone } = req.body;
  if (typeof enabled === "boolean") accountsState.elderlyMode = enabled;
  if (typeof limit === "number") accountsState.elderlyLimit = limit;
  if (typeof caregiverName === "string") accountsState.caregiverName = caregiverName;
  if (typeof caregiverPhone === "string") accountsState.caregiverPhone = caregiverPhone;
  res.json({ success: true, state: accountsState });
});

app.post("/api/reset-state", (req, res) => {
  accountsState.totalBalance = 10000.00;
  accountsState.discretionaryBudget = 800.00;
  accountsState.isCaregiverApproved = false;
  accountsState.transactions = accountsState.transactions.filter((t: any) => !t.id.startsWith("new-"));
  res.json({ success: true, state: accountsState });
});

app.post("/api/caregiver-approval", (req, res) => {
  const { status } = req.body;
  accountsState.isCaregiverApproved = status === "approve";
  res.json({ success: true, approvedState: accountsState.isCaregiverApproved });
});

app.use("/api/predict-purchase", purchaseRouter);
app.use("/api/predict-history", historyRouter);
app.use("/api/tracker", trackerRouter);
app.use("/api", chatbotRouter);

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

app.post("/api/zakat/auto-calc", (req, res) => {
  const nisabValueRM = 29750;
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

app.use("/api", scamPreventionRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

export async function startServer() {
  await loadAccountStateFromFirestore();
  
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
    console.log(`Server running on port ${PORT}`);
  });
}

export { app, PORT };