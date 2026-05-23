import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: { uid: string; email?: string };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (env.NODE_ENV !== "production") {
    (req as AuthRequest).user = { uid: "dev_user", email: "dev@example.com" };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing Bearer token" });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split(" ")[1]);
    (req as AuthRequest).user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}