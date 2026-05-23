// Caregiver OTP Router - API endpoints using Firebase Auth
import express, { Request, Response } from "express";
import { initiatePhoneSignIn, verifyIDToken, doesTransferRequireOTP } from "./service";
import { saveCaregiverProfile, logApprovalEvent, getApprovalHistory } from "./firestore";

export const router = express.Router();

/**
 * POST /api/caregiver/setup
 * Register/update caregiver profile for elderly account
 */
router.post("/caregiver/setup", async (req: Request, res: Response) => {
  try {
    const { elderlyAccountNo, caregiverPhoneNo, caregiverEmail, caregiverName, relationship, notificationPreference } = req.body;

    if (!elderlyAccountNo || !caregiverPhoneNo || !caregiverName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: elderlyAccountNo, caregiverPhoneNo, caregiverName"
      });
    }

    await saveCaregiverProfile({
      elderlyAccountNo,
      caregiverPhoneNo: caregiverPhoneNo.replace(/\s/g, ""), // Remove spaces
      caregiverEmail,
      caregiverName,
      relationship,
      notificationPreference: notificationPreference || "sms",
      isActive: true,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      message: "Caregiver profile registered successfully"
    });
  } catch (err: any) {
    console.error("Error setting up caregiver:", err);
    res.status(500).json({
      success: false,
      message: "Failed to register caregiver: " + err.message
    });
  }
});

/**
 * POST /api/caregiver/send-otp
 * Firebase Auth sends OTP to caregiver's phone
 */
router.post("/caregiver/send-otp", async (req: Request, res: Response) => {
  try {
    const { elderlyAccountNo, reason, transactionDetails } = req.body;

    if (!elderlyAccountNo || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: elderlyAccountNo, reason"
      });
    }

    if (!["transfer", "limit_change", "mode_toggle"].includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reason. Must be: transfer, limit_change, or mode_toggle"
      });
    }

    const result = await initiatePhoneSignIn(
      elderlyAccountNo,
      reason,
      transactionDetails
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    console.error("Error sending OTP:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP: " + err.message
    });
  }
});

/**
 * POST /api/caregiver/verify-otp
 * Verify caregiver with Firebase ID token (after they sign in with OTP)
 * Frontend calls this after caregiver successfully completes phone sign-in
 */
router.post("/caregiver/verify-otp", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: idToken"
      });
    }

    const result = await verifyIDToken(idToken);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    console.error("Error verifying ID token:", err);
    res.status(500).json({
      success: false,
      message: "Failed to verify caregiver: " + err.message
    });
  }
});

/**
 * GET /api/caregiver/check-otp-required
 * Check if transfer requires OTP verification
 */
router.get("/caregiver/check-otp-required", (req: Request, res: Response) => {
  try {
    const { isElderlyMode, amount, elderlyLimit } = req.query;

    const requiresOTP = doesTransferRequireOTP(
      isElderlyMode === "true",
      parseFloat(amount as string) || 0,
      parseFloat(elderlyLimit as string) || 0
    );

    res.json({
      requiresOTP,
      message: requiresOTP ? "This transfer requires caregiver approval" : "No OTP required"
    });
  } catch (err: any) {
    console.error("Error checking OTP requirement:", err);
    res.status(500).json({
      success: false,
      message: "Failed to check OTP requirement: " + err.message
    });
  }
});

/**
 * POST /api/caregiver/log-approval
 * Log approval event for audit trail
 */
router.post("/caregiver/log-approval", async (req: Request, res: Response) => {
  try {
    const { elderlyAccountNo, caregiverPhoneNo, reason, approved, transactionDetails } = req.body;

    await logApprovalEvent(
      elderlyAccountNo,
      caregiverPhoneNo,
      reason,
      approved,
      transactionDetails
    );

    res.json({
      success: true,
      message: `Approval event logged`
    });
  } catch (err: any) {
    console.error("Error logging approval:", err);
    res.status(500).json({
      success: false,
      message: "Failed to log approval: " + err.message
    });
  }
});

/**
 * GET /api/caregiver/approval-history/:elderlyAccountNo
 * Get approval history for elderly account
 */
router.get("/caregiver/approval-history/:elderlyAccountNo", async (req: Request, res: Response) => {
  try {
    const { elderlyAccountNo } = req.params;
    const history = await getApprovalHistory(elderlyAccountNo);

    res.json({
      success: true,
      elderlyAccountNo,
      approvals: history
    });
  } catch (err: any) {
    console.error("Error retrieving approval history:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve approval history: " + err.message
    });
  }
});

export default router;
