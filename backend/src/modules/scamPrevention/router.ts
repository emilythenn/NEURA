import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  evaluateTransferRisk,
  generateFraudExplainability
} from "./service";
import {
  createQuarantineTransfer,
  getQuarantineTransfer,
  updateQuarantineStatus,
  getBlacklistAccount,
  getReceiverStage as getReceiverStageFirestore,
  updateReceiverStageFirestore
} from "./firestore";

export const router = express.Router();

router.post("/screen-transfer", async (req, res) => {
  const { recipientAccountNo, recipientName, amount, senderAccountNo, discretionaryBudget } = req.body;

  if (!recipientAccountNo || !recipientName || !amount || !senderAccountNo) {
    return res.status(400).json({ error: "Missing required transfer parameters" });
  }

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: "Invalid transfer amount" });
  }

  try {
    const screening = await evaluateTransferRisk({
      recipientAccountNo,
      recipientName,
      amount: transferAmount,
      senderAccountNo,
      discretionaryBudget: discretionaryBudget || 800
    });

    let bilingual = { en: "", ms: "" };
    let quarantineId: string | undefined;

    if (screening.riskLevel === "RED") {
      bilingual = await generateFraudExplainability({
        recipientName,
        amount: transferAmount,
        unusualHour: new Date().getHours() >= 0 && new Date().getHours() <= 5,
        score: screening.riskScore,
        blacklistReason: screening.blacklistMatch?.incidentCategory || screening.reason
      });

      quarantineId = `qtx_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
      const now = new Date();
      
      try {
        await createQuarantineTransfer({
          id: quarantineId,
          senderAccountNo,
          recipientAccountNo,
          recipientName,
          amount: transferAmount,
          riskScore: screening.riskScore,
          status: "PENDING",
          riskReason: screening.reason,
          createdAt: now,
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000)
        });
      } catch (dbWriteErr) {
        console.error("[Quarantine Logging] Error writing transfer record:", dbWriteErr);
      }
    }

    return res.json({
      status: "screened",
      riskLevel: screening.riskLevel,
      riskScore: screening.riskScore,
      requiresVerification: screening.requiresVerification,
      reason: screening.reason,
      warnings: { en: bilingual.en, ms: bilingual.ms },
      blacklistMatch: screening.blacklistMatch
        ? {
            holderName: screening.blacklistMatch.holderName,
            incidentCategory: screening.blacklistMatch.incidentCategory,
            confidenceScore: screening.blacklistMatch.confidenceScore,
            reportedBy: screening.blacklistMatch.reportedBy,
            flaggedDate: screening.blacklistMatch.flaggedDate
          }
        : null,
      quarantineId: quarantineId ?? null,
      actionRequired:
        screening.riskLevel === "RED"
          ? "hard_intercept_requires_otp_or_override"
          : screening.riskLevel === "AMBER"
            ? "soft_warning_manual_confirm"
            : "silent_approval"
    });
  } catch (err) {
    console.error("[screen-transfer] Critical Router Failure Exception:", err);
    return res.status(500).json({ error: "Screening service configuration error. Transaction blocked for safety." });
  }
});

/**
 * POST /api/override-quarantine
 */
router.post("/override-quarantine", async (req, res) => {
  const { quarantineId, verificationMethod, verificationCode } = req.body;

  if (!quarantineId) {
    return res.status(400).json({ error: "Missing quarantineId" });
  }

  try {
    if (verificationMethod === "caregiver_otp") {
      const isValidOtp = verificationCode === "123456";
      if (isValidOtp) {
        await updateQuarantineStatus(quarantineId, "APPROVED", verificationCode);
        return res.json({
          success: true,
          message: "Caregiver verification passed. Transfer approved.",
          quarantineStatus: "APPROVED"
        });
      }
      return res.status(403).json({ error: "Invalid OTP code. Transaction remains blocked." });
    }

    if (verificationMethod === "security_override") {
      await updateQuarantineStatus(quarantineId, "APPROVED", verificationCode || "OVERRIDE");
      return res.json({
        success: true,
        message: "Security override accepted. Transfer approved.",
        quarantineStatus: "APPROVED"
      });
    }

    return res.status(403).json({ error: "Unsupported verification method. Transaction remains blocked." });
  } catch (err) {
    console.error("[override-quarantine] Error:", err);
    return res.status(500).json({ error: "Override service error." });
  }
});

/**
 * POST /api/receiver-stage-update
 */
router.post("/receiver-stage-update", async (req, res) => {
  const { accountNo, velocityDelta, forceStage } = req.body;

  if (!accountNo) {
    return res.status(400).json({ error: "Missing accountNo" });
  }

  try {
    let stage = await getReceiverStageFirestore(accountNo);
    if (!stage) {
      stage = {
        accountNo,
        velocityScore: 0,
        currentStage: "NORMAL",
        lastVerified: new Date()
      };
    }

    if (typeof velocityDelta === "number") {
      stage.velocityScore += velocityDelta;
    }

    if (forceStage) {
      stage.currentStage = forceStage;
    } else {
      if (stage.velocityScore >= 80) {
        stage.currentStage = "STAGE_3_EVICT";
      } else if (stage.velocityScore >= 50) {
        stage.currentStage = "STAGE_2_FREEZE";
      } else if (stage.velocityScore >= 20) {
        stage.currentStage = "STAGE_1_WARN";
      } else {
        stage.currentStage = "NORMAL";
      }
    }

    stage.lastVerified = new Date();
    await updateReceiverStageFirestore(accountNo, stage);

    return res.json({ success: true, receiverStage: stage });
  } catch (err) {
    console.error("[receiver-stage-update] Error:", err);
    return res.status(500).json({ error: "Failed to update receiver stage." });
  }
});

router.get("/check-blacklist/:accountNo", async (req, res) => {
  const { accountNo } = req.params;
  try {
    const blacklistEntry = await getBlacklistAccount(accountNo);
    return res.json({
      isBlacklisted: !!blacklistEntry,
      details: blacklistEntry || null
    });
  } catch (err) {
    console.error("[check-blacklist] Error:", err);
    return res.status(500).json({ error: "Failed to check blacklist." });
  }
});

router.get("/quarantine/:quarantineId", async (req, res) => {
  const { quarantineId } = req.params;
  try {
    const quarantine = await getQuarantineTransfer(quarantineId);
    if (!quarantine) {
      return res.status(404).json({ error: "Quarantine record not found" });
    }
    return res.json(quarantine);
  } catch (err) {
    console.error("[quarantine GET] Error:", err);
    return res.status(500).json({ error: "Failed to fetch quarantine record." });
  }
});