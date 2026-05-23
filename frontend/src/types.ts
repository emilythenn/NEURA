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
}

export interface PredictResult {
  amount: number;
  category: string;
  itemName: string;
  baseline: {
    userBaselineMean: number;
    zScore: number;
    isNormal: boolean;
  };
  decisionType: "reasonable" | "risky" | "impulsive" | "financially heavy";
  affordability: {
    budgetRemaining: number;
    remainingAfterPurchase: number;
    pressure: "CRITICAL" | "HIGH" | "LOW";
    budgetImpactPct: number;
  };
  behavioral: {
    lateNightActive: boolean;
    impulseProbability: number;
  };
  result: {
    recommendation: "PROCEED" | "REVIEW" | "RECONSIDER";
    color: string;
    explanation: string;
    riskScore: number;
  };
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
    category: string;
    halalStatus: string;
    shariahAudit: string;
  };
  savings: number;
  budgetImpact: {
    remaining: number;
    message: string;
    color: string;
  };
  timeValueHours: number;
  coolingSeconds: number;
}
