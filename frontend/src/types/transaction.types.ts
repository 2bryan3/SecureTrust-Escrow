// shared/types/transaction.types.ts
// These types mirror the Transaction Mongoose schema and are safe to import
// on both the frontend (as read-only shape) and backend.

export type TransactionStatus =
  | "initiated"
  | "milestone1"
  | "milestone2"
  | "milestone3"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type Milestone1Status =
  | "pending"
  | "seller_submitted"
  | "buyer_funded"
  | "completed";

export type Milestone2Status =
  | "locked"
  | "awaiting_confirmation"
  | "confirmed"
  | "funds_released";

export type Milestone3Status =
  | "locked"
  | "awaiting_return"
  | "buyer_shipped"
  | "seller_confirmed"
  | "refund_issued";

export interface Milestone1Data {
  // Seller side
  packageImageUrl:   string | null;
  trackingNumber:    string | null;
  trackingCarrier:   string | null;
  sellerSubmittedAt: string | null; // ISO date string from API
  // Buyer side
  buyerFundsDeposited: boolean;
  buyerDepositedAt:    string | null;
  depositTxRef:        string | null;
  // Status
  status: Milestone1Status;
}

export interface Milestone2Data {
  buyerConfirmed:    boolean;
  buyerConfirmedAt:  string | null;
  buyerConfirmNote:  string | null;
  fundsReleasedAt:   string | null;
  releaseTxRef:      string | null;
  status:            Milestone2Status;
}

export interface Milestone3Data {
  // Buyer ships item back
  returnImageUrl:     string | null;
  returnTrackingNumber: string | null;
  returnCarrier:      string | null;
  buyerShippedAt:     string | null;
  // Seller confirms receipt
  sellerConfirmed:    boolean;
  sellerConfirmedAt:  string | null;
  // Refund record
  refundIssuedAt:     string | null;
  refundTxRef:        string | null;
  status:             Milestone3Status;
}


export interface TransactionData {
  _id:          string;
  buyerId:      string | PopulatedUser;
  sellerId:     string | PopulatedUser;
  listingId:    string | PopulatedListing;
  amount:       number;
  escrowAmount: number;
  currency:     string;
  milestone1:   Milestone1Data;
  milestone2:   Milestone2Data;
  milestone3:   Milestone3Data;
  status:       TransactionStatus;
  initiatedBy:  "buyer" | "seller";
  terms:        string | null;
  cancelledAt:  string | null;
  cancelledBy:  "buyer" | "seller" | "admin" | null;
  createdAt:    string;
  updatedAt:    string;
}

// Populated sub-types returned by GET /transactions/:id
export interface PopulatedUser {
  _id:       string;
  firstName: string;
  lastName:  string;
  email:     string;
  avatar:    string;
}

export interface PopulatedListing {
  _id:    string;
  title:  string;
  images: string[];
  price:  number;
}