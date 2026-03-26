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

interface Dispute {
  _id: string;
  listingID: DisputeListing;
  buyerID: DisputeUser;
  sellerID: DisputeUser;
  reportedBy: DisputeUser;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
}

type ActionType = "release" | "refund" | null;

const STATUS_FILTERS: ("All" | DisputeStatus)[] = [
  "All",
  "Pending",
  "Under Review",
  "Resolved",
  "Refunded",
  "Dismissed",
];

export const MediatorPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | DisputeStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    disputeId: string;
    type: ActionType;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);

  useEffect(() => {
    axios.get("/api/disputes", { withCredentials: true })
      .then(res => setDisputes(res.data.disputes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All"
    ? disputes
    : disputes.filter((d) => d.status === filter);

  const handleAction = (disputeId: string, type: ActionType) => {
    setConfirmAction({ disputeId, type });
    setNotes("");
    setNotesError(false);
  };

  const handleConfirm = async () => {
    if (notes.trim().length < 10) {
      setNotesError(true);
      return;
    }
    if (!confirmAction) return;
    const { disputeId, type } = confirmAction;
    const newStatus = type === "release" ? "Resolved" : "Refunded";

    try {
      await axios.post(`/api/disputes/update/${disputeId}`, 
        { status: newStatus }, 
        { withCredentials: true }
      );
      setDisputes(prev => prev.map(d =>
        d._id === disputeId ? { ...d, status: newStatus } : d
      ));
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

  if (loading) return <p className="mediator-empty">Loading disputes...</p>;

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
          {STATUS_FILTERS.map((s) => (
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

        {filtered.map((d) => {
          const isExpanded = expandedId === d._id;
          const isResolved = d.status === "Resolved" || d.status === "Refunded";

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
                </div>
                <div className="case-header-right">
                  <span className={`case-status ${statusClass(d.status)}`}>
                    {d.status}
                  </span>
                  <span className="case-amount">${d.listingID?.price?.toLocaleString() ?? "—"}</span>
                  <span className="case-chevron">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="case-body">
                  <hr className="case-divider" />

                  <div className="evidence-section">
                    <div className="evidence-col">
                      <h4>Dispute Reason</h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.6 }}>
                        {d.reason}
                      </p>
                    </div>
                    <div className="evidence-col">
                      <h4>Reported By</h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                        {fullName(d.reportedBy)}
                      </p>
                      <h4 style={{ marginTop: "12px" }}>Submitted</h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                        {new Date(d.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

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

      {confirmAction && (
        <div className="preview-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
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
                placeholder="Explain your reasoning..."
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesError(false); }}
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

      {preview && (
        <div className="preview-overlay" onClick={() => setPreview(null)}>
          <div className="preview-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setPreview(null)}>×</button>
            <p className="preview-filename">📎 {preview}</p>
            <p className="preview-placeholder">File preview would render here once connected to real file storage.</p>
          </div>
        </div>
      )}
    </div>
  );
};