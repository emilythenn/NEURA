import { Request, Response, NextFunction } from "express";
import * as service from "./state.service";
import { ok, fail } from "../../utils/response";

export async function getState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.fetchState());
  } catch (e) { next(e); }
}

export async function toggleElderly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { enabled, limit, caregiverName, caregiverPhone } = req.body;
    if (typeof enabled !== "boolean") { fail(res, "enabled must be boolean"); return; }
    const state = await service.setElderlyMode(enabled, limit, caregiverName, caregiverPhone);
    res.json({ success: true, state });
  } catch (e) { next(e); }
}

export async function resetState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, state: await service.resetToDefaults() });
  } catch (e) { next(e); }
}

export async function delayLock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { itemName, amount } = req.body;
    if (!itemName || !amount) { fail(res, "itemName and amount required"); return; }
    res.json({ success: true, state: await service.addToVault(itemName, Number(amount)) });
  } catch (e) { next(e); }
}

export async function completeTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, description, category } = req.body;
    if (!amount) { fail(res, "amount required"); return; }
    res.json({ success: true, state: await service.recordTransfer(Number(amount), description ?? "Transfer", category ?? "Transfer") });
  } catch (e) { next(e); }
}

// ── AutoDebits ────────────────────────────────────────────────────────────────

export async function createAutoDebit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, category, amount, frequency, provider, nextDate } = req.body;
    if (!name || !amount) { fail(res, "name and amount required"); return; }
    const state = await service.addAutoDebit({
      name,
      category:  category  ?? "Utilities",
      amount:    Number(amount),
      frequency: frequency ?? "Monthly",
      status:    "Active",
      provider:  provider  ?? "",
      nextDate:  nextDate  ?? "",
    });
    res.json({ success: true, state });
  } catch (e) { next(e); }
}

export async function pauseResumeAutoDebit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, state: await service.toggleAutoDebit(req.params.id) });
  } catch (e) { next(e); }
}

export async function removeAutoDebit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, state: await service.deleteAutoDebit(req.params.id) });
  } catch (e) { next(e); }
}