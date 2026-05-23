import { Router } from "express";
import { listWishlist, createWishlistItem, patchWishlistStatus, removeWishlistItem } from "./wishlist.controller";

const router = Router();

router.get("/",             listWishlist);
router.post("/",            createWishlistItem);
router.patch("/:id/status", patchWishlistStatus);
router.delete("/:id",       removeWishlistItem);

export default router;
