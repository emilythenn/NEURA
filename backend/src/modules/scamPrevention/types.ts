// Scam Prevention Module Types
export interface RecipientBlacklist {
  account_no: string;
  holder_name: string;
  flagged_reason: string;
  confidence_score: number;
  reported_by: string;
  created_at: Date;
}

export interface TransactionQuarantine {
  id: string;
  sender_account_no: string;
  receiver_account_no: string;
  amount: number;
  risk_score: number;
  otp_code?: string;
  status: "PENDING_APPROVAL" | "RELEASED" | "BLOCKED";
  risk_reason: string;
  created_at: Date;
  expires_at: Date;
}

export interface ReceiverStage {
  account_no: string;
  velocity_score: number;
  current_stage: "NORMAL" | "STAGE_1_ALERT" | "STAGE_2_FREEZE" | "STAGE_3_EVICT";
  analyst_assigned?: string;
  last_updated_at: Date;
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
