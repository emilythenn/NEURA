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
  mode?: string;
  confidence?: number;
  reasoning?: string;
  evidence?: ChatEvidenceItem[];
  sources?: ChatSourceItem[];
  time: string;
  actionNeeded?: boolean;
  actionDetails?: {
    type: string;
    message: string;
  };
  image?: string;
  structured?: ChatStructuredPayload;
}

export interface ChatStructuredPayload {
  payment?: unknown;
  complianceStatus?: string;
  decisionStatus?: string;
  financialSummary?: Record<string, string | number>;
  aiAnalysis?: Record<string, string | number>;
  recommendation?: {
    suggestedAction?: string;
    alternative?: string;
  };
  askFurther?: string[];
  securityResult?: string;
  riskScore?: number;
  threatAnalysis?: {
    detectedSignals?: string[];
    why?: string;
  };
  recommendedActions?: string[];
  saferAlternative?: string;
  halalStructured?: ChatHalalStructured;
  shariahAssessment?: string[] | string;
  explanation?: string;
  zakatStructured?: {
    nisabThreshold?: {
      amount?: string;
      value?: string | number;
    };
    haulPeriod?: {
      duration?: string;
      days?: string;
      requirement?: string;
    };
    zakatRate?: string;
    calculation?: {
      formula?: string;
      example: {
        assetHeld?: string | number;
        unitPrice?: string;
        totalValue?: string | number;
        zakatDue?: string | number;
      };
    };
    suggestedActions?: string[];
    eligibleCategories?: string[];
  };
}

export interface ChatEvidenceItem {
  label: string;
  value: string;
}

export interface ChatSourceItem {
  title: string;
  note: string;
}

export interface ChatHalalChecklistItem {
  category: string;
  status: string;
  description: string;
}

export interface ChatHalalStructured {
  verdict?: string;
  riskLevel?: "High" | "Medium" | "Low" | string;
  checklist?: ChatHalalChecklistItem[];
  guidingPrinciples?: string[];
  suggestedActions?: string[];
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
