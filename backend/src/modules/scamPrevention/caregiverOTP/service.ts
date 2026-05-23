import { getAuth } from "firebase-admin/auth";
import { getCaregiverProfile } from "./firestore";
import type { OTPVerificationResult } from "./types";

let auth: any = null;

function getAuthInstance() {
  if (!auth) {
    auth = getAuth();
  }
  return auth;
}

export async function createOrUpdateCaregiverAuth(
  elderlyAccountNo: string,
  caregiverPhoneNo: string,
  caregiverName: string
): Promise<{ uid: string; success: boolean }> {
  try {
    const normalizedPhone = caregiverPhoneNo.replace(/\s/g, "");
    
    try {
      const existingUser = await getAuthInstance().getUserByPhoneNumber(normalizedPhone);
      
      await getAuthInstance().setCustomUserClaims(existingUser.uid, {
        elderlyAccountNo,
        caregiverName,
        role: "caregiver"
      });
      
      console.log(`✅ Caregiver user updated: ${existingUser.uid}`);
      return { uid: existingUser.uid, success: true };
    } catch (err: any) {
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

export async function initiatePhoneSignIn(
  elderlyAccountNo: string,
  reason: "transfer" | "limit_change" | "mode_toggle",
  transactionDetails?: { amount: number; recipientName: string; recipientAccountNo: string }
): Promise<OTPVerificationResult> {
  try {
    const caregiver = await getCaregiverProfile(elderlyAccountNo);
    if (!caregiver) {
      return {
        success: false,
        message: "Caregiver profile not found. Please register caregiver first."
      };
    }

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

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`📱 SMS OTP initiated for ${caregiver.caregiverPhoneNo}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Elderly: ${elderlyAccountNo}`);
    console.log(`   Transaction: ${JSON.stringify(transactionDetails)}`);
    
    return {
      success: true,
      message: `OTP sent to caregiver at ${caregiver.caregiverPhoneNo}. Valid for 5 minutes.`,
      otpId: sessionId,
      expiresIn: 5 * 60
    };
  } catch (err: any) {
    console.error("Error initiating phone sign-in:", err);
    return {
      success: false,
      message: "Failed to send OTP: " + err.message
    };
  }
}

export async function verifyIDToken(idToken: string): Promise<OTPVerificationResult> {
  try {
    const decodedToken = await getAuthInstance().verifyIdToken(idToken);
    
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

export function doesTransferRequireOTP(
  isElderlyMode: boolean,
  amount: number,
  elderlyLimit: number
): boolean {
  return isElderlyMode && amount > elderlyLimit;
}
