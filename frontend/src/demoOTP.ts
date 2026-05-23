/**
 * Demo OTP codes for testing elderly caregiver verification and fraud override flows.
 * Used when actual SMS authentication is unavailable.
 * 
 * 5 success codes: Validates caregiver approval and fraud override transactions
 * 5 failure codes: Tests rejection scenarios and error handling
 */

// SUCCESS codes - use these to test successful verification
const SUCCESS_CODES = ['482756', '931847', '627394', '154829', '793461'];

// FAILURE codes - use these to test failed verification
const FAILURE_CODES = ['281659', '756234', '419837', '938462', '562891'];

export const DEMO_OTP_CODES = {
  success: SUCCESS_CODES,
  failure: FAILURE_CODES,
};

export function isValidOtp(code: string): boolean {
  return DEMO_OTP_CODES.success.includes(code);
}

export function isInvalidOtp(code: string): boolean {
  return DEMO_OTP_CODES.failure.includes(code);
}

export function generateDemoOtp(): string {
  // Return a random success code to display as hint
  const index = Math.floor(Math.random() * DEMO_OTP_CODES.success.length);
  return DEMO_OTP_CODES.success[index];
}

export function getOtpHint(code: string): string {
  if (isValidOtp(code)) {
    return "✓ Valid code - verification will succeed";
  } else if (isInvalidOtp(code)) {
    return "✗ Invalid code - verification will fail";
  }
  return "Unknown code";
}

export function getSuccessCodes(): string[] {
  return [...DEMO_OTP_CODES.success];
}

export function getFailureCodes(): string[] {
  return [...DEMO_OTP_CODES.failure];
}
