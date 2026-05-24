import { Request, Response, NextFunction } from "express";
import { routeIntent } from "./chatbot.service";
import { ok, fail } from "../../../utils/response";
import { IntentType, IntentRequest } from "./chatbot.model";

const VALID_INTENTS = new Set<string>([
  "ASK_DISCOUNT", "SAVE_TO_WISHLIST", "CANCEL_PURCHASE", "PROCEED_ANYWAY",
]);

export async function intentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<IntentRequest>;
    const { userId, intent, context } = body;

    if (!intent || !VALID_INTENTS.has(intent)) {
      fail(res, "intent must be ASK_DISCOUNT | SAVE_TO_WISHLIST | CANCEL_PURCHASE | PROCEED_ANYWAY");
      return;
    }
    if (!context?.itemName || context.amount === undefined || !context.category) {
      fail(res, "context.itemName, context.amount, context.category are required");
      return;
    }
    const result = await routeIntent({
      userId:  userId ?? "default_user",
      intent:  intent as IntentType,
      context,
    });
    ok(res, result);
  } catch (e) { next(e); }
}
