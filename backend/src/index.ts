import dotenv from "dotenv";
import { startServer } from "./app";

dotenv.config();

startServer().catch((error) => {
	console.error("Server startup failed:", error);
	process.exit(1);
});
