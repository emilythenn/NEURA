import { Router } from "express";
import * as ctrl from "./tracker.controller";

const router = Router();

router.get("/incomes",        ctrl.listIncomes);
router.post("/incomes",       ctrl.addIncome);
router.delete("/incomes/:id", ctrl.removeIncome);

router.get("/expenses",        ctrl.listExpenses);
router.post("/expenses",       ctrl.addExpense);
router.delete("/expenses/:id", ctrl.removeExpense);

export default router;