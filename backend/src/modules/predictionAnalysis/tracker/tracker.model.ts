export interface IncomeDoc {
  id:        string;
  userId:    string;
  source:    string;
  amount:    number;
  date:      string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface ExpenseDoc {
  id:        string;
  userId:    string;
  name:      string;
  category:  ExpenseCategory;
  amount:    number;
  date:      string;
  createdAt: FirebaseFirestore.Timestamp;
}

export type ExpenseCategory =
  | "Food & Dining"
  | "Transportation"
  | "Bills & Utilities"
  | "Shopping"
  | "Entertainment"
  | "Savings"
  | "Investments";

export type IncomeResponse  = Omit<IncomeDoc,  "createdAt">;
export type ExpenseResponse = Omit<ExpenseDoc, "createdAt">;