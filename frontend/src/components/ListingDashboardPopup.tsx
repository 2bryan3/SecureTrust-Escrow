import React, { useState, useRef, useEffect } from "react";
import "../styles/ListingDashboard.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastPortal } from "./ToastPortal";
import { StripePaymentModal } from "./StripePaymentModal";
import type {
  TransactionData,
  Milestone1Data,
  Milestone2Data,
  Milestone3Data,
} from "../types/transaction.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ListingDashboardPopupProps {
  transaction: TransactionData;
  currentUserId: string;
  listingID: string;
  sellerID: string;
  onClose: () => void;
  onTransactionUpdate: (updated: TransactionData) => void;
  mockMode?: boolean;
  onRated?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = "/api/transactions";

async function patchTx(
  txId: string,
  path: string,
  body: Record<string, unknown>
): Promise<TransactionData> {
  const res = await fetch(`${API}/${txId}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!text) throw new Error("Server returned an empty response.");
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data.transaction as TransactionData;
}

const formatStatus = (status: string) => {
  if (status === "milestone1") return "Milestone 1";
  if (status === "milestone2") return "Milestone 2";
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

/** Mirrors backend route logic locally for mockMode. */
function applyMockAction(
  tx: TransactionData,
  path: string,
  body: Record<string, unknown>
): TransactionData {
  const next: TransactionData = JSON.parse(JSON.stringify(tx));
  const now = new Date().toISOString();

  if (path === "milestone1/seller") {
    next.milestone1.packageImageUrl   = body.packageImageUrl as string;
    next.milestone1.trackingNumber    = body.trackingNumber as string;
    next.milestone1.trackingCarrier   = (body.trackingCarrier as string) ?? null;
    next.milestone1.sellerSubmittedAt = now;
    const buyerDone = next.milestone1.buyerFundsDeposited;
    next.milestone1.status = buyerDone ? "completed" : "seller_submitted";
    if (buyerDone) { next.status = "milestone2"; next.milestone2.status = "awaiting_confirmation"; }
  }

  if (path === "milestone1/buyer") {
    next.milestone1.buyerFundsDeposited = true;
    next.milestone1.buyerDepositedAt    = now;
    next.milestone1.depositTxRef        = body.depositTxRef as string;
    next.escrowAmount                   = next.amount;
    const sellerDone = !!next.milestone1.sellerSubmittedAt;
    next.milestone1.status = sellerDone ? "completed" : "buyer_funded";
    if (sellerDone) { next.status = "milestone2"; next.milestone2.status = "awaiting_confirmation"; }
  }

  if (path === "milestone2/confirm") {
    next.milestone2.buyerConfirmed   = true;
    next.milestone2.buyerConfirmedAt = now;
    next.milestone2.buyerConfirmNote = (body.buyerConfirmNote as string) ?? null;
    next.milestone2.fundsReleasedAt  = now;
    next.milestone2.status           = "funds_released";
    next.escrowAmount                = 0;
    next.status                      = "completed";
  }

  return next;
}

// ─── Milestone 1 Panel ────────────────────────────────────────────────────────

interface M1PanelProps {
  txId: string;
  currentUserId: string;
  isBuyer: boolean;
  isSeller: boolean;
  m1: Milestone1Data;
  amount: number;
  currency: string;
  transaction: TransactionData;
  onUpdate: (tx: TransactionData) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  mockMode?: boolean;
}

const Milestone1Panel: React.FC<M1PanelProps> = ({
  txId, currentUserId, isBuyer, isSeller, m1, amount, currency, transaction, onUpdate, onToast, mockMode,
}) => {
  const [trackingNum, setTrackingNum]       = useState(m1.trackingNumber ?? "");
  const [carrier, setCarrier]               = useState(m1.trackingCarrier ?? "");
  const [imageUrl, setImageUrl]             = useState(m1.packageImageUrl ?? "");
  const [uploading, setUploading]           = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const sellerDone = !!m1.sellerSubmittedAt;
  const buyerDone  = m1.buyerFundsDeposited;

  const handleSellerSubmit = async () => {
    if (!imageUrl || !trackingNum) {
      onToast("Package image and tracking number are required.", "error");
      return;
    }
    setUploading(true);
    try {
      const body = { sellerId: currentUserId, packageImageUrl: imageUrl, trackingNumber: trackingNum, trackingCarrier: carrier || null };
      const updated = mockMode
        ? applyMockAction(transaction, "milestone1/seller", body)
        : await patchTx(txId, "milestone1/seller", body);
      onUpdate(updated);
      onToast("Shipping info submitted successfully!", "success");
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleMockDeposit = async () => {
    try {
      const body = { buyerId: currentUserId, depositTxRef: `sim_${Date.now()}` };
      const updated = applyMockAction(transaction, "milestone1/buyer", body);
      onUpdate(updated);
      onToast(`$${amount.toLocaleString()} deposited into escrow (mock).`, "success");
    } catch (e: any) {
      onToast(e.message, "error");
    }
  };

  return (
    <>
      {showStripeModal && (
        <StripePaymentModal
          transactionId={txId}
          buyerId={currentUserId}
          amount={amount}
          currency={currency}
          onSuccess={(updated) => {
            setShowStripeModal(false);
            onUpdate(updated);
            onToast(`$${amount.toLocaleString()} authorized in escrow.`, "success");
          }}
          onClose={() => setShowStripeModal(false)}
        />
      )}

      <div className="dashboard-section">
        <h3>Milestone 1 — Shipment &amp; Fund Deposit</h3>
        <p className="order-subtitle" style={{ marginBottom: "1rem" }}>
          Both parties must act before this milestone closes.
        </p>

        {/* Checklist */}
        <div className="milestone-card" style={{ marginBottom: "8px" }}>
          <span>{sellerDone ? "✅" : "📦"} Seller — Upload tracking number &amp; package photo</span>
          <span className={`status ${sellerDone ? "completed" : "pending"}`}>
            {sellerDone ? `${m1.trackingCarrier ?? "Carrier"}: ${m1.trackingNumber}` : "Pending"}
          </span>
        </div>
        <div className="milestone-card" style={{ marginBottom: "1rem" }}>
          <span>{buyerDone ? "✅" : "💳"} Buyer — Deposit ${amount.toLocaleString()} into escrow</span>
          <span className={`status ${buyerDone ? "completed" : "pending"}`}>
            {buyerDone ? "Funded" : "Pending"}
          </span>
        </div>

        {/* Seller action */}
        {isSeller && !sellerDone && (
          <div className="actions-section">
            <h3>⚠️ Your action required</h3>
            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Package photo</label>
            <div
              className="evidence-dropzone"
              onClick={() => { if (!imageUrl) fileInputRef.current?.click(); }}
              style={{ cursor: imageUrl ? "default" : "pointer" }}
            >
              {imageUrl ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={imageUrl}
                    alt="Package preview"
                    style={{ maxHeight: "120px", borderRadius: "8px" }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); setImageUrl(""); }}
                    style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "50%",
                      width: "18px", height: "18px", color: "var(--muted)",
                      fontSize: "0.7rem", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >×</button>
                </div>
              ) : (
                <>
                  <span className="evidence-icon">📷</span>
                  <span className="evidence-hint">Click to attach package photo</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setImageUrl(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />

            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Tracking number</label>
            <div className="cl-field" style={{ marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="1Z999AA10123456784"
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Carrier (optional)</label>
            <select
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box", marginBottom: "12px" }}
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="">Select carrier…</option>
              {["UPS", "FedEx", "USPS", "DHL", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button className="action-btn upload" onClick={handleSellerSubmit} disabled={uploading}>
              {uploading ? "Submitting…" : "Submit Shipping Info"}
            </button>
          </div>
        )}

        {/* Buyer action */}
        {isBuyer && !buyerDone && (
          <div className="actions-section">
            <h3>⚠️ Your action required</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "12px" }}>
              Deposit <strong>${amount.toLocaleString()}</strong> into escrow. Funds are held
              securely until you confirm delivery in Milestone 2.
            </p>
            {mockMode ? (
              <button className="action-btn add" onClick={handleMockDeposit}>
                Deposit ${amount.toLocaleString()} into Escrow (mock)
              </button>
            ) : (
              <button className="action-btn add" onClick={() => setShowStripeModal(true)}>
                Deposit ${amount.toLocaleString()} into Escrow
              </button>
            )}
          </div>
        )}

        {isSeller && sellerDone && !buyerDone && (
          <p className="dashboard-waiting">⏳ Waiting for the buyer to deposit funds…</p>
        )}
        {isBuyer && buyerDone && !sellerDone && (
          <p className="dashboard-waiting">⏳ Waiting for the seller to submit tracking info…</p>
        )}
      </div>
    </>
  );
};

// ─── Milestone 2 Panel ────────────────────────────────────────────────────────

interface M2PanelProps {
  txId: string;
  currentUserId: string;
  isBuyer: boolean;
  isSeller: boolean;
  m1: Milestone1Data;
  m2: Milestone2Data;
  amount: number;
  transaction: TransactionData;
  onUpdate: (tx: TransactionData) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  mockMode?: boolean;
}

const Milestone2Panel: React.FC<M2PanelProps> = ({
  txId, currentUserId, isBuyer, isSeller, m1, m2, amount, transaction, onUpdate, onToast, mockMode,
}) => {
  const [confirming, setConfirming] = useState(false);

  const isLocked   = m2.status === "locked";
  const isReleased = m2.status === "funds_released";

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const body = { buyerId: currentUserId };
      const updated = mockMode
        ? applyMockAction(transaction, "milestone2/confirm", body)
        : await patchTx(txId, "milestone2/confirm", body);
      onUpdate(updated);
      onToast("Receipt confirmed! Funds released to the seller.", "success");
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setConfirming(false);
    }
  };

  if (isLocked) {
    return (
      <div className="dashboard-section">
        <h3>Milestone 2 — Confirm Delivery &amp; Release Funds</h3>
        <p className="dashboard-waiting">🔒 Unlocks once Milestone 1 is complete.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h3>Milestone 2 — Confirm Delivery &amp; Release Funds</h3>

      {/* Shipping summary from M1 */}
      <div className="milestone-card" style={{ marginBottom: "1rem" }}>
        <span>📦 Shipped via <strong>{m1.trackingCarrier ?? "carrier"}</strong> · {m1.trackingNumber}</span>
        {m1.packageImageUrl && (
          <a href={m1.packageImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
            View photo ↗
          </a>
        )}
      </div>

      {isReleased ? (
        <div className="milestone-card completed">
          <span>🎉 Funds of ${amount.toLocaleString()} released to seller</span>
          <span className="status completed">
            {new Date(m2.fundsReleasedAt!).toLocaleDateString()}
          </span>
        </div>
      ) : (
        <>
          {isBuyer && (
            <div className="actions-section">
              <h3>⚠️ Did you receive what was agreed upon?</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "12px" }}>
                By confirming, you release <strong>${amount.toLocaleString()}</strong> to the seller.
                This cannot be undone.
              </p>
              <button className="action-btn release" onClick={handleConfirm} disabled={confirming}>
                {confirming ? "Processing…" : `✅ Confirm Receipt & Release $${amount.toLocaleString()}`}
              </button>
            </div>
          )}
          {isSeller && (
            <p className="dashboard-waiting">⏳ Waiting for buyer to confirm they received the order…</p>
          )}
        </>
      )}
    </div>
  );
};

// ─── Milestone 3 Panel ────────────────────────────────────────────────────────
interface M3PanelProps {
  txId: string;
  currentUserId: string;
  isBuyer: boolean;
  isSeller: boolean;
  m3: Milestone3Data;
  transaction: TransactionData;
  onUpdate: (tx: TransactionData) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}

const Milestone3Panel: React.FC<M3PanelProps> = ({
  txId, currentUserId, isBuyer, isSeller, m3, transaction, onUpdate, onToast,
}) => {
  const [returnImageUrl, setReturnImageUrl] = useState(m3.returnImageUrl ?? "");
  const [trackingNum, setTrackingNum]       = useState(m3.returnTrackingNumber ?? "");
  const [carrier, setCarrier]               = useState(m3.returnCarrier ?? "");
  const [submitting, setSubmitting]         = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const buyerShipped   = !!m3.buyerShippedAt;
  const sellerConfirmed = m3.sellerConfirmed;
  const refundIssued   = m3.status === "refund_issued";

  const handleBuyerSubmit = async () => {
    if (!returnImageUrl || !trackingNum) {
      onToast("Return image and tracking number are required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await patchTx(txId, "milestone3/buyer", {
        buyerId: currentUserId,
        returnImageUrl,
        returnTrackingNumber: trackingNum,
        returnCarrier: carrier || null,
      });
      onUpdate(updated);
      onToast("Return shipping info submitted!", "success");
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellerConfirm = async () => {
    setSubmitting(true);
    try {
      const updated = await patchTx(txId, "milestone3/seller", {
        sellerId: currentUserId,
      });
      onUpdate(updated);
      onToast("Return confirmed. Refund has been issued to the buyer.", "success");
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-section">
      <h3>Milestone 3 — Return Shipment</h3>
      <p className="order-subtitle" style={{ marginBottom: "1rem" }}>
        The mediator ruled in the buyer's favor. The buyer must return the item before the refund is issued.
      </p>

      {/* Checklist */}
      <div className="milestone-card" style={{ marginBottom: "8px" }}>
        <span>{buyerShipped ? "✅" : "📦"} Buyer — Ship item back with tracking</span>
        <span className={`status ${buyerShipped ? "completed" : "pending"}`}>
          {buyerShipped ? `${m3.returnCarrier ?? "Carrier"}: ${m3.returnTrackingNumber}` : "Pending"}
        </span>
      </div>
      <div className="milestone-card" style={{ marginBottom: "1rem" }}>
        <span>{sellerConfirmed ? "✅" : "📬"} Seller — Confirm return received</span>
        <span className={`status ${sellerConfirmed ? "completed" : "pending"}`}>
          {sellerConfirmed ? "Confirmed" : "Pending"}
        </span>
      </div>

      {refundIssued && (
        <div className="milestone-card completed">
          <span>🎉 Refund issued to buyer</span>
          <span className="status completed">
            {new Date(m3.refundIssuedAt!).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Buyer action — submit return shipping */}
      {isBuyer && !buyerShipped && (
        <div className="actions-section">
          <h3>⚠️ Your action required</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "12px" }}>
            Ship the item back to the seller and submit your tracking info below.
          </p>

          <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Return package photo</label>
          <div className="evidence-dropzone" onClick={() => { if (!returnImageUrl) fileInputRef.current?.click(); }} style={{ cursor: returnImageUrl ? "default" : "pointer" }}>
            {returnImageUrl ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={returnImageUrl} alt="Return package" style={{ maxHeight: "120px", borderRadius: "8px" }} />
                <button
                  onClick={e => { e.stopPropagation(); setReturnImageUrl(""); }}
                  style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "50%", width: "18px", height: "18px", color: "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >×</button>
              </div>
            ) : (
              <>
                <span className="evidence-icon">📷</span>
                <span className="evidence-hint">Click to attach return package photo</span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setReturnImageUrl(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />

          <label style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem", display: "block" }}>Return tracking number</label>
          <input
            type="text"
            placeholder="1Z999AA10123456784"
            value={trackingNum}
            onChange={e => setTrackingNum(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box", marginBottom: "8px" }}
          />

          <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Carrier (optional)</label>
          <select
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box", marginBottom: "12px" }}
            value={carrier}
            onChange={e => setCarrier(e.target.value)}
          >
            <option value="">Select carrier…</option>
            {["UPS", "FedEx", "USPS", "DHL", "Other"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button className="action-btn upload" onClick={handleBuyerSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Return Shipping Info"}
          </button>
        </div>
      )}

      {/* Seller action — confirm return received */}
      {isSeller && buyerShipped && !sellerConfirmed && (
        <div className="actions-section">
          <h3>⚠️ Did you receive the returned item?</h3>
          <div className="milestone-card" style={{ marginBottom: "12px" }}>
            <span>📦 Return shipped via <strong>{m3.returnCarrier ?? "carrier"}</strong> · {m3.returnTrackingNumber}</span>
            {m3.returnImageUrl && (
              <a href={m3.returnImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
                View photo ↗
              </a>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "12px" }}>
            By confirming, the buyer's refund will be issued immediately.
          </p>
          <button className="action-btn release" onClick={handleSellerConfirm} disabled={submitting}>
            {submitting ? "Processing…" : "✅ Confirm Return Received & Issue Refund"}
          </button>
        </div>
      )}

      {isBuyer && buyerShipped && !sellerConfirmed && (
        <p className="dashboard-waiting">⏳ Waiting for the seller to confirm they received the return…</p>
      )}
      {isSeller && !buyerShipped && (
        <p className="dashboard-waiting">⏳ Waiting for the buyer to ship the item back…</p>
      )}
    </div>
  );
};

// ─── Rating Panel ─────────────────────────────────────────────────────────────

interface RatingPanelProps {
  transactionId: string;
  isBuyer: boolean;
  onToast: (msg: string, type: "success" | "error") => void;
  onRated?: () => void;
}

const RatingPanel: React.FC<RatingPanelProps> = ({
  transactionId, isBuyer, onToast, onRated
}) => {
  const [hasRated, setHasRated]   = useState<boolean | null>(null);
  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [note, setNote]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/ratings/transaction/${transactionId}/mine`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setHasRated(d.hasRated))
      .catch(() => setHasRated(false));
  }, [transactionId]);

  const handleSubmit = async () => {
    if (rating === 0) { onToast("Please select a star rating.", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, rating, note: note || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setHasRated(true);
      onToast("Rating submitted!", "success");
      onRated?.();
    } catch (e: any) {
      onToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (hasRated === null) return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Loading…</p>;

  if (hasRated) return (
    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
      ✓ You've already submitted a rating for this transaction.
    </div>
  );

  const label = isBuyer ? "Rate the Seller" : "Rate the Buyer";

  return (
    <div className="actions-section">
      <h3 style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: "0 0 0.75rem" }}>
        {label}
      </h3>

      {/* Stars */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.75rem" }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.6rem",
              color: star <= (hover || rating) ? "var(--gold)" : "var(--border)",
              transition: "color 0.1s",
              padding: 0,
            }}
          >
            ★
          </button>
        ))}
      </div>

      <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Optional note</label>
      <textarea
        className="escalation-reason"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={isBuyer ? "Great seller, shipped quickly!" : "Reliable buyer, smooth transaction!"}
        rows={3}
      />
      <button className="action-btn add" onClick={handleSubmit} disabled={submitting || rating === 0}>
        {submitting ? "Submitting…" : "Submit Rating"}
      </button>
    </div>
  );
};

