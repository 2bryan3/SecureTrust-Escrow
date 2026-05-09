// src/pages/MediatorPage.tsx
import React, { useState, useEffect } from "react";
import "../styles/MediatorPage.css";
import axios from "axios";

type DisputeStatus = "Pending" | "Under Review" | "Resolved" | "Refunded" | "Dismissed";

interface DisputeUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DisputeListing {
  _id: string;
  title: string;
  price: number;
}

interface Milestone1 {
  packageImageUrl: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  sellerSubmittedAt: string | null;
  buyerFundsDeposited: boolean;
  buyerDepositedAt: string | null;
  status: string;
}

interface Milestone2 {
  buyerConfirmed: boolean;
  buyerConfirmedAt: string | null;
  fundsReleasedAt: string | null;
  status: string;
}

interface DisputeTransaction {
  _id: string;
  amount: number;
  escrowAmount: number;
  status: string;
  currency: string;
  milestone1: Milestone1;
  milestone2: Milestone2;
  listingId: { deliveryMethod: string } | null;
}

interface Dispute {
  _id: string;
  listingID: DisputeListing;
  buyerID: DisputeUser;
  sellerID: DisputeUser;
  reportedBy: DisputeUser;
  reason: string;
  escalationMessage: string | null;
  evidence: string[];
  decisionNotes: string | null;
  status: DisputeStatus;
  createdAt: string;
  transactionId: DisputeTransaction | null;
}

type ActionType = "release" | "refund" | null;

