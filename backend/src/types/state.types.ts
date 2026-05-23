

export interface Transaction {
  id:          string;
  date:        string;
  category:    string;
  description: string;
  amount:      number;
  status?:     "completed" | "cancelled" | "refunded";
  reason?:     string;
}

export interface FinancingAccount {
  id:             string;
  type:           string;
  nextPayment:    number;
  originalAmount: number;
  remaining:      number;
}

export interface LockedVault {
  id:     string;
  name:   string;
  amount: number;
  type:   string;
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

export interface AccountsState {
  totalBalance:             number;
  discretionaryBudget:      number;
  discretionaryBudgetTotal: number;
  fixedExpenses:            number;
  userName:                 string;
  accountNo:                string;
  financingAccounts:        FinancingAccount[];
  transactions:             Transaction[];
  elderlyMode:              boolean;
  elderlyLimit:             number;
  caregiverName:            string;
  caregiverPhone:           string;
  isCaregiverApproved:      boolean;
  lockedVaults:             LockedVault[];
  autoDebits:               AutoDebit[];  
}