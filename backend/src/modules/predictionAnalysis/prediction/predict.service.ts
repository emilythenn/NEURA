import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../../config/firebase";
import { scoreInput, ScoringInput } from "./scoring.engine";
import { generateCFOExplanation } from "../ai/gemini.service";

export interface PredictRequest {
  userId:              string;
  itemName:            string;
  category:            string;
  amount:              number;
  impulseSignal:       boolean;
  currentBalance:      number;
  discretionaryBudget: number;
}

export interface PredictResponse {
  predictionId:           string;
  userId:                 string;
  itemName:               string;
  category:               string;
  amount:                 number;
  riskScore:              number;
  verdict:                "PROCEED" | "REVIEW" | "RECONSIDER";
  pressureLevel:          "LOW" | "MEDIUM" | "CRITICAL";
  impulseProbability:     number;
  budgetImpactPercent:    number;
  budgetDiscPercent:      number;
  remainingAfterPurchase: number;
  willGoNegative:         boolean;
  lateNightActive:        boolean;
  classification:         string;
  explanation:            string;
  scoreBreakdown:         Record<string, number>;
  timestamp:              number;
}

export interface HistoryEntry {
  id:             string;
  timestamp:      number;
  itemName:       string;
  category:       string;
  amount:         number;
  recommendation: "PROCEED" | "REVIEW" | "RECONSIDER";
  riskScore:      number;
  explanation:    string;
  breakdown:      object;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const now = () => admin.firestore.Timestamp.now();

// ── runPrediction ─────────────────────────────────────────────────────────────
export async function runPrediction(req: PredictRequest): Promise<PredictResponse> {
  const scoringInput: ScoringInput = {
    itemName:            req.itemName,
    category:            req.category,
    amount:              req.amount,
    impulseSignal:       req.impulseSignal,
    currentBalance:      req.currentBalance,
    discretionaryBudget: req.discretionaryBudget,
  };

  const score        = scoreInput(scoringInput);
  const explanation  = await generateCFOExplanation(scoringInput, score);
  const predictionId = uuidv4();
  const timestamp    = Date.now();

  const response: PredictResponse = {
    predictionId,
    userId:   req.userId,
    itemName: req.itemName,
    category: req.category,
    amount:   req.amount,
    explanation,
    timestamp,
    ...score,
  };

  // non-blocking persist
  getDb().collection("predictions").doc(predictionId).set({
    ...response,
    createdAt: now(),
  }).catch((err) => console.error("[Prediction] Firestore persist failed:", err));

  return response;
}

// ── getPredictionHistory ──────────────────────────────────────────────────────
export async function getPredictionHistory(
  userId: string,
  limit = 20
): Promise<PredictResponse[]> {
  // Single-field filter only — avoids the composite index requirement
  // (Firestore requires a manually-created composite index for where+orderBy combos).
  // Sorting and slicing are done in memory instead.
  const snap = await getDb()
    .collection("predictions")
    .where("userId", "==", userId)
    .get();

  return snap.docs
    .map((d) => {
      const { createdAt: _c, ...rest } = d.data();
      return rest as PredictResponse;
    })
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, limit);
}

// ── deletePrediction ──────────────────────────────────────────────────────────
export async function deletePrediction(id: string): Promise<void> {
  const ref = getDb().collection("predictions").doc(id);
  if (!(await ref.get()).exists) throw new Error(`Prediction ${id} not found`);
  await ref.delete();
}

// ── saveHistory (called by POST /api/predict-history from frontend) ───────────
export async function saveHistory(entry: {
  itemName:       string;
  category:       string;
  amount:         number;
  recommendation: "PROCEED" | "REVIEW" | "RECONSIDER";
  riskScore:      number;
  explanation:    string;
  breakdown:      object;
}): Promise<HistoryEntry> {
  const id        = uuidv4();
  const timestamp = Date.now();
  const doc: HistoryEntry = { id, timestamp, ...entry };

  await getDb().collection("predictions").doc(id).set({
    ...doc,
    userId:    "default_user",
    createdAt: now(),
  });

  return doc;
}