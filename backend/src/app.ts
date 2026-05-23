import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import trackerRoutes  from "./modules/predictionAnalysis/tracker/tracker.routes";
import financeRoutes  from "./modules/predictionAnalysis/finance/finance.routes";
import { purchaseRouter, historyRouter } from "./modules/predictionAnalysis/prediction/predict.routes";
import stateRoutes    from "./modules/predictionAnalysis/state/state.routes";
import wishlistRoutes from "./modules/predictionAnalysis/wishlist/wishlist.routes";
import chatbotRoutes  from "./modules/predictionAnalysis/chatbot/chatbot.routes";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "neura-backend", timestamp: new Date().toISOString() });
  });

  // Tracker — GET/POST/DELETE incomes & expenses
  app.use("/api/tracker", trackerRoutes);

  // Finance summary
  app.use("/api/finance", financeRoutes);

  // Predict purchase — POST /api/predict-purchase
  app.use("/api/predict-purchase", purchaseRouter);

  // Predict history — GET/POST/DELETE /api/predict-history
  app.use("/api/predict-history", historyRouter);

  // State — /api/state, /api/toggle-elderly, /api/reset-state,
  //         /api/delay-lock, /api/complete-transfer,
  //         /api/auto-debits
  app.use("/api", stateRoutes);

  // Wishlist Vault — GET/POST/PATCH/DELETE /api/wishlist
  app.use("/api/wishlist", wishlistRoutes);

  // Chatbot intent router — POST /api/chatbot/intent
  app.use("/api/chatbot", chatbotRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}