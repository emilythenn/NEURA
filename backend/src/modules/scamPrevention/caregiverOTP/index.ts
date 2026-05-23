// Caregiver OTP Module - Firebase Authentication based
export { router } from "./router";
export { initiatePhoneSignIn, verifyIDToken, createOrUpdateCaregiverAuth, doesTransferRequireOTP } from "./service";
export type { OTPVerificationResult, CaregiverProfile, ApprovalEvent } from "./types";
