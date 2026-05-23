// Firestore operations for Caregiver OTP with Firebase Auth
import { getFirestore, Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { CaregiverProfile } from "./types";

// Lazy-load Firestore instance to avoid initialization before Firebase Admin SDK is set up
let db: any = null;

function getDb() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

// Save caregiver profile to Firestore
export async function saveCaregiverProfile(profile: CaregiverProfile): Promise<void> {
  await getDb().collection("caregiver_profiles").doc(profile.elderlyAccountNo).set(
    {
      ...profile,
      caregiverPhoneNo: profile.caregiverPhoneNo.replace(/\s/g, ""),
      updatedAt: Timestamp.now()
    },
    { merge: true }
  );
}

// Get caregiver profile from Firestore
export async function getCaregiverProfile(elderlyAccountNo: string): Promise<CaregiverProfile | null> {
  const doc = await getDb().collection("caregiver_profiles").doc(elderlyAccountNo).get();
  if (!doc.exists) return null;

  const data = doc.data() as any;
  return {
    ...data,
    createdAt: data.createdAt?.toMillis() || Date.now()
  };
}

// Log approval events for audit trail
export async function logApprovalEvent(
  elderlyAccountNo: string,
  caregiverPhoneNo: string,
  reason: "transfer" | "limit_change" | "mode_toggle",
  approved: boolean,
  transactionDetails?: any
): Promise<void> {
  await getDb().collection("caregiver_approval_logs").add({
    elderlyAccountNo,
    caregiverPhoneNo,
    reason,
    approved,
    transactionDetails,
    timestamp: Timestamp.now()
  });
}

// Get approval history
export async function getApprovalHistory(
  elderlyAccountNo: string,
  limit: number = 50
): Promise<any[]> {
  const query = await getDb()
    .collection("caregiver_approval_logs")
    .where("elderlyAccountNo", "==", elderlyAccountNo)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return query.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toMillis()
  }));
}
