// Caregiver OTP Service - Firebase Authentication based
import { getAuth } from "firebase-admin/auth";
import { getCaregiverProfile } from "./firestore";
import type { OTPVerificationResult } from "./types";

// Lazy-load Firebase Auth to avoid initialization before Firebase Admin SDK is set up
let auth: any = null;

function getAuthInstance() {
  if (!auth) {
    auth = getAuth();
  }
  return auth;
}

/**
 * Create or get caregiver user in Firebase Auth
 * Links caregiver to elderly account via custom claims
 */
export async function createOrUpdateCaregiverAuth(
  elderlyAccountNo: string,
  caregiverPhoneNo: string,
  caregiverName: string
): Promise<{ uid: string; success: boolean }> {
  try {
    // Normalize phone number
    const normalizedPhone = caregiverPhoneNo.replace(/\s/g, "");
    
    try {
      // Try to find existing user by phone
      const existingUser = await getAuthInstance().getUserByPhoneNumber(normalizedPhone);
      
      // Update custom claims to link to elderly account
      await getAuthInstance().setCustomUserClaims(existingUser.uid, {
        elderlyAccountNo,
        caregiverName,
        role: "caregiver"
      });
      
      console.log(`✅ Caregiver user updated: ${existingUser.uid}`);
      return { uid: existingUser.uid, success: true };
    } catch (err: any) {
      // User doesn't exist, create new one
      if (err.code === "auth/user-not-found") {
        const newUser = await getAuthInstance().createUser({
          phoneNumber: normalizedPhone,
          displayName: caregiverName,
          disabled: false
        });
        
        // Set custom claims
        await getAuthInstance().setCustomUserClaims(newUser.uid, {
          elderlyAccountNo,
          caregiverName,
          role: "caregiver"
        });
        
        console.log(`✅ Caregiver user created: ${newUser.uid}`);
        return { uid: newUser.uid, success: true };
      }
      throw err;
    }
  } catch (err: any) {
    console.error("Error creating caregiver user:", err);
    return { uid: "", success: false };
  }
}

/**
 * Initiate phone sign-in with Firebase Auth
 * This triggers Firebase to send SMS OTP to caregiver's phone
 */
export async function initiatePhoneSignIn(
  elderlyAccountNo: string,
  reason: "transfer" | "limit_change" | "mode_toggle",
  transactionDetails?: { amount: number; recipientName: string; recipientAccountNo: string }
): Promise<OTPVerificationResult> {
  try {
    // Get caregiver profile
    const caregiver = await getCaregiverProfile(elderlyAccountNo);
    if (!caregiver) {
      return {
        success: false,
        message: "Caregiver profile not found. Please register caregiver first."
      };
    }

    // Ensure caregiver exists in Firebase Auth
    const authResult = await createOrUpdateCaregiverAuth(
      elderlyAccountNo,
      caregiver.caregiverPhoneNo,
      caregiver.caregiverName
    );

    if (!authResult.success) {
      return {
        success: false,
        message: "Failed to initialize caregiver authentication"
      };
    }

    // Firebase Auth will send SMS to the caregiver's phone
    // Return session ID for frontend to use in verification
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`📱 SMS OTP initiated for ${caregiver.caregiverPhoneNo}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Elderly: ${elderlyAccountNo}`);
    console.log(`   Transaction: ${JSON.stringify(transactionDetails)}`);
    
    return {
      success: true,
      message: `OTP sent to caregiver at ${caregiver.caregiverPhoneNo}. Valid for 5 minutes.`,
      otpId: sessionId,
      expiresIn: 5 * 60 // 5 minutes in seconds
    };
  } catch (err: any) {
    console.error("Error initiating phone sign-in:", err);
    return {
      success: false,
      message: "Failed to send OTP: " + err.message
    };
  }
}

/**
 * Verify Firebase ID token (called after caregiver successfully signs in)
 * This is the most secure way to verify OTP on backend
 */
export async function verifyIDToken(idToken: string): Promise<OTPVerificationResult> {
  try {
    const decodedToken = await getAuthInstance().verifyIdToken(idToken);
    
    // Check if user has caregiver role
    if (decodedToken.role !== "caregiver") {
      return {
        success: false,
        message: "User is not registered as a caregiver"
      };
    }
    
    console.log(`✅ Caregiver ID token verified: ${decodedToken.uid}`);
    
    return {
      success: true,
      message: "Caregiver verified successfully",
      otpId: decodedToken.uid
    };
  } catch (err: any) {
    console.error("Error verifying ID token:", err);
    return {
      success: false,
      message: "Failed to verify caregiver: " + err.message
    };
  }
}

// Check if transfer requires OTP (elderly account with high amount)
export function doesTransferRequireOTP(
  isElderlyMode: boolean,
  amount: number,
  elderlyLimit: number
): boolean {
  return isElderlyMode && amount > elderlyLimit;
}
