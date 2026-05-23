import { Request, Response, NextFunction } from "express";
import { addToWishlist, getWishlist, updateWishlistStatus, deleteWishlistItem } from "./wishlist.service";
import { ok, fail } from "../../../utils/response";
import { WishlistStatus } from "./wishlist.model";

const DEFAULT_USER = "default_user";

export async function listWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req.query.userId as string) ?? DEFAULT_USER;
    ok(res, await getWishlist(userId));
  } catch (e) { next(e); }
}

export async function createWishlistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, itemName, amount, category, riskScore, explanation } = req.body as Record<string, unknown>;
    if (!itemName || amount === undefined || !category) {
      fail(res, "itemName, amount, and category are required");
      return;
    }
    const item = await addToWishlist(
      typeof userId === "string" ? userId : DEFAULT_USER,
      {
        itemName:    String(itemName),
        amount:      Number(amount),
        category:    String(category),
        riskScore:   Number(riskScore) || 0,
        explanation: typeof explanation === "string" ? explanation : "",
      }
    );
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function patchWishlistStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body as { status: WishlistStatus };
    if (!["delayed", "bought", "removed"].includes(status)) {
      fail(res, "status must be delayed | bought | removed");
      return;
    }
    ok(res, await updateWishlistStatus(req.params.id, status));
  } catch (e) { next(e); }
}

export async function removeWishlistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteWishlistItem(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { next(e); }
}
