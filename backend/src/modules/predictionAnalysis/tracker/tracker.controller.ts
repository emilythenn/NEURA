import { Request, Response, NextFunction } from "express";
import { IncomeSchema, ExpenseSchema } from "../../utils/validators";
import * as service from "./tracker.service";
import { ok, created, fail } from "../../utils/response";

const DEFAULT_USER = "default_user";

export async function listIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await service.getIncomes(req.params.userId ?? DEFAULT_USER));
  } catch (e) { next(e); }
}

export async function addIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = IncomeSchema.safeParse(req.body);
    if (!parsed.success) { fail(res, "Validation error"); return; }
    const { userId, source, amount, date } = parsed.data;
    const entry = await service.createIncome(userId, source, amount, date);
    created(res, { entry });
  } catch (e) { next(e); }
}

export async function removeIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteIncome(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { next(e); }
}

export async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await service.getExpenses(req.params.userId ?? DEFAULT_USER));
  } catch (e) { next(e); }
}

export async function addExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = ExpenseSchema.safeParse(req.body);
    if (!parsed.success) { fail(res, "Validation error"); return; }
    const { userId, name, category, amount, date } = parsed.data;
    const entry = await service.createExpense(userId, name, category, amount, date);
    created(res, { entry });
  } catch (e) { next(e); }
}

export async function removeExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteExpense(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { next(e); }
}