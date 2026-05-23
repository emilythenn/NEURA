import { ScoringInput, ScoringResult } from "../prediction/scoring.engine";
import { IntentContext } from "../chatbot/chatbot.model";

export const CFO_SYSTEM_PROMPT = `You are an AI CFO specializing in behavioral finance.
Your advice is concise, neutral, evidence-based, and always actionable.
You never lecture or moralize — you analyze and advise.`;

export function buildCFOPrompt(input: ScoringInput, score: ScoringResult): string {
  const { itemName, category, amount, currentBalance, discretionaryBudget } = input;
  const {
    riskScore, verdict, pressureLevel, impulseProbability,
    budgetImpactPercent, willGoNegative, lateNightActive, classification,
  } = score;

  return `You are an AI CFO. Analyze this purchase and give concise behavioral financial advice.

PURCHASE:
- Item: ${itemName} (${category})
- Amount: RM ${amount.toFixed(2)}
- Current balance: RM ${currentBalance.toFixed(2)}
- Discretionary budget: RM ${discretionaryBudget.toFixed(2)}

RISK ANALYSIS:
- Risk score: ${riskScore}/99
- Verdict: ${verdict}
- Pressure: ${pressureLevel}
- Impulse probability: ${impulseProbability}%
- Budget impact: ${budgetImpactPercent.toFixed(1)}% of balance
- Goes negative: ${willGoNegative}
- Late-night signal: ${lateNightActive}
- Behavioral class: ${classification}

RULES:
- 1-2 sentences ONLY
- One behavioral insight
- If RECONSIDER, suggest a concrete alternative
- Neutral, practical, professional tone
- No emojis, no intro, no sign-off`;
}

export function buildDiscountPrompt(ctx: IntentContext): string {
  return `User is considering buying "${ctx.itemName}" (${ctx.category}) for RM ${ctx.amount.toFixed(2)}. Their financial risk score is ${ctx.riskScore}/99.

Suggest 2-3 specific, actionable ways to find this cheaper or make a smarter decision.
Think: cashback apps (Shopee Pay, GrabPay, myBSN), price comparison tools, waiting for sale events (9.9, 11.11), or budget-friendly alternatives.
Malaysian context where relevant. 2-3 sentences only. Direct and practical — no intro phrase, no emojis, no sign-off.`;
}
