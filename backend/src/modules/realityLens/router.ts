import express from "express";
import { delayLock, saveDifference, scanRealityLens } from "./service";
import type { RealityLensState } from "./types";

interface RealityLensRouterConfig {
  getState: () => RealityLensState;
}

export function createRealityLensRouter(config: RealityLensRouterConfig) {
  const router = express.Router();

  router.post("/reality-lens/scan", async (req, res) => {
    try {
      const state = config.getState();
      const data = await scanRealityLens(req.body || {}, state);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: "Reality Lens scan failed", details: error?.message });
    }
  });

  router.post("/reality-lens/save-difference", (req, res) => {
    const amount = Number(req.body?.amount || 0);
    const result = saveDifference(config.getState(), amount);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  router.post("/reality-lens/delay-lock", (req, res) => {
    const amount = Number(req.body?.amount || 0);
    const result = delayLock(config.getState(), amount);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Compatibility aliases for existing frontend calls.
  router.post("/scan-reality-lens", async (req, res) => {
    try {
      const state = config.getState();
      const data = await scanRealityLens(req.body || {}, state);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: "Reality Lens scan failed", details: error?.message });
    }
  });

  router.post("/save-difference", (req, res) => {
    const amount = Number(req.body?.amount || 0);
    const result = saveDifference(config.getState(), amount);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  router.post("/delay-lock", (req, res) => {
    const amount = Number(req.body?.amount || 0);
    const result = delayLock(config.getState(), amount);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  return router;
}