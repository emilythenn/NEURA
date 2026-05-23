// Scam Prevention Module Service
import { GoogleGenAI } from "@google/genai";
import type {
  RecipientBlacklist,
  TransactionQuarantine,
  ReceiverStage,
  TransferScreeningResult,
  FraudWarning
} from "./types";

// Initialize database for this module
export let recipientBlacklist: RecipientBlacklist[] = [
  {
    account_no: "9999999999",
    holder_name: "Mohamad Scam Bin Ali",
    flagged_reason: "High-velocity mule caching from automated fraud rings",
    confidence_score: 99,
    reported_by: "PDRM_SEMAKMULE",
    created_at: new Date()
  },
  {
    account_no: "8888888888",
    holder_name: "Syndicate Cashout Hub",
    flagged_reason: "Confirmed money laundering operation through TnG eWallet",
    confidence_score: 95,
    reported_by: "PDRM_SEMAKMULE",
    created_at: new Date()
  }
];

export let transactionQuarantine: TransactionQuarantine[] = [];
export let receiverStages: Map<string, ReceiverStage> = new Map();

// Helper to get Gemini AI client from parent app
let geminiAI: GoogleGenAI | null = null;
export function setGeminiAI(client: GoogleGenAI | null) {
  geminiAI = client;
}

/**
 * Generate bilingual fraud warnings using Gemini AI or fallback
 */
export async function generateFraudExplainability(ctx: {
  recipientName: string;
  amount: number;
  unusualHour: boolean;
  score: number;
  blacklistReason?: string;
}): Promise<FraudWarning> {
  const isDemoMode = !process.env.GEMINI_API_KEY;

  if (isDemoMode) {
    return {
      en: `⚠️ CRITICAL: This account has been flagged for scam behavior. If you received a call claiming to be LHDN, PDRM, or your bank requesting this payment, STOP immediately. This is a common scam pattern.`,
      ms: `⚠️ KRITIKAL: Akaun penerima disenaraihitamkan atas aktiviti mencurigakan. Jika menerima panggilan mengaku pegawai LHDN/PDRM meminta pembayaran ini, BERHENTI segera. Ini adalah corak penipuan biasa.`
    };
  }

  const prompt = `You are SafeSend's real-time fraud explainability assistant. A user is attempting a high-risk transfer.

Transaction: RM ${ctx.amount} to ${ctx.recipientName}
Risk Score: ${ctx.score}/100
Reason: ${ctx.blacklistReason || "High-velocity pattern"}

Generate bilingual warnings in JSON:
{
  "en": "Clear English (max 50 words)",
  "ms": "Bahasa Melayu (max 50 words)"
}`;

  try {
    if (!geminiAI) {
      throw new Error("Gemini AI not initialized");
    }
    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      return {
        en: parsed.en || "WARNING: High-risk transfer.",
        ms: parsed.ms || "AMARAN: Pemindahan berisiko."
      };
    }
  } catch (error) {
    console.error("Gemini failover:", error);
  }

  return {
    en: "WARNING: This transfer has triggered fraud safeguards.",
    ms: "AMARAN: Pemindahan ini telah mengaktifkan sekatan penipuan."
  };
}

/**
 * Evaluate transfer risk using 4-factor scoring
 */