const STATUS_FILTERS: ("All" | DisputeStatus)[] = [
  "All", "Pending", "Under Review", "Resolved", "Refunded", "Dismissed",
];

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export const MediatorPage: React.FC = () => {
  const [disputes, setDisputes]     = useState<Dispute[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"All" | DisputeStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    disputeId: string;
    type: ActionType;
  } | null>(null);
  const [notes, setNotes]         = useState("");
  const [notesError, setNotesError] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/disputes", { withCredentials: true })
      .then(res => setDisputes(res.data.disputes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All"
    ? disputes
    : disputes.filter(d => d.status === filter);

  const handleAction = (disputeId: string, type: ActionType) => {
    setConfirmAction({ disputeId, type });
    setNotes("");
    setNotesError(false);
  };

  const handleConfirm = async () => {
    if (notes.trim().length < 10) { setNotesError(true); return; }
    if (!confirmAction) return;
    const { disputeId, type } = confirmAction;
    const newStatus = type === "release" ? "Resolved" : "Refunded";

    try {
      await axios.post(
        `/api/disputes/update/${disputeId}`,
        { status: newStatus, decisionNotes: notes.trim() },
        { withCredentials: true }
      );
      setDisputes(prev =>
        prev.map(d => d._id === disputeId ? { ...d, status: newStatus } : d)
      );
    } catch (err) {
      console.error(err);
    }
    setConfirmAction(null);
    setNotes("");
  };

  const statusClass = (status: DisputeStatus) =>
    status.toLowerCase().replace(" ", "-");

  const fullName = (user: DisputeUser) =>
    `${user.firstName} ${user.lastName}`.trim() || user.email;

  if (loading) return <p className="mediator-empty">Loading disputes…</p>;

  return (
    <div className="mediator-page">

      <div className="mediator-header">
        <div>
          <h1 className="mediator-title">Mediator Dashboard</h1>
          <p className="mediator-subtitle">
            {disputes.filter(d => d.status === "Pending" || d.status === "Under Review").length} active cases
          </p>
        </div>
        <div className="mediator-filters">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`filter-chip ${filter === s ? "filter-chip--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mediator-cases">
        {filtered.length === 0 && (
          <p className="mediator-empty">No cases match this filter.</p>
        )}

        {filtered.map(d => {
          const isExpanded = expandedId === d._id;
          const isResolved = d.status === "Resolved" || d.status === "Refunded" || d.status === "Dismissed";
          const tx = d.transactionId;
          const isFiledByBuyer = d.reportedBy._id === d.buyerID._id;
          const daysOpen = Math.floor(
            (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div key={d._id} className={`case-card ${isResolved ? "case-card--resolved" : ""}`}>
              <div
                className="case-header"
                onClick={() => setExpandedId(isExpanded ? null : d._id)}
                style={{ cursor: "pointer" }}
              >
                <div className="case-header-left">
                  <h2>{d.listingID?.title ?? "Unknown Listing"}</h2>
                  <div className="case-parties">
                    <span className="party-label">Buyer</span>
                    <span className="party-name">{fullName(d.buyerID)}</span>
                    <span className="party-divider">vs</span>
                    <span className="party-label">Seller</span>
                    <span className="party-name">{fullName(d.sellerID)}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem" }}>
                    {new Date(d.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                    {" · "}
                    <strong style={{ color: isFiledByBuyer ? "var(--accent)" : "var(--gold)" }}>
                      Filed by {isFiledByBuyer ? "Buyer" : "Seller"}
                    </strong>
                    {" · "}
                    {isResolved
                      ? <span style={{ color: "var(--muted)" }}>Closed</span>
                      : daysOpen === 0 ? "Opened today" : `${daysOpen}d open`
                    }
                  </div>
                </div>
                <div className="case-header-right">
                  <span className={`case-status ${statusClass(d.status)}`}>{d.status}</span>
                  <span className="case-amount">${d.listingID?.price?.toLocaleString() ?? "—"}</span>
                  <span className="case-chevron">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="case-body">
                  <hr className="case-divider" />

                  {/* ── Escalation message ───────────────────────────────────────── */}
                  {d.escalationMessage && (
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: "0.6rem" }}>
                        Escalation Message
                      </h4>
                      <div className="mediator-escalation-msg">
                        <span className="mediator-escalation-author">
                          {fullName(d.reportedBy)} · {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <p>{d.escalationMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Evidence ─────────────────────────────────────────────────── */}
                  {d.evidence && d.evidence.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: "0.6rem" }}>
                        Evidence ({d.evidence.length} file{d.evidence.length !== 1 ? "s" : ""})
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {d.evidence.map((url, i) => {
                          const isImage = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.startsWith("data:image/");
                          return isImage ? (
                            <img
                              key={i}
                              src={url}
                              alt={`Evidence ${i + 1}`}
                              className="mediator-evidence-thumb"
                              onClick={() => setPreview(url)}
                            />
                          ) : (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              background: "var(--surface, var(--bg))",
                              border: "1px solid var(--border)",
                              borderRadius: "8px", padding: "0.4rem 0.75rem",
                              fontSize: "0.8rem", color: "var(--text)",
                            }}>
                              📄 <span>{url.split("/").pop() ?? `File ${i + 1}`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Transaction context ───────────────────────────────────────── */}
                  {tx && (
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: "0.6rem" }}>
                        Transaction Context
                      </h4>

                      {/* Package photo inline */}
                      {tx.milestone1.packageImageUrl && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <img
                            src={tx.milestone1.packageImageUrl}
                            alt="Package"
                            style={{ maxHeight: "160px", borderRadius: "10px", border: "1px solid var(--border)", cursor: "pointer" }}
                            onClick={() => setPreview(tx.milestone1.packageImageUrl!)}
                          />
                        </div>
                      )}
                      <div className="mediator-tx-grid">
                        <div className="mediator-tx-item">
                          <span className="mediator-tx-label">Amount</span>
                          <span className="mediator-tx-value">${tx.amount.toLocaleString()}</span>
                        </div>
                        <div className="mediator-tx-item">
                          <span className="mediator-tx-label">Disputed At</span>
                          <span className="mediator-tx-value">
                            {tx.milestone2.status === "locked" ? "Milestone 1" : "Milestone 2"}
                          </span>
                        </div>
                        <div className="mediator-tx-item">
                          <span className="mediator-tx-label">
                            {(tx as any).listingId?.deliveryMethod === "local_pickup" ? "Delivery" : "Tracking"}
                          </span>
                          <span className="mediator-tx-value" style={{ fontSize: "0.78rem" }}>
                            {(tx as any).listingId?.deliveryMethod === "local_pickup"
                              ? "Local Pickup"
                              : tx.milestone1.trackingNumber
                                ? `${tx.milestone1.trackingCarrier ?? ""} ${tx.milestone1.trackingNumber}`.trim()
                                : "Not submitted"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Decision notes if already ruled ──────────────────────────── */}
                  {isResolved && d.decisionNotes && (
                    <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: "10px" }}>
                      <h4 style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: "0.4rem" }}>
                        Mediator Decision Notes
                      </h4>
                      <p style={{ fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                        {d.decisionNotes}
                      </p>
                    </div>
                  )}

                  {/* ── Actions ──────────────────────────────────────────────────── */}
                  {!isResolved && (
                    <div className="case-actions">
                      <button className="release-btn" onClick={() => handleAction(d._id, "release")}>
                        ✓ Release Funds to Seller
                      </button>
                      <button className="refund-btn" onClick={() => handleAction(d._id, "refund")}>
                        ↩ Refund Buyer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Confirm ruling modal ─────────────────────────────────────────── */}
      {confirmAction && (
        <div className="preview-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-header">
              <h3>
                {confirmAction.type === "release"
                  ? "✓ Release Funds to Seller"
                  : "↩ Refund Buyer"}
              </h3>
              <button className="close-btn" onClick={() => setConfirmAction(null)}>×</button>
            </div>
            <p className="confirm-desc">
              This action is <strong>irreversible</strong>. Please provide a clear reason for your decision.
            </p>
            <div className="confirm-notes-field">
              <label>Decision Notes <span className="required">*</span></label>
              <textarea
                rows={4}
                placeholder="Explain your reasoning…"
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesError(false); }}
                className={notesError ? "notes-error" : ""}
              />
              {notesError && (
                <span className="error-msg">Please provide at least a brief reason (10+ characters).</span>
              )}
            </div>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={`confirm-submit ${confirmAction.type === "refund" ? "confirm-submit--danger" : ""}`}
                onClick={handleConfirm}
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Evidence preview modal ───────────────────────────────────────── */}
      {preview && (
        <div className="preview-overlay" onClick={() => setPreview(null)}>
          <div className="preview-box" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setPreview(null)}>×</button>
            {preview.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(preview) ? (
              <img src={preview} alt="Evidence" style={{ maxWidth: "100%", borderRadius: "8px" }} />
            ) : (
              <>
                <p className="preview-filename">📎 {preview.split("/").pop()}</p>
                <a href={preview} target="_blank" rel="noreferrer" style={{ color: "var(--primary, #3b82f6)", fontSize: "0.9rem" }}>
                  Open file ↗
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};