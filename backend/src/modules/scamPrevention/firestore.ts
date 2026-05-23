import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import type { RecipientBlacklist, TransactionQuarantine, ReceiverStage } from "./types";

let db: any = null;

function getDb() {
  if (!db) {
    // Validate Firebase app initialization before accessing Firestore
    if (getApps().length === 0) {
      console.error("❌ [Firestore SDK Error] Firestore was accessed before initializeApp() finished executing inside app.ts!");
      return null;
    }
    db = getFirestore();
  }
  return db;
}

export async function getBlacklistAccount(accountNo: string): Promise<RecipientBlacklist | null> {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) return null; // Database not initialized, return null to allow graceful degradation

    const doc = await firestoreDb.collection("mule_blacklist").doc(accountNo).get();
    if (!doc.exists) return null;
    return doc.data() as RecipientBlacklist;
  } catch (err) {
    console.error("[Firestore Failure Context] getBlacklistAccount error:", err);
    return null;
  }
}

export async function createQuarantineTransfer(data: TransactionQuarantine): Promise<void> {
  const firestoreDb = getDb();
  if (!firestoreDb) {
    console.warn("[Firestore Bypass] Saving skipped: Connection uninitialized.");
    return;
  }
  
  await firestoreDb.collection("quarantine_transfers").doc(data.id).set({
    id: data.id,
    senderAccountNo: data.senderAccountNo,
    recipientAccountNo: data.recipientAccountNo,
    recipientName: data.recipientName,
    amount: data.amount,
    riskScore: data.riskScore,
    otpCode: data.otpCode || null,
    status: data.status,
    riskReason: data.riskReason,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
  });
}

export async function getQuarantineTransfer(id: string): Promise<TransactionQuarantine | null> {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) return null;

    const doc = await firestoreDb.collection("quarantine_transfers").doc(id).get();
    return doc.exists ? (doc.data() as TransactionQuarantine) : null;
  } catch (err) {
    console.error("[Firestore Failure Context] getQuarantineTransfer error:", err);
    return null;
  }
}

export async function updateQuarantineStatus(id: string, status: string, otpCode?: string): Promise<boolean> {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) return false;

    const docRef = firestoreDb.collection("quarantine_transfers").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.update({ status, ...(otpCode ? { otpCode } : {}) });
    return true;
  } catch (err) {
    console.error("[Firestore Failure Context] updateQuarantineStatus error:", err);
    return false;
  }
}

export async function getReceiverStage(accountNo: string): Promise<ReceiverStage | null> {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) return null;

    const doc = await firestoreDb.collection("receiver_stages").doc(accountNo).get();
    return doc.exists ? (doc.data() as ReceiverStage) : null;
  } catch (err) {
    console.error("[Firestore Failure Context] getReceiverStage error:", err);
    return null;
  }
}

export async function updateReceiverStageFirestore(accountNo: string, data: Partial<ReceiverStage>): Promise<void> {
  const firestoreDb = getDb();
  if (!firestoreDb) return;
  await firestoreDb.collection("receiver_stages").doc(accountNo).set(data, { merge: true });
}

export interface LinkedSuspiciousAccount {
  accountNo: string;
  linkedBlacklistAccounts: Array<{
    blacklistAccountNo: string;
    connectionType: "transfers_to" | "receives_from" | "bidirectional";
    transactionCount: number;
    totalAmount: number;
    lastTransactionDate: Date;
  }>;
  riskScore: number;
  incidentCategory: string;
  detectedDate: Date;
  status: "ACTIVE" | "ARCHIVED";
}

export async function getLinkedSuspiciousAccount(accountNo: string): Promise<LinkedSuspiciousAccount | null> {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) return null;

    const doc = await firestoreDb.collection("linked_suspicious_accounts").doc(accountNo).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as LinkedSuspiciousAccount;
    // Only return if status is ACTIVE
    if (data.status !== "ACTIVE") return null;
    
    return data;
  } catch (err) {
    console.error("[Firestore Failure Context] getLinkedSuspiciousAccount error:", err);
    return null;
  }
}