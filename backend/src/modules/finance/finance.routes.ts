import { Router, Request, Response, NextFunction } from "express";
import { summary, spendingPattern } from "./finance.controller";

const router = Router();

router.get("/summary/:userId", summary);
router.get("/summary", (req: Request, res: Response, next: NextFunction) => {
  (req.params as Record<string, string>).userId = "default_user";
  summary(req, res, next);
});
router.post("/pattern", spendingPattern);

export default router;