import { Request, Response, NextFunction } from "express";
import { PredictSchema } from "../../../utils/validators";
import { runPrediction, getPredictionHistory, deletePrediction, saveHistory, PredictRequest } from "./predict.service";
import { ok, fail } from "../../../utils/response";

export async function predict(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = PredictSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.errors });
      return;
    }
    // Cast is safe: safeParse guarantees all fields present (userId has a schema default)
    ok(res, await runPrediction(parsed.data as PredictRequest));
  } catch (e) { next(e); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId ?? "default_user";
    const limit  = parseInt((req.query.limit as string) ?? "20", 10);
    const data   = await getPredictionHistory(userId, limit);
    res.json(data);  // frontend expects raw array, not wrapped
  } catch (e) { next(e); }
}

export async function deleteHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deletePrediction(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { next(e); }
}

export async function saveHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { itemName, category, amount, recommendation, riskScore, explanation, breakdown } = req.body;
    if (!itemName || !amount || !recommendation) {
      fail(res, "itemName, amount and recommendation required");
      return;
    }
    const entry = await saveHistory({
      itemName,
      category,
      amount:         Number(amount),
      recommendation,
      riskScore,
      explanation,
      breakdown,
    });
    res.json({ success: true, entry });
  } catch (e) { next(e); }
}