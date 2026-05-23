import { Response } from "express";

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function fail(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ success: false, error: message });
}

export function serverError(res: Response, err: unknown): void {
  const message = err instanceof Error ? err.message : "An unexpected error occurred";
  console.error("[SERVER ERROR]", err);
  res.status(500).json({ success: false, error: message });
}