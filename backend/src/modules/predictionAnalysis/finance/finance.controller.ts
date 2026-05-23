import { Request, Response, NextFunction } from "express";
import { getFinancialSummary, analyzeSpendingPattern } from "./finance.service";
import { ok, fail } from "../../utils/response";

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await getFinancialSummary(req.params.userId ?? "default_user"));
  } catch (e) { next(e); }
}

export async function spendingPattern(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, amount, userId } = req.body as { category?: string; amount?: unknown; userId?: string };
    if (!category || amount === undefined || amount === null) {
      fail(res, "category and amount are required");
      return;
    }
    const parsed = parseFloat(String(amount));
    if (isNaN(parsed) || parsed <= 0) {
      fail(res, "amount must be a positive number");
      return;
    }
    ok(res, await analyzeSpendingPattern(userId ?? "default_user", category, parsed));
  } catch (e) { next(e); }
}