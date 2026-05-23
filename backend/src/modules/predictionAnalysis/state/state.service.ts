import { v4 as uuidv4 } from "uuid";
import { getDb, now } from "../../../config/firebase";
import { AccountsState, AutoDebit } from "../../../types/state.types";
import { getFinancialSummary } from "../finance/finance.service";
import { createExpense } from "../tracker/tracker.service";
import { ExpenseCategory } from "../tracker/tracker.model";

const DOC_ID = "default_user";
const COL    = "accountState";

const DEFAULTS: AccountsState = {
  // Financial values are always derived live from the tracker — never seeded here.
  totalBalance:             0,
  discretionaryBudget:      0,
  discretionaryBudgetTotal: 0,
  fixedExpenses:            0,
  userName:                 "Encik Mohamad Zulhilmy",
  accountNo:                "150123456789",
  financingAccounts:        [],
  transactions:             [],
  elderlyMode:              false,
  elderlyLimit:             300.00,
  caregiverName:            "Sara",
  caregiverPhone:           "+60 12-345 6789",
  isCaregiverApproved:      false,
  lockedVaults:             [],
  autoDebits: [
    {
      id: "ad-1", name: "Takaful Hijrah Protection Plan-i",
      category: "Takaful Insurance", amount: 45.00,
      frequency: "Monthly", status: "Active",
      nextDate: "2026-06-01", provider: "Syarikat Takaful Malaysia",
    },
    {
      id: "ad-2", name: "Netflix Premium Malaysia",
      category: "Lifestyle Subscription", amount: 55.00,
      frequency: "Monthly", status: "Active",
      nextDate: "2026-06-05", provider: "Netflix Inc.",
    },
    {
      id: "ad-3", name: "Tenaga Nasional Berhad",
      category: "Fixed Utility AutoPay", amount: 148.50,
      frequency: "Monthly", status: "Active",
      nextDate: "2026-06-02", provider: "Tenaga Nasional Berhad",
    },
    {
      id: "ad-4", name: "Lembaga Zakat Selangor (Pusat Kutipan)",
      category: "Regular Saddaqah / Zakat", amount: 100.00,
      frequency: "Monthly", status: "Active",
      nextDate: "2026-06-10", provider: "Zakat Selangor Darul Ehsan",
    },
    {
      id: "ad-5", name: "Astro GO Media Subscription",
      category: "Entertainment", amount: 95.00,
      frequency: "Monthly", status: "Paused",
      nextDate: "Suspended", provider: "Astro Malaysia Holding",
    },
  ],
};

// ── Read ──────────────────────────────────────────────────────────────────────

export async function fetchState(): Promise<AccountsState> {
  const ref = getDb().collection(COL).doc(DOC_ID);

  // Run both reads in parallel — Firestore doc for non-financial state,
  // finance summary for the live balance/budget derived from tracker data.
  const [doc, summary] = await Promise.all([
    ref.get(),
    getFinancialSummary(DOC_ID),
  ]);

  let state: AccountsState;
  if (!doc.exists) {
    await ref.set({ ...DEFAULTS, createdAt: now() });
    state = { ...DEFAULTS };
  } else {
    const { createdAt: _c, updatedAt: _u, ...rest } = doc.data() as AccountsState & Record<string, unknown>;
    state = rest as AccountsState;
  }

  // Always override financial fields with live tracker-computed values.
  // These must never come from the Firestore seed.
  return {
    ...state,
    totalBalance:             summary.netBalance,
    fixedExpenses:            summary.fixedExpenses,
    discretionaryBudget:      summary.discretionaryBudget,
    discretionaryBudgetTotal: summary.discretionaryBudget,
  };
}

// ── Elderly mode ──────────────────────────────────────────────────────────────

