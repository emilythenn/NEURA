import dotenv from "dotenv";
import { startServer } from "./app";

// Load environment variables
dotenv.config();

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
