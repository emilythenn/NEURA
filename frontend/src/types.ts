export interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status?: "completed" | "cancelled" | "refunded";
  reason?: string;
}

export interface FinancingAccount {
  id: string;
  type: string;
  nextPayment: number;
  originalAmount: number;
  remaining: number;
}

export interface AutoDebit {
  id:        string;
  name:      string;
  category:  string;
  amount:    number;
  frequency: string;
  status:    "Active" | "Paused";
  nextDate:  string;
  provider:  string;
}

export interface LockedVault {
  id: string;
  name: string;
  amount: number;
  type: string;
}

export interface AccountsState {
  totalBalance: number;
  discretionaryBudget: number;
  discretionaryBudgetTotal: number;
  fixedExpenses: number;
  userName: string;
  accountNo: string;
  financingAccounts: FinancingAccount[];
  transactions: Transaction[];
  elderlyMode: boolean;
  elderlyLimit: number;
  caregiverName: string;
  caregiverPhone: string;
  isCaregiverApproved: boolean;
  lockedVaults: LockedVault[];
  autoDebits: AutoDebit[]; 
}

export interface PredictResult {
  predictionId: string;
  userId: string;
  itemName: string;
  category: string;
  amount: number;
  riskScore: number;
  verdict: "PROCEED" | "REVIEW" | "RECONSIDER";
  pressureLevel: "LOW" | "MEDIUM" | "CRITICAL";
  classification: string;
  impulseProbability: number;
  budgetImpactPercent: number;
  budgetDiscPercent: number;
  remainingAfterPurchase: number;
  willGoNegative: boolean;
  lateNightActive: boolean;
  explanation: string;
  scoreBreakdown: Record<string, number>;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  agent?: "Orchestrator" | "Shield" | "Mizan" | "Barakah" | "Ehsan" | "Safar";
  tip?: string;
  time: string;
  actionNeeded?: boolean;
  actionDetails?: {
    type: string;
    message: string;
  };
  image?: string;
}

export interface ProductScanResult {
  matchedProduct: string;
  details: {
    name: string;
    storePrice: number;
    onlinePrice: number;
    onlineSourceName: string;
    onlineSourceUrl?: string;
    category: string;
    halalStatus: string;
    shariahAudit: string;
    marketplaceComparisons?: { platform: string; price: number; url?: string }[];
  };
  savings: number;
  budgetImpact: {
    remaining: number;
    message: string;
    color: string;
    level?: string;
    category?: string;
  };
  timeValueHours: number;
  coolingSeconds: number;
  detectedLabel?: string;
  verdict?: { status?: string };
  shariahShield?: { status?: string; message?: string };
  bottomSheetActions?: {
    canSaveDifference?: boolean;
    suggestedTransferAmount?: number;
    canDelayLock?: boolean;
    canProceedSafely?: boolean;
  };
}
