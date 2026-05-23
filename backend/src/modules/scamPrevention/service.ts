import { GoogleGenAI } from "@google/genai";
import type {
  RecipientBlacklist,
  TransactionQuarantine,
  ReceiverStage,
  TransferScreeningResult,
  FraudWarning
} from "./types";
import {
  getBlacklistAccount,
  getReceiverStage as getReceiverStageFirestore,
  updateReceiverStageFirestore,
  getLinkedSuspiciousAccount
} from "./firestore";

<<<<<<< HEAD
// Re-export some firestore helpers with stable names used by other modules
import { createQuarantineTransfer } from "./firestore";

export async function checkBlacklist(accountNo: string) {
  return await getBlacklistAccount(accountNo);
}

export async function createQuarantine(data: {
  senderAccountNo: string;
  receiverAccountNo: string;
  recipientName?: string;
  amount: number;
  riskScore: number;
  riskReason?: string;
}) {
  const id = `qtx_${Date.now().toString(36)}`;
  const now = new Date();
  const record = {
    id,
    senderAccountNo: data.senderAccountNo,
    recipientAccountNo: data.receiverAccountNo,
    recipientName: data.recipientName || "",
    amount: data.amount,
    riskScore: data.riskScore,
    otpCode: null,
    status: "PENDING",
    riskReason: data.riskReason || "",
    createdAt: now,
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000)
  };
  try {
    await createQuarantineTransfer(record as any);
  } catch (err) {
    console.error("Failed to persist quarantine transfer:", err);
  }
  return record;
}

=======
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
let geminiAI: GoogleGenAI | null = null;
export function setGeminiAI(client: GoogleGenAI | null) {
  geminiAI = client;
}

/**
 * Generate bilingual fraud explainability text via Gemini AI
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
    if (!geminiAI) throw new Error("Gemini AI not initialized");

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

<<<<<<< HEAD
    if (response && response.text) {
=======
    if (response?.text) {
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
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
 * Core risk engine processing structural checks against 4 distinct threat factors
 */
export async function evaluateTransferRisk(ctx: {
  recipientAccountNo: string;
  recipientName: string;
  amount: number;
  senderAccountNo: string;
  discretionaryBudget: number;
  timestamp?: Date;
}): Promise<TransferScreeningResult> {
  const now = ctx.timestamp || new Date();
  const hour = now.getHours();
  const isLateNight = hour >= 0 && hour <= 5;

  let riskScore = 0;
  const reasons: string[] = [];
  let blacklistMatch: RecipientBlacklist | undefined;

  // Factor 1: Blacklist matching with localized safety failover
  try {
    const matchedBlacklist = await getBlacklistAccount(ctx.recipientAccountNo);
    if (matchedBlacklist) {
      riskScore += matchedBlacklist.confidenceScore || 0;
      reasons.push(`Blacklist match: ${matchedBlacklist.incidentCategory}`);
      blacklistMatch = matchedBlacklist;
    }
  } catch (dbErr) {
    console.error("[AntiScam Service] Blacklist database unreachable:", dbErr);
    reasons.push("Blacklist verification unavailable - proceeding with standard checks");
  }

  // Factor 2: Velocity check
  if (ctx.amount > 2000 && isLateNight) {
    riskScore += 40;
    reasons.push("High-value transfer (>RM2000) at suspicious late-night hours");
  }

  // Factor 3: Linked suspicious account checking (transacting with blacklist-connected accounts)
  try {
    const linkedSuspicious = await getLinkedSuspiciousAccount(ctx.recipientAccountNo);
    if (linkedSuspicious) {
      // Add significant risk - transferring to account connected to blacklist is HIGH RISK
      riskScore += linkedSuspicious.riskScore + 15; // Full score + 15 point bonus to push into RED
      
      // Provide detailed reason about the connection (user-friendly format)
      const connectionDescriptions = linkedSuspicious.linkedBlacklistAccounts.map(link => {
        let connectionType = "";
        if (link.connectionType === "transfers_to") {
          connectionType = "sends money to flagged accounts";
        } else if (link.connectionType === "receives_from") {
          connectionType = "receives money from flagged accounts";
        } else if (link.connectionType === "bidirectional") {
          connectionType = "conducts frequent transactions with flagged accounts";
        }
        return connectionType;
      }).filter(desc => desc); // Remove empty descriptions
      
      const uniqueDescriptions = [...new Set(connectionDescriptions)]; // Remove duplicates
      reasons.push(`This account ${uniqueDescriptions.join(" and ")} reported to law enforcement`);
    }
  } catch (dbErr) {
    console.error("[AntiScam Service] Linked suspicious accounts lookup failed:", dbErr);
    reasons.push("Linked account verification unavailable - proceeding with standard checks");
  }

  // Factor 4: Budget exceeding limits
  if (ctx.amount > ctx.discretionaryBudget && ctx.amount < 5000) {
    riskScore += 20;
    reasons.push("Amount exceeds available discretionary budget");
  }

  // Factor 5: Receiver stage escalation checking
  try {
    let receiverStageData = await getReceiverStageFirestore(ctx.recipientAccountNo);
    if (!receiverStageData) {
      receiverStageData = {
        accountNo: ctx.recipientAccountNo,
        velocityScore: 0,
        currentStage: "NORMAL",
        lastVerified: new Date()
      };
      await updateReceiverStageFirestore(ctx.recipientAccountNo, receiverStageData).catch(() => {});
    }

    if (receiverStageData.currentStage === "STAGE_3_EVICT") {
      riskScore += 100;
      reasons.push("Receiver account marked for eviction: STAGE_3_EVICT");
    } else if (receiverStageData.currentStage === "STAGE_2_FREEZE") {
      riskScore += 60;
      reasons.push("Receiver account frozen: STAGE_2_FREEZE");
    } else if (receiverStageData.currentStage === "STAGE_1_WARN") {
      riskScore += 30;
      reasons.push("Receiver account under alert: STAGE_1_WARN");
    }
  } catch (dbErr) {
    console.error("[AntiScam Service] Receiver stage database unreachable:", dbErr);
    reasons.push("Account stage monitoring unavailable - proceeding with standard checks");
  }

  // Final risk grading
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
    reason: reasons.length > 0 ? reasons.join(" | ") : "Clear account signals evaluated.",
    requiresVerification: riskLevel !== "GREEN",
    blacklistMatch
  };
<<<<<<< HEAD
}
=======
}
>>>>>>> 007728064ecbcbe6caf699314836ad96302370d1
