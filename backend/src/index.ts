import dotenv from "dotenv";
import { startServer } from "./app";

// Load environment variables
dotenv.config();

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
