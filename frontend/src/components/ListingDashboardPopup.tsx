import React, { useState, useRef, useEffect } from "react";
import "../styles/ListingDashboard.css";
import axios from "axios";
import { ToastPortal } from "./ToastPortal";
import { StripePaymentModal } from "./StripePaymentModal";
import type {
  TransactionData,
  Milestone1Data,
  Milestone2Data,
} from "../types/transaction.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ListingDashboardPopupProps {
  transaction: TransactionData;
  currentUserId: string;
  listingID: string;
  sellerID: string;
  onClose: () => void;
  onTransactionUpdate: (updated: TransactionData) => void;
  /** Pass true when running without a real backend — actions update state locally. */
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
            <div className="evidence-dropzone" onClick={() => fileInputRef.current?.click()}>
              {imageUrl
                ? <img src={imageUrl} alt="Package preview" style={{ maxHeight: "120px", borderRadius: "8px" }} />
                : <><span className="evidence-icon">📷</span><span className="evidence-hint">Click to attach package photo</span></>
              }
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageUrl(URL.createObjectURL(file));
              }}
            />

            <label style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem", display: "block" }}>
              Or paste image URL
            </label>
            <input
              className="escalation-reason"
              style={{ padding: "8px 12px", marginBottom: "8px" }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
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
  listingID,
  sellerID,
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

  const [escalationReason, setEscalationReason] = useState("");
  const [showEscalate, setShowEscalate]         = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const m1Complete = milestone1.status === "completed";
  const isComplete = status === "completed";

  // Which milestone panel is visible — defaults to active one
  const defaultView = status === "milestone2" || isComplete ? 2 : 1;
  const [viewingMilestone, setViewingMilestone] = React.useState<1 | 2>(defaultView as 1 | 2);

  React.useEffect(() => {
    if (status === "milestone2" || isComplete) setViewingMilestone(2);
  }, [status, isComplete]);

  const handleEscalate = async () => {
    if (!escalationReason.trim()) return;
    try {
      await axios.post("/api/disputes/create", {
        listingID,
        sellerID,
        reason: escalationReason,
      }, { withCredentials: true });
      showToast("Dispute submitted. A mediator will review your case.", "success");
      setShowEscalate(false);
      setEscalationReason("");
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Failed to submit dispute.", "error");
    }
  };

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
          </div>

          {/* Milestone panels */}
          {isComplete && viewingMilestone === 2 ? (
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
              {/* Collapsed M1 summary */}
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
          {!isComplete && (
            <div className="dashboard-section">
              <h3>Dispute</h3>
              {!showEscalate ? (
                <button className="action-btn escalate" onClick={() => setShowEscalate(true)}>
                  Escalate to Mediator
                </button>
              ) : (
                <>
                  <textarea
                    className="escalation-reason"
                    placeholder="Describe the issue..."
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button className="action-btn escalate" onClick={handleEscalate}>Submit Dispute</button>
                    <button className="action-btn" onClick={() => setShowEscalate(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};