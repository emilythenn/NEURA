import { v4 as uuidv4 } from "uuid";
import { getDb, now } from "../../config/firebase";
import { WishlistDoc, WishlistItemResponse, WishlistStatus } from "./wishlist.model";

const COL = "wishlist";

function toResponse(doc: WishlistDoc): WishlistItemResponse {
  const { createdAt, ...rest } = doc;
  return { ...rest, createdAt: createdAt.toMillis() };
}

export async function addToWishlist(
  userId: string,
  item: { itemName: string; amount: number; category: string; riskScore: number; explanation: string }
): Promise<WishlistItemResponse> {
  const id = uuidv4();
  const ts = now();
  const doc: WishlistDoc = {
    id, userId,
    itemName:    item.itemName,
    amount:      item.amount,
    category:    item.category,
    riskScore:   item.riskScore,
    explanation: item.explanation,
    status:      "delayed",
    createdAt:   ts,
  };
  await getDb().collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: ts.toMillis() };
}

export async function getWishlist(userId: string): Promise<WishlistItemResponse[]> {
  const snap = await getDb()
    .collection(COL)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map(d => toResponse(d.data() as WishlistDoc))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateWishlistStatus(
  id: string, status: WishlistStatus
): Promise<WishlistItemResponse> {
  const ref  = getDb().collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Wishlist item ${id} not found`);
  await ref.update({ status });
  return toResponse({ ...(snap.data() as WishlistDoc), status });
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const ref = getDb().collection(COL).doc(id);
  if (!(await ref.get()).exists) throw new Error(`Wishlist item ${id} not found`);
  await ref.delete();
}
