import { Router } from "express";
import { intentHandler } from "./chatbot.controller";

const router = Router();

router.post("/intent", intentHandler);

export default router;
