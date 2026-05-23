import admin from "firebase-admin";
import * as fs from "fs";
import { env } from "./env";

let _db: admin.firestore.Firestore | null = null;

export const COLLECTIONS = {
  STATE:        "accountState",
  INCOMES:      "incomes",
  EXPENSES:     "expenses",
  PREDICTIONS:  "predictions",
  VAULTS:       "lockedVaults",
  TRANSACTIONS: "transactions",
} as const;

export function initFirebase(): void {
  if (admin.apps.length > 0) return;

  let credential: admin.credential.Credential;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(sa);
  } else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf-8");
    credential = admin.credential.cert(JSON.parse(raw));
  } else {
    throw new Error(
      "Firebase credentials not configured.\n" +
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH in .env"
    );
  }

  admin.initializeApp({ credential });
  console.log("✅ Firebase Admin SDK initialised");
}

export function getDb(): admin.firestore.Firestore {
  if (!_db) {
    _db = admin.firestore();
    if (env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = env.FIRESTORE_EMULATOR_HOST;
      console.log(`🔧 Firestore emulator: ${env.FIRESTORE_EMULATOR_HOST}`);
    }
  }
  return _db;
}

export const col = (name: string) => getDb().collection(name);
export const now = () => admin.firestore.Timestamp.now();