// Scam Prevention Module Types
// Field names match Firestore camelCase schema exactly

export interface RecipientBlacklist {
  accountNo: string;
  holderName: string;
  incidentCategory: string;   // was: flagged_reason
  confidenceScore: number;    // was: confidence_score
  reportedBy: string;
  flaggedDate: string;
}

export interface TransactionQuarantine {
  id: string;
  senderAccountNo: string;      // was: sender_account_no
  recipientAccountNo: string;   // was: receiver_account_no
  recipientName: string;
  amount: number;
  riskScore: number;            // was: risk_score
  otpCode?: string;             // was: otp_code
  status: "PENDING" | "APPROVED" | "CANCELLED" | "EXPIRED";
  riskReason: string;           // was: risk_reason
  createdAt: Date;              // was: created_at
  expiresAt: Date;              // was: expires_at
}

export interface ReceiverStage {
  accountNo: string;            // was: account_no
  holderName?: string;
  velocityScore: number;        // was: velocity_score
  currentStage: "NORMAL" | "STAGE_1_WARN" | "STAGE_2_FREEZE" | "STAGE_3_EVICT";  // was: current_stage; STAGE_1_ALERT → STAGE_1_WARN
  lastVerified: Date;           // was: last_updated_at
}

export interface TransferScreeningResult {
  riskLevel: "GREEN" | "AMBER" | "RED";
  riskScore: number;
  reason: string;
  requiresVerification: boolean;
  blacklistMatch?: RecipientBlacklist;
}

export interface FraudWarning {
  en: string;
  ms: string;
}