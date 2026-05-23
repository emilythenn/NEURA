import dotenv from "dotenv";
dotenv.config();

import { initFirebase } from "./config/firebase";
import { createApp } from "./app";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  initFirebase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║   NEURA Cognitive Banking Backend                    ║
║   🚀  http://localhost:${env.PORT}                        ║
║   🌍  ${env.NODE_ENV}                                     ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});