// ─── Main popup ───────────────────────────────────────────────────────────────

export const ListingDashboardPopup: React.FC<ListingDashboardPopupProps> = ({
  transaction,
  currentUserId,
  onClose,
  onTransactionUpdate,
  mockMode = false,
  onRated,
}) => {
  const { _id, milestone1, milestone2, amount, escrowAmount, status } = transaction;

  const listingTitle = typeof transaction.listingId === "object"
    ? transaction.listingId.title
    : "Transaction";

  const buyerId  = typeof transaction.buyerId  === "object" ? transaction.buyerId._id  : transaction.buyerId;
  const sellerId = typeof transaction.sellerId === "object" ? transaction.sellerId._id : transaction.sellerId;

  const isBuyer  = buyerId  === currentUserId;
  const isSeller = sellerId === currentUserId;

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const m1Complete = milestone1.status === "completed";
  const isComplete = status === "completed";
  const isRefunded = status === "refunded";
  const isM3 = status === "milestone3";

  // Which milestone panel is visible — defaults to active one
  const defaultView = status === "milestone2" || isComplete ? 2 : isM3 || isRefunded ? 3 : 1;
  const [viewingMilestone, setViewingMilestone] = React.useState<1 | 2 | 3>(defaultView as 1 | 2 | 3);

  const navigate = useNavigate();
  const [isEscalated, setIsEscalated] = useState(false);

  React.useEffect(() => {
    if (status === "milestone2" || isComplete) setViewingMilestone(2);
    if (isM3 || isRefunded) setViewingMilestone(3);
  }, [status, isComplete, isM3, isRefunded]);

  useEffect(() => {
    axios.get(`/api/disputes/transaction/${transaction._id}`, { withCredentials: true })
      .then(res => { if (res.data.dispute) setIsEscalated(true); })
      .catch(() => {});
  }, [transaction._id]);


  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />
      <div className="listing-dashboard-overlay" onClick={onClose}>
        <div className="listing-dashboard-popup" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h2>{listingTitle}</h2>
              <p className="order-subtitle">Escrow Transaction Management</p>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>

          {/* Escrow summary strip */}
          <div className="funds-row" style={{ marginBottom: "1rem" }}>
            <div className="funds-left">
              <div className="funds-amount">${amount.toLocaleString()}</div>
              <div className="funds-status">Total Agreed</div>
            </div>
            <div className="funds-right">
              <div className="funds-amount">${escrowAmount.toLocaleString()}</div>
              <div className="funds-status">Held in Escrow</div>
            </div>
            <div className="funds-right">
              <div className="funds-meta-label">Status</div>
              <div className="funds-meta-value">{formatStatus(status)}</div>
            </div>
          </div>

          {/* Progress stepper */}
          <div className="order-progress">
            <div
              className={`progress-step ${m1Complete || isComplete ? "completed" : status === "milestone1" ? "active" : "pending"} ${viewingMilestone === 1 ? "viewing" : ""}`}
              onClick={m1Complete || isComplete ? () => setViewingMilestone(1) : undefined}
              style={{ cursor: m1Complete || isComplete ? "pointer" : "default" }}
            >
              <div className="circle">{m1Complete || isComplete ? "✓" : "1"}</div>
              <span>Shipment &amp; Deposit</span>
            </div>
            <div className={`progress-connector ${m1Complete ? "completed" : ""}`} />
            <div
              className={`progress-step ${isComplete ? "completed" : status === "milestone2" ? "active" : "pending"} ${viewingMilestone === 2 ? "viewing" : ""}`}
              onClick={status !== "milestone1" ? () => setViewingMilestone(2) : undefined}
              style={{ cursor: status !== "milestone1" ? "pointer" : "default" }}
            >
              <div className="circle">{isComplete ? "✓" : "2"}</div>
              <span>Confirm &amp; Release</span>
            </div>
            {(isM3 || isRefunded || transaction.milestone3?.status !== "locked") && (
              <>
                <div className={`progress-connector ${isM3 || isRefunded ? "completed" : ""}`} />
                <div
                  className={`progress-step ${isRefunded ? "completed" : isM3 ? "active" : "pending"} ${viewingMilestone === 3 ? "viewing" : ""}`}
                  onClick={isM3 || isRefunded ? () => setViewingMilestone(3) : undefined}
                  style={{ cursor: isM3 || isRefunded ? "pointer" : "default" }}
                >
                  <div className="circle">{isRefunded ? "✓" : "3"}</div>
                  <span>Return &amp; Refund</span>
                </div>
              </>
            )}
          </div>

          {/* Disputed banner */}
          {status === "disputed" && (
            <div style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: "var(--text)",
              marginBottom: "1rem",
            }}>
              ⚖️ <strong>This transaction is under mediator review.</strong> Milestone actions are paused until a ruling is made.
            </div>
          )}

          {/* Milestone panels */}
          {viewingMilestone === 3 ? (
            <Milestone3Panel
              txId={_id}
              currentUserId={currentUserId}
              isBuyer={isBuyer}
              isSeller={isSeller}
              m3={transaction.milestone3}
              transaction={transaction}
              onUpdate={onTransactionUpdate}
              onToast={showToast}
            />
          ) : isComplete && viewingMilestone === 2 ? (
            <div className="dashboard-section">
              <h3>🎉 Transaction Complete</h3>
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                Funds have been released. Thank you for using SecureTrust!
              </p>
              <RatingPanel
                transactionId={_id}
                isBuyer={isBuyer}
                onToast={showToast}
                onRated={onRated}
              />
            </div>
          ) : viewingMilestone === 1 ? (
            <Milestone1Panel
              txId={_id}
              currentUserId={currentUserId}
              isBuyer={isBuyer}
              isSeller={isSeller}
              m1={milestone1}
              amount={amount}
              currency={transaction.currency}
              transaction={transaction}
              onUpdate={onTransactionUpdate}
              onToast={showToast}
              mockMode={mockMode}
            />
          ) : (
            <>
              {m1Complete && (
                <div
                  className="milestone-card completed"
                  style={{ cursor: "pointer", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setViewingMilestone(1)}
                >
                  <span>✓ Milestone 1 Complete · {milestone1.trackingCarrier} · {milestone1.trackingNumber}</span>
                  <span className="status completed">← View details</span>
                </div>
              )}
              <Milestone2Panel
                txId={_id}
                currentUserId={currentUserId}
                isBuyer={isBuyer}
                isSeller={isSeller}
                m1={milestone1}
                m2={milestone2}
                amount={amount}
                transaction={transaction}
                onUpdate={onTransactionUpdate}
                onToast={showToast}
                mockMode={mockMode}
              />
            </>
          )}

          {/* Role footer */}
          <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem", justifyContent: "center" }}>
            {isBuyer  && <span className="status pending" style={{ fontSize: "0.75rem" }}>You are the Buyer</span>}
            {isSeller && <span className="status completed" style={{ fontSize: "0.75rem" }}>You are the Seller</span>}
          </div>

          {/* Dispute section */}
            {!isComplete && milestone1.buyerFundsDeposited && !isM3 && !isRefunded &&(
              <div className="dashboard-section">
                <h3>Dispute</h3>
                {isEscalated ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.85rem",
                      color: "var(--text)",
                    }}
                  >
                    <span>⚖️</span>
                    <span>
                      <strong>Escalated to Mediator.</strong> A mediator is reviewing this
                      transaction. You will be notified of their decision.
                    </span>
                  </div>
                ) : (
                  <button
                    className="action-btn escalate"
                    onClick={() => navigate(`/escalate/${transaction._id}`)}
                  >
                    Escalate to Mediator
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </>
  );
};