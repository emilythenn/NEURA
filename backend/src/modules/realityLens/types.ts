export interface ProductCatalogItem {
  name: string;
  storePrice: number;
  onlinePrice: number;
  onlineSourceName: string;
  onlineSourceUrl?: string;
  category: string;
  halalStatus: string;
  shariahAudit: string;
  marketplaceComparisons?: Array<{
    platform: "Lazada" | "Shopee";
    price: number;
    url: string;
  }>;
}

export interface RealityLensScanRequest {
  label?: string;
  attachmentLabel?: string;
  imageBase64?: string;
  overridePrice?: number;
  hourlyRate?: number;
}

export interface RealityLensState {
  totalBalance: number;
  discretionaryBudget: number;
  discretionaryBudgetTotal: number;
  lockedVaults: Array<{ id: string; name: string; amount: number; type: string }>;
}

export interface RealityLensScanResponse {
  matchedProduct: string;
  detectedLabel: string;
  details: ProductCatalogItem;
  verdict: {
    status: "EXPENSIVE" | "FAIR" | "CHEAPER_IN_STORE";
    badgeColor: string;
    message: string;
    overpayAmount: number;
  };
  savings: number;
  budgetImpact: {
    category: string;
    level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    remaining: number;
    impactPct: number;
    message: string;
    color: string;
  };
  timeValue: {
    hours: number;
    statement: string;
  };
  shariahShield: {
    status: string;
    message: string;
    safeToProceed: boolean;
  };
  bottomSheetActions: {
    canSaveDifference: boolean;
    canDelayLock: boolean;
    canProceedSafely: boolean;
    suggestedTransferAmount: number;
  };
  coolingSeconds: number;
}