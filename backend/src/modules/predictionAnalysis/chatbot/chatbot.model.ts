export type IntentType =
  | "ASK_DISCOUNT"
  | "SAVE_TO_WISHLIST"
  | "CANCEL_PURCHASE"
  | "PROCEED_ANYWAY";

export interface IntentContext {
  itemName:    string;
  amount:      number;
  category:    string;
  riskScore:   number;
  explanation?: string;
}

export interface IntentRequest {
  userId:  string;
  intent:  IntentType;
  context: IntentContext;
}

export interface DecisionLogDoc {
  id:        string;
  userId:    string;
  itemName:  string;
  amount:    number;
  category:  string;
  riskScore: number;
  action:    IntentType;
  timestamp: number;
}
