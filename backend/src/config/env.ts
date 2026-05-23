import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

export const env = {
  PORT:    parseInt(process.env.PORT ?? "3000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  GEMINI_API_KEY: required("GEMINI_API_KEY"),

  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  FIRESTORE_EMULATOR_HOST:       process.env.FIRESTORE_EMULATOR_HOST,

  PREDICT_RATE_LIMIT: parseInt(process.env.PREDICT_RATE_LIMIT ?? "30", 10),
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173").split(","),
} as const;