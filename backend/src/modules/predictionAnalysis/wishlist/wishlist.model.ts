export type WishlistStatus = "delayed" | "bought" | "removed";

export interface WishlistDoc {
  id:          string;
  userId:      string;
  itemName:    string;
  amount:      number;
  category:    string;
  riskScore:   number;
  explanation: string;
  status:      WishlistStatus;
  createdAt:   FirebaseFirestore.Timestamp;
}

export type WishlistItemResponse = Omit<WishlistDoc, "createdAt"> & { createdAt: number };
