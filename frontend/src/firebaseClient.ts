import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Initialize Firebase app globally once
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;
  const env: any = (import.meta as any).env || {};
  
  const requiredKeys = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID"
  ];
  
  const missingKeys = requiredKeys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase env keys: ${missingKeys.join(", ")}`);
  }

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };

  initializeApp(firebaseConfig);
  firebaseInitialized = true;
  console.log("[Firebase] Initialized successfully");
}

function getAuthInstance() {
  initFirebase();
  // Use getAuth() without app argument to get the default app's auth
  return getAuth();
}

export async function sendOtp(phoneNumber: string) {
  if (!phoneNumber || !phoneNumber.startsWith("+")) {
    throw new Error("OTP phone number must be in E.164 format like +60123456789.");
  }

  const containerId = "recaptcha-container";
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container '#${containerId}' not found in DOM.`);
  }

  try {
    const auth = getAuthInstance();
    console.log("[Firebase] Auth instance:", {
      exists: !!auth,
      type: typeof auth,
      hasCurrentUser: !!auth?.currentUser,
      hasSettings: !!auth?.settings
    });

    // Clear any existing verifier
    // @ts-ignore
    if (window.recaptchaVerifier?.clear) {
      // @ts-ignore
      window.recaptchaVerifier.clear();
    }

    // Create RecaptchaVerifier with the auth instance
    // @ts-ignore
    const verifier = new RecaptchaVerifier(containerId, { size: "invisible" }, auth);
    console.log("[Firebase] RecaptchaVerifier created, rendering...");
    
    await verifier.render();
    console.log("[Firebase] RecaptchaVerifier rendered successfully");
    
    // @ts-ignore
    window.recaptchaVerifier = verifier;
    
    console.log("[Firebase] Calling signInWithPhoneNumber for:", phoneNumber);
    const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    console.log("[Firebase] OTP sent successfully");
    return result;
  } catch (error) {
    console.error("[Firebase] OTP initialization failed:", error, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export default sendOtp;