export async function setElderlyMode(
  enabled: boolean,
  limit?: number,
  caregiverName?: string,
  caregiverPhone?: string
): Promise<AccountsState> {
  const ref = getDb().collection(COL).doc(DOC_ID);
  await ref.set({
    elderlyMode: enabled,
    ...(limit          !== undefined && { elderlyLimit: limit }),
    ...(caregiverName  !== undefined && { caregiverName }),
    ...(caregiverPhone !== undefined && { caregiverPhone }),
    updatedAt: now(),
  }, { merge: true });
  return fetchState();
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export async function resetToDefaults(): Promise<AccountsState> {
  await getDb().collection(COL).doc(DOC_ID).set({ ...DEFAULTS, updatedAt: now() });
  return DEFAULTS;
}

// ── Vault ─────────────────────────────────────────────────────────────────────

export async function addToVault(itemName: string, amount: number): Promise<AccountsState> {
  const state = await fetchState();
  const vault = { id: uuidv4(), name: itemName, amount, type: "wishlist" };
  await getDb().collection(COL).doc(DOC_ID).set({
    lockedVaults: [...state.lockedVaults, vault],
    updatedAt: now(),
  }, { merge: true });
  return fetchState();
}

// Maps state-level category labels to tracker ExpenseCategory enum values.
const STATE_TO_TRACKER_CATEGORY: Record<string, ExpenseCategory> = {
  "Shopping":      "Shopping",
  "Entertainment": "Entertainment",
  "Food & Dining": "Food & Dining",
  "Transportation":"Transportation",
  "Bills":         "Bills & Utilities",
  "Bills & Utilities": "Bills & Utilities",
  "Savings":       "Savings",
  "Investments":   "Investments",
};

function toTrackerCategory(stateCategory: string): ExpenseCategory {
  return STATE_TO_TRACKER_CATEGORY[stateCategory] ?? "Bills & Utilities";
}

// ── Transfer ──────────────────────────────────────────────────────────────────

export async function recordTransfer(
  amount: number, description: string, category: string
): Promise<AccountsState> {
  const today = new Date().toISOString().slice(0, 10);
  const transaction = {
    id: uuidv4(),
    date: today,
    category, description, amount,
    status: "completed" as const,
  };

  // Write the expense to the tracker — this is the single source of truth for
  // balance. fetchState() reads balance from tracker, so only tracker writes move it.
  await Promise.all([
    createExpense(
      DOC_ID,
      description,
      toTrackerCategory(category),
      amount,
      today,
    ),
    // Keep transaction display history in state doc (for history feed in UI)
    (async () => {
      const state = await fetchState();
      await getDb().collection(COL).doc(DOC_ID).set({
        transactions: [transaction, ...state.transactions],
        updatedAt: now(),
      }, { merge: true });
    })(),
  ]);

  return fetchState();
}

// ── AutoDebits ────────────────────────────────────────────────────────────────

export async function addAutoDebit(data: Omit<AutoDebit, "id">): Promise<AccountsState> {
  const state = await fetchState();
  const entry: AutoDebit = { id: uuidv4(), ...data };
  await getDb().collection(COL).doc(DOC_ID).set({
    autoDebits: [...state.autoDebits, entry],
    updatedAt: now(),
  }, { merge: true });
  return fetchState();
}

export async function toggleAutoDebit(id: string): Promise<AccountsState> {
  const state = await fetchState();
  const autoDebits = state.autoDebits.map((ad) =>
    ad.id === id
      ? { ...ad, status: ad.status === "Active" ? "Paused" : "Active" as "Active" | "Paused" }
      : ad
  );
  await getDb().collection(COL).doc(DOC_ID).set({ autoDebits, updatedAt: now() }, { merge: true });
  return fetchState();
}

export async function deleteAutoDebit(id: string): Promise<AccountsState> {
  const state = await fetchState();
  const autoDebits = state.autoDebits.filter((ad) => ad.id !== id);
  await getDb().collection(COL).doc(DOC_ID).set({ autoDebits, updatedAt: now() }, { merge: true });
  return fetchState();
}