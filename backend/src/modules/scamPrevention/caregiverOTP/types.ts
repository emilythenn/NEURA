// Type definitions for Caregiver OTP module using Firebase Auth

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  otpId?: string; // Firebase Auth UID or session ID
  expiresIn?: number; // Seconds
}

export interface CaregiverProfile {
  elderlyAccountNo: string;
  caregiverPhoneNo: string;
  caregiverEmail?: string;
  caregiverName: string;
  relationship: string;
  notificationPreference: "sms" | "email" | "both";
  isActive: boolean;
  firebaseUID?: string; // Firebase Auth UID
  createdAt: number;
  updatedAt?: number;
}

export interface ApprovalEvent {
  elderlyAccountNo: string;
  caregiverPhoneNo: string;
  reason: "transfer" | "limit_change" | "mode_toggle";
  approved: boolean;
  transactionDetails?: {
    amount: number;
    recipientName: string;
    recipientAccountNo: string;
  };
  timestamp: number;
}
