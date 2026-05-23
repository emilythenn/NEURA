import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../../config/firebase";
import { IntentRequest, IntentType, IntentContext, DecisionLogDoc } from "./chatbot.model";
import { addToWishlist } from "../wishlist/wishlist.service";
import { WishlistItemResponse } from "../wishlist/wishlist.model";
import { generateDiscountAdvice } from "../ai/gemini.service";

const LOG_COL = "decisionLogs";

export interface IntentResult {
  message:  string;
  intent:   IntentType;
  data?:    { wishlistItem?: WishlistItemResponse };
}

async function logDecision(
  userId: string, intent: IntentType, ctx: IntentContext
): Promise<void> {
  const doc: DecisionLogDoc = {
    id:        uuidv4(),
    userId,
    itemName:  ctx.itemName,
    amount:    ctx.amount,
    category:  ctx.category,
    riskScore: ctx.riskScore,
    action:    intent,
    timestamp: Date.now(),
  };
  await getDb().collection(LOG_COL).doc(doc.id).set(doc);
}

export async function routeIntent(req: IntentRequest): Promise<IntentResult> {
  const { userId, intent, context: ctx } = req;

  // Log every decision for behavioral dataset — fire-and-forget (don't block on errors)
  logDecision(userId, intent, ctx).catch(e =>
    console.error("[DecisionLog] Failed to persist:", e)
  );

  switch (intent) {
    case "ASK_DISCOUNT": {
      const message = await generateDiscountAdvice(ctx);
      return { intent, message };
    }

    case "SAVE_TO_WISHLIST": {
      const wishlistItem = await addToWishlist(userId, {
        itemName:    ctx.itemName,
        amount:      ctx.amount,
        category:    ctx.category,
        riskScore:   ctx.riskScore,
        explanation: ctx.explanation ?? "",
      });
      return {
        intent,
        message: `"${ctx.itemName}" has been saved to your Wishlist Vault. Review it later when your budget is more comfortable.`,
        data: { wishlistItem },
      };
    }

    case "CANCEL_PURCHASE":
      return {
        intent,
        message: `Good call on cancelling "${ctx.itemName}". Protecting your balance now builds the financial resilience to make this purchase confidently later.`,
      };

    case "PROCEED_ANYWAY":
      return {
        intent,
        message: `Noted. "${ctx.itemName}" has been logged. Keep an eye on your remaining balance after this purchase.`,
      };
  }
}
