import { Router } from "express";
import {
  getState, toggleElderly, resetState, delayLock, completeTransfer,
  createAutoDebit, pauseResumeAutoDebit, removeAutoDebit,
} from "./state.controller";

const router = Router();

// Account state
router.get("/state",              getState);
router.post("/toggle-elderly",    toggleElderly);
router.post("/reset-state",       resetState);
router.post("/delay-lock",        delayLock);
router.post("/complete-transfer", completeTransfer);

// AutoDebits
router.post("/auto-debits",            createAutoDebit);
router.patch("/auto-debits/:id/toggle", pauseResumeAutoDebit);
router.delete("/auto-debits/:id",       removeAutoDebit);

export default router;