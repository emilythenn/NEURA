import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../../config/firebase";
import {
  IncomeDoc, ExpenseDoc,
  IncomeResponse, ExpenseResponse,
  ExpenseCategory,
} from "./tracker.model";

const INCOMES_COL  = "incomes";
const EXPENSES_COL = "expenses";

// ── Income ────────────────────────────────────────────────────────────────

export async function createIncome(
  userId: string, source: string, amount: number, date: string
): Promise<IncomeResponse> {
  const db = getDb();
  const id = uuidv4();
  const doc: IncomeDoc = {
    id, userId, source, amount, date,
    createdAt: admin.firestore.Timestamp.now(),
  };
  await db.collection(INCOMES_COL).doc(id).set(doc);
  const { createdAt: _c, ...response } = doc;
  return response;
}

export async function getIncomes(userId: string): Promise<IncomeResponse[]> {
  const snap = await getDb()
    .collection(INCOMES_COL)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => {
      const { createdAt: _c, ...rest } = d.data() as IncomeDoc;
      return rest;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteIncome(id: string): Promise<void> {
  const ref = getDb().collection(INCOMES_COL).doc(id);
  if (!(await ref.get()).exists) throw new Error(`Income ${id} not found`);
  await ref.delete();
}

// ── Expense ───────────────────────────────────────────────────────────────

export async function createExpense(
  userId: string, name: string, category: ExpenseCategory,
  amount: number, date: string
): Promise<ExpenseResponse> {
  const db = getDb();
  const id = uuidv4();
  const doc: ExpenseDoc = {
    id, userId, name, category, amount, date,
    createdAt: admin.firestore.Timestamp.now(),
  };
  await db.collection(EXPENSES_COL).doc(id).set(doc);
  const { createdAt: _c, ...response } = doc;
  return response;
}

export async function getExpenses(userId: string): Promise<ExpenseResponse[]> {
  const snap = await getDb()
    .collection(EXPENSES_COL)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => {
      const { createdAt: _c, ...rest } = d.data() as ExpenseDoc;
      return rest;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteExpense(id: string): Promise<void> {
  const ref = getDb().collection(EXPENSES_COL).doc(id);
  if (!(await ref.get()).exists) throw new Error(`Expense ${id} not found`);
  await ref.delete();
}