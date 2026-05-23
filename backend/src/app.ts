import express from "express";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import fs from "fs";

dotenv.config();

// ============================================================================
// FIREBASE ADMIN SDK INITIALIZATION (RUNS FIRST BEFORE ROUTERS LOAD)
// ============================================================================
const serviceAccountKeyPath = path.join(process.cwd(), "firebase-service-account.json");
if (fs.existsSync(serviceAccountKeyPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase connection context:", err);
    process.exit(1);
  }
} else {
  console.warn("⚠️ firebase-service-account.json not found. Downstream Firestore pools will experience structural failures.");
}

// ============================================================================
// ROUTER IMPORTS (EVALUATED AFTER CORE INITIALIZATION SEED)
// ============================================================================
import { createServer as createViteServer } from "vite";
import { router as scamPreventionRouter, caregiverOTPRouter } from "./modules/scamPrevention";

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;

// SIMULATED DATABASE STATE
let accountsState = {
  totalBalance: 10000.00,
  discretionaryBudget: 800.00,
  discretionaryBudgetTotal: 2000.00,
  fixedExpenses: 1200.00,
  userName: "Encik Mohamad Zulhilmy",
  accountNo: "150123456789",
  financingAccounts: [
    { id: "fin-1", type: "Vehicle Financing-i", nextPayment: 577.00, originalAmount: 45000.00, remaining: 18000.00 },
    { id: "fin-2", type: "Baiti Home Financing-i", nextPayment: 2100.00, originalAmount: 350000.00, remaining: 280000.00 }
  ],
  transactions: [
    { id: "tx-1", date: "2026-05-20", category: "Dining", description: "Nasi Kandar Pelita Cafe", amount: -45.00, status: "completed" },
    { id: "tx-c1", date: "2026-05-19", category: "Transfer", description: "Trsf to Syukri Bin Majid Mule AC", amount: -450.05, status: "cancelled", reason: "Detected Scam Account: Blocked via Royal Malaysia Police (PDRM) Mule Registry cross-match" },
    { id: "tx-2", date: "2026-05-18", category: "Groceries", description: "Lotus Supermarket Cheras", amount: -156.40, status: "completed" },
    { id: "tx-c2", date: "2026-05-17", category: "Shopping", description: "Dyson Airwrap Premium Set", amount: -2200.00, status: "refunded", reason: "Refunded Investment: Instantly revoked within 24-Hour Islamic cooling-off window after AI budget Alert" },
    { id: "tx-3", date: "2026-05-15", category: "Utilities", description: "Tenaga Nasional Berhad", amount: -210.00, status: "completed" },
    { id: "tx-c3", date: "2026-05-14", category: "Shopping", description: "Steam Wallet Gaming Top Up", amount: -120.00, status: "cancelled", reason: "Cancelled Payment: Changed mind after Mizan AI suggested alternative Sadaqah charity allocation" },
    { id: "tx-4", date: "2026-05-10", category: "Reload", description: "Touch n Go eWallet Reload", amount: -100.00, status: "completed" },
    { id: "tx-5", date: "2026-05-09", category: "Earnings", description: "Salary NEURA Islamic Transfer", amount: 5500.00, status: "completed" },
    { id: "tx-6", date: "2026-05-05", category: "Shopping", description: "Zalora Malaysia Online", amount: -180.00, status: "completed" },
    { id: "tx-7", date: "2026-05-01", category: "Transport", description: "Shell Petrol Cheras", amount: -85.00, status: "completed" },
    { id: "tx-8", date: "2026-03-15", category: "Shopping", description: "Shopee Shariah Seller", amount: -125.00, status: "completed" },
    { id: "tx-9", date: "2026-01-20", category: "Utilities", description: "Air Selangor Water Bill", amount: -38.50, status: "completed" },
    { id: "tx-10", date: "2025-09-05", category: "Earnings", description: "Quarterly Hibah Payout", amount: 450.00, status: "completed" },
    { id: "tx-11", date: "2025-06-10", category: "Insurance", description: "Takaful Malaysia Protection", amount: -150.00, status: "completed" },
    { id: "tx-12", date: "2025-04-01", category: "Dining", description: "Seoul Garden Restaurant", amount: -110.00, status: "completed" }
  ],
  elderlyMode: false,
  elderlyLimit: 300.00,
  caregiverName: "Sara",
  caregiverPhone: "+60 12-345 6789",
  isCaregiverApproved: false,
  lockedVaults: [
    { id: "v-1", name: "Mudharabah Saving Account-i", amount: 1540.00, type: "investment" },
    { id: "v-2", name: "Shopee Delay Vault (Locked)", amount: 0.00, type: "locked" }
  ]
};

// CORE API ROUTES
app.get("/api/state", (req, res) => {
  res.json(accountsState);
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
  accountsState.transactions = accountsState.transactions.filter(t => !t.id.startsWith("new-"));
  res.json({ success: true, state: accountsState });
});

app.post("/api/caregiver-approval", (req, res) => {
  const { status } = req.body;
  accountsState.isCaregiverApproved = status === "approve";
  res.json({ success: true, approvedState: accountsState.isCaregiverApproved });
});

app.post("/api/complete-transfer", (req, res) => {
  const { amount, accountNo, recipientName, reference } = req.body;
  const transferVal = parseFloat(amount || "0");

  if (isNaN(transferVal) || transferVal <= 0) {
    return res.status(400).json({ error: "Invalid transfer amount." });
  }

  if (accountsState.totalBalance < transferVal) {
    return res.status(400).json({ error: "Insufficient funds in current Qard Account-i." });
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

app.post("/api/save-difference", (req, res) => {
  const { amount } = req.body;
  const val = parseFloat(amount || "0");
  if (val > 0 && accountsState.totalBalance >= val) {
    accountsState.totalBalance -= val;
    const item = accountsState.lockedVaults.find(v => v.id === "v-1");
    if (item) item.amount += val;
    res.json({ success: true, state: accountsState });
  } else {
    res.status(400).json({ error: "Unable to deposit money to saving vault." });
  }
});

app.post("/api/delay-lock", (req, res) => {
  const { amount } = req.body;
  const val = parseFloat(amount || "0");
  if (val > 0 && accountsState.totalBalance >= val) {
    accountsState.totalBalance -= val;
    const item = accountsState.lockedVaults.find(v => v.id === "v-2");
    if (item) item.amount += val;
    res.json({ success: true, state: accountsState });
  } else {
    res.status(400).json({ error: "Insufficient balance to lock in Shopee Delay-Vault." });
  }
});

// Bind Scam Prevention Sub-Module Endpoints
app.use("/api", scamPreventionRouter);
app.use("/api", caregiverOTPRouter);

// VITE SERVER ENDPOINT TUNNELING OR STATIC ASSET HOSTING
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

  // Explicit IPv4 binding for reliable frontend local development proxy handshake
  return new Promise<void>((resolve) => {
    app.listen(Number(PORT) || 3000, "127.0.0.1", () => {
      console.log(`🚀 NEURA Cognitive Banking Engine booted successfully on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });
}

export { app, PORT };