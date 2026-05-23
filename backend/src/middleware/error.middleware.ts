import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    const status =
      err.message.includes("not found")    ? 404 :
      err.message.includes("unauthorized") ? 401 : 500;
    res.status(status).json({ success: false, error: err.message });
    return;
  }

  res.status(500).json({ success: false, error: "Unexpected error" });
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: "Route not found" });
}