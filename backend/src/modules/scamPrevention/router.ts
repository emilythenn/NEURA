// Scam Prevention Module Router
import express from "express";
import {
  evaluateTransferRisk,
  generateFraudExplainability,
  createQuarantine,
  releaseQuarantine,
  updateReceiverStage,
  getQuarantine,
  checkBlacklist
} from "./service";

export const router = express.Router();

/**
 * POST /api/screen-transfer
 * Real-time fraud screening with risk level branching
 */
router.post("/screen-transfer", async (req, res) => {
  const { recipientAccountNo, recipientName, amount, senderAccountNo, discretionaryBudget } = req.body;

  if (!recipientAccountNo || !recipientName || !amount || !senderAccountNo) {
    return res.status(400).json({ error: "Missing required transfer parameters" });
  }

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: "Invalid transfer amount" });
  }

  const screening = evaluateTransferRisk({
    recipientAccountNo,
    recipientName,
    amount: transferAmount,
    senderAccountNo,
    discretionaryBudget: discretionaryBudget || 800
  });

  let bilingual = { en: "", ms: "" };
  if (screening.riskLevel === "RED") {
    bilingual = await generateFraudExplainability({
      recipientName,
      amount: transferAmount,
      unusualHour: new Date().getHours() >= 0 && new Date().getHours() <= 5,
      score: screening.riskScore,
      blacklistReason: screening.blacklistMatch?.flagged_reason
    });
  }

  if (screening.riskLevel === "RED") {
    createQuarantine({
      senderAccountNo,
      receiverAccountNo: recipientAccountNo,
      amount: transferAmount,
      riskScore: screening.riskScore,
      riskReason: screening.reason
    });
  }

  res.json({
    status: "screened",
    riskLevel: screening.riskLevel,
    riskScore: screening.riskScore,
    requiresVerification: screening.requiresVerification,
    reason: screening.reason,
    warnings: { en: bilingual.en, ms: bilingual.ms },
    actionRequired:
      screening.riskLevel === "RED"
        ? "hard_intercept_requires_otp_or_override"
        : screening.riskLevel === "AMBER"
          ? "soft_warning_manual_confirm"
          : "silent_approval"
  });
});

/**
 * POST /api/override-quarantine
 * Release RED-flagged transfer with OTP verification
 */
router.post("/override-quarantine", (req, res) => {
  const { quarantineId, verificationMethod, verificationCode } = req.body;

  if (verificationMethod === "caregiver_otp") {
    const isValidOtp = verificationCode === "123456"; // Demo OTP
    if (isValidOtp) {
      const success = releaseQuarantine(quarantineId, verificationCode);
      if (success) {
        return res.json({
          success: true,
          message: "Caregiver verification passed. Transfer approved.",
          quarantineStatus: "RELEASED"
        });
      }
    }
  }

  if (verificationMethod === "security_override") {
    const success = releaseQuarantine(quarantineId, verificationCode || "OVERRIDE");
    if (success) {
      return res.json({
        success: true,
        message: "Security override accepted. Transfer approved.",
        quarantineStatus: "RELEASED"
      });
    }
  }

  res.status(403).json({ error: "Verification failed. Transaction remains blocked." });
});

/**
 * POST /api/receiver-stage-update
 * Update mule escalation stage and velocity tracking
 */
router.post("/receiver-stage-update", (req, res) => {
  const { accountNo, velocityDelta, forceStage } = req.body;

  if (!accountNo) {
    return res.status(400).json({ error: "Missing accountNo" });
  }

  const stage = updateReceiverStage(accountNo, velocityDelta, forceStage);

  res.json({ success: true, receiverStage: stage });
});

/**
 * GET /api/check-blacklist/:accountNo
 * Check if account is on the mule/blacklist registry
 */
router.get("/check-blacklist/:accountNo", (req, res) => {
  const { accountNo } = req.params;
  const blacklistEntry = checkBlacklist(accountNo);

  res.json({
    isBlacklisted: !!blacklistEntry,
    details: blacklistEntry || null
  });
});

/**
 * GET /api/quarantine/:quarantineId
 * Get quarantine status
 */
router.get("/quarantine/:quarantineId", (req, res) => {
  const { quarantineId } = req.params;
  const quarantine = getQuarantine(quarantineId);

  if (!quarantine) {
    return res.status(404).json({ error: "Quarantine not found" });
  }

  res.json(quarantine);
});
