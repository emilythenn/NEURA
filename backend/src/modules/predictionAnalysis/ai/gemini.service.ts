import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env";
import { ScoringInput, ScoringResult } from "../prediction/scoring.engine";
import { buildCFOPrompt, buildDiscountPrompt, CFO_SYSTEM_PROMPT } from "./prompts";
import { IntentContext } from "../chatbot/chatbot.model";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return _client;
}

export async function generateCFOExplanation(
  input: ScoringInput,
  score: ScoringResult
): Promise<string> {
  try {
    const response = await getClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildCFOPrompt(input, score),
      config: {
        systemInstruction: CFO_SYSTEM_PROMPT,
        maxOutputTokens: 120,
        temperature: 0.4,
      },
    });
    const text = (response.text ?? "").trim();   // ← ?? "" 处理 undefined
    return text || fallback(input, score);
  } catch (err) {
    console.error("[Gemini] API error:", err);
    return fallback(input, score);
  }
}

export async function generateDiscountAdvice(ctx: IntentContext): Promise<string> {
  try {
    const response = await getClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildDiscountPrompt(ctx),
      config: {
        systemInstruction: CFO_SYSTEM_PROMPT,
        maxOutputTokens: 150,
        temperature: 0.5,
      },
    });
    const text = (response.text ?? "").trim();
    return text || discountFallback(ctx);
  } catch (err) {
    console.error("[Gemini] Discount advice error:", err);
    return discountFallback(ctx);
  }
}

function discountFallback(ctx: IntentContext): string {
  return `Check Shopee or Lazada for a lower price on "${ctx.itemName}" before committing — price gaps of 10–30% are common. Consider adding it to your wishlist and waiting for a 9.9 or 11.11 sale, or look for a MyBSN or GrabPay cashback promotion.`;
}

function fallback(input: ScoringInput, score: ScoringResult): string {
  const { itemName, amount } = input;
  const { verdict, pressureLevel, willGoNegative, budgetImpactPercent } = score;

  if (willGoNegative)
    return `Purchasing ${itemName} for RM ${amount.toFixed(2)} would result in a negative balance — defer until your cash position improves.`;
  if (verdict === "RECONSIDER")
    return `${itemName} consumes ${budgetImpactPercent.toFixed(1)}% of your balance, placing ${pressureLevel.toLowerCase()} pressure on your finances — consider a lower-cost alternative.`;
  if (verdict === "REVIEW")
    return `${itemName} represents a notable portion of your funds; proceed only if this aligns with your monthly plan.`;
  return `${itemName} is within your means and consistent with healthy financial behaviour — you can proceed.`;
}