import { z } from "zod";

export const IncomeSchema = z.object({
  source: z.string().min(1).max(100),
  amount: z.number().positive("Amount must be positive"),
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  userId: z.string().optional().default("default_user"),
});

export const ExpenseSchema = z.object({
  name:     z.string().min(1).max(100),
  category: z.enum([
    "Food & Dining",
    "Transportation",
    "Bills & Utilities",
    "Shopping",
    "Entertainment",
    "Savings",
    "Investments",
  ]),
  amount: z.number().positive("Amount must be positive"),
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  userId: z.string().optional().default("default_user"),
});

export const PredictSchema = z.object({
  userId:              z.string().min(1).default("default_user"),
  itemName:            z.string().min(1).max(100),
  category:            z.string().min(1),
  amount:              z.number().positive("Amount must be positive"),
  impulseSignal:       z.boolean(),
  currentBalance:      z.number(),
  discretionaryBudget: z.number().nonnegative(),
});

export type IncomeInput  = z.infer<typeof IncomeSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type PredictInput = z.infer<typeof PredictSchema>;