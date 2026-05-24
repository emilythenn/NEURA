import { Router, Request, Response, NextFunction } from "express";
import { env } from "../../../config/env";
import { predict, getHistory, saveHistoryHandler, deleteHistory } from "./predict.controller";
import { getPredictionHistory } from "./predict.service";

// ── /api/predict-purchase ─────────────────────────────────────────────────────
export const purchaseRouter = Router();

const predictRateLimitWindowMs = 15 * 60 * 1000;
const predictRateLimitStore    = new Map<string, { count: number; firstRequestAt: number }>();

const predictLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  const now   = Date.now();
  const entry = predictRateLimitStore.get(clientIp);

  if (!entry || now - entry.firstRequestAt > predictRateLimitWindowMs) {
    predictRateLimitStore.set(clientIp, { count: 1, firstRequestAt: now });
    return next();
  }
  if (entry.count >= env.PREDICT_RATE_LIMIT) {
    return res.status(429).json({ success: false, error: "Too many requests — please wait a few minutes." });
  }
  entry.count += 1;
  predictRateLimitStore.set(clientIp, entry);
  return next();
};

purchaseRouter.post("/", predictLimiter, predict);

// ── /api/predict-history ──────────────────────────────────────────────────────
export const historyRouter = Router();

historyRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.query.userId as string) ?? "default_user";
    const limit  = parseInt((req.query.limit as string) ?? "20", 10);
    const data   = await getPredictionHistory(userId, limit);
    res.json(data);  // frontend expects raw array, not wrapped
  } catch (e) {
    console.error("Failed to get prediction history:", e);
    // Return empty array instead of error to prevent UI breakage
    res.json([]);
  }
});
historyRouter.get("/:userId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId ?? "default_user";
    const limit  = parseInt((req.query.limit as string) ?? "20", 10);
    const data   = await getPredictionHistory(userId, limit);
    res.json(data);  // frontend expects raw array, not wrapped
  } catch (e) {
    console.error("Failed to get prediction history:", e);
    // Return empty array instead of error to prevent UI breakage
    res.json([]);
  }
});
historyRouter.post("/",        saveHistoryHandler);
historyRouter.delete("/:id",   deleteHistory);