export function evaluateTransferRisk(ctx: {
  recipientAccountNo: string;
  recipientName: string;
  amount: number;
  senderAccountNo: string;
  discretionaryBudget: number;
  timestamp?: Date;
}): TransferScreeningResult {
  const now = ctx.timestamp || new Date();
  const hour = now.getHours();
  const isLateNight = hour >= 0 && hour <= 5;

  let riskScore = 0;
  let reasons: string[] = [];
  let blacklistMatch: RecipientBlacklist | undefined;

  // Factor 1: Blacklist matching
  const matchedBlacklist = recipientBlacklist.find(b => b.account_no === ctx.recipientAccountNo);
  if (matchedBlacklist) {
    riskScore += matchedBlacklist.confidence_score;
    reasons.push(`Blacklist match: ${matchedBlacklist.flagged_reason}`);
    blacklistMatch = matchedBlacklist;
  }

  // Factor 2: Velocity check (late-night high-value transfers)
  if (ctx.amount > 2000 && isLateNight) {
    riskScore += 40;
    reasons.push("High-value transfer (>RM2000) at suspicious late-night hours");
  }

  // Factor 3: Budget exceeding
  if (ctx.amount > ctx.discretionaryBudget && ctx.amount < 5000) {
    riskScore += 20;
    reasons.push(`Amount exceeds available discretionary budget`);
  }

  // Factor 4: Receiver stage escalation
  let receiverStageData = receiverStages.get(ctx.recipientAccountNo);
  if (!receiverStageData) {
    receiverStageData = {
      account_no: ctx.recipientAccountNo,
      velocity_score: 0,
      current_stage: "NORMAL",
      last_updated_at: new Date()
    };
    receiverStages.set(ctx.recipientAccountNo, receiverStageData);
  }

  if (receiverStageData.current_stage === "STAGE_3_EVICT") {
    riskScore += 100;
  } else if (receiverStageData.current_stage === "STAGE_2_FREEZE") {
    riskScore += 60;
  } else if (receiverStageData.current_stage === "STAGE_1_ALERT") {
    riskScore += 30;
  }

  // Determine risk level
  let riskLevel: "GREEN" | "AMBER" | "RED";
  if (riskScore < 30) {
    riskLevel = "GREEN";
  } else if (riskScore < 75) {
    riskLevel = "AMBER";
  } else {
    riskLevel = "RED";
  }

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    reason: reasons.join(" | "),
    requiresVerification: riskLevel !== "GREEN",
    blacklistMatch
  };
}

/**
 * Create quarantine entry for RED risk transfers
 */
export function createQuarantine(ctx: {
  senderAccountNo: string;
  receiverAccountNo: string;
  amount: number;
  riskScore: number;
  riskReason: string;
}): TransactionQuarantine {
  const quarantine: TransactionQuarantine = {
    id: `Q-${Date.now()}`,
    sender_account_no: ctx.senderAccountNo,
    receiver_account_no: ctx.receiverAccountNo,
    amount: ctx.amount,
    risk_score: ctx.riskScore,
    status: "PENDING_APPROVAL",
    risk_reason: ctx.riskReason,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 5 * 60 * 1000)
  };
  transactionQuarantine.push(quarantine);
  return quarantine;
}

/**
 * Release quarantined transaction
 */
export function releaseQuarantine(quarantineId: string, verificationCode: string): boolean {
  const quarantine = transactionQuarantine.find(q => q.id === quarantineId);
  if (!quarantine) return false;

  quarantine.status = "RELEASED";
  quarantine.otp_code = verificationCode;
  return true;
}

/**
 * Update receiver velocity stage (mule escalation)
 */
export function updateReceiverStage(accountNo: string, velocityDelta?: number, forceStage?: string): ReceiverStage {
  let stage = receiverStages.get(accountNo) || {
    account_no: accountNo,
    velocity_score: 0,
    current_stage: "NORMAL",
    last_updated_at: new Date()
  };

  if (velocityDelta) {
    stage.velocity_score += velocityDelta;
  }

  if (forceStage) {
    stage.current_stage = forceStage as any;
  } else {
    if (stage.velocity_score >= 80) {
      stage.current_stage = "STAGE_3_EVICT";
    } else if (stage.velocity_score >= 50) {
      stage.current_stage = "STAGE_2_FREEZE";
    } else if (stage.velocity_score >= 20) {
      stage.current_stage = "STAGE_1_ALERT";
    } else {
      stage.current_stage = "NORMAL";
    }
  }

  stage.last_updated_at = new Date();
  receiverStages.set(accountNo, stage);

  return stage;
}

/**
 * Get quarantine details
 */
export function getQuarantine(quarantineId: string): TransactionQuarantine | undefined {
  return transactionQuarantine.find(q => q.id === quarantineId);
}

/**
 * Check blacklist
 */
export function checkBlacklist(accountNo: string): RecipientBlacklist | undefined {
  return recipientBlacklist.find(b => b.account_no === accountNo);
}
