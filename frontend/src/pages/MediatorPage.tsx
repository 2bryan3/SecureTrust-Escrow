// src/pages/MediatorPage.tsx
import React, { useState } from "react";
import "../styles/MediatorPage.css";

type DisputeStatus = "Under Review" | "Resolved" | "Refunded" | "Escalated";

interface TimelineEvent {
  text: string;
  date: string;
}

interface Dispute {
  id: string;
  title: string;
  buyer: string;
  seller: string;
  status: DisputeStatus;
  buyerEvidence: string[];
  sellerEvidence: string[];
  timeline: TimelineEvent[];
  escrowAmount: number;
}

type ActionType = "release" | "refund" | null;

const mockDisputes: Dispute[] = [
  {
    id: "1",
    title: "Gaming PC Build",
    buyer: "JohnDoe",
    seller: "TechSeller",
    status: "Under Review",
    escrowAmount: 1200,
    buyerEvidence: ["image1.png", "receipt.pdf"],
    sellerEvidence: ["tracking.png"],
    timeline: [
      { text: "Buyer opened dispute", date: "Feb 25" },
      { text: "Seller uploaded tracking", date: "Feb 26" },
    ],
  },
  {
    id: "2",
    title: "Sony A7 Camera",
    buyer: "PhotoFan",
    seller: "GearShop",
    status: "Escalated",
    escrowAmount: 850,
    buyerEvidence: ["damage_photo.jpg"],
    sellerEvidence: ["packaging.jpg", "invoice.pdf"],
    timeline: [
      { text: "Buyer opened dispute", date: "Feb 20" },
      { text: "Seller responded", date: "Feb 21" },
      { text: "Escalated to mediator", date: "Feb 23" },
    ],
  },
  {
    id: "3",
    title: "Nike Air Jordan 4",
    buyer: "SneakerHead",
    seller: "KickStore",
    status: "Resolved",
    escrowAmount: 320,
    buyerEvidence: ["photo.jpg"],
    sellerEvidence: ["tracking.png"],
    timeline: [
      { text: "Buyer opened dispute", date: "Feb 10" },
      { text: "Funds released to seller", date: "Feb 12" },
    ],
  },
];

const STATUS_FILTERS: ("All" | DisputeStatus)[] = [
  "All",
  "Under Review",
  "Escalated",
  "Resolved",
  "Refunded",
];

export const MediatorPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | DisputeStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    disputeId: string;
    type: ActionType;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);

  const filtered = filter === "All"
    ? disputes
    : disputes.filter((d) => d.status === filter);

  const handleAction = (disputeId: string, type: ActionType) => {
    setConfirmAction({ disputeId, type });
    setNotes("");
    setNotesError(false);
  };

  const handleConfirm = () => {
    if (notes.trim().length < 10) {
      setNotesError(true);
      return;
    }

    if (!confirmAction) return;
    const { disputeId, type } = confirmAction;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: type === "release" ? "Resolved" : "Refunded",
              timeline: [
                ...d.timeline,
                {
                  text: type === "release"
                    ? `Funds released to seller — ${notes}`
                    : `Buyer refunded — ${notes}`,
                  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                },
              ],
            }
          : d
      )
    );

    setConfirmAction(null);
    setNotes("");
  };

  const statusClass = (status: DisputeStatus) =>
    status.toLowerCase().replace(" ", "-");

  return (
    <div className="mediator-page">

      {/* Page header */}
      <div className="mediator-header">
        <div>
          <h1 className="mediator-title">Mediator Dashboard</h1>
          <p className="mediator-subtitle">
            {disputes.filter(d => d.status === "Under Review" || d.status === "Escalated").length} active cases
          </p>
        </div>

        {/* Status filter */}
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

      {/* Cases */}
      <div className="mediator-cases">
        {filtered.length === 0 && (
          <p className="mediator-empty">No cases match this filter.</p>
        )}

        {filtered.map((d) => {
          const isExpanded = expandedId === d.id;
          const isResolved = d.status === "Resolved" || d.status === "Refunded";

          return (
            <div key={d.id} className={`case-card ${isResolved ? "case-card--resolved" : ""}`}>

              {/* Header */}
              <div
                className="case-header"
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="case-header-left">
                  <h2>{d.title}</h2>
                  <div className="case-parties">
                    <span className="party-label">Buyer</span>
                    <span className="party-name">{d.buyer}</span>
                    <span className="party-divider">vs</span>
                    <span className="party-label">Seller</span>
                    <span className="party-name">{d.seller}</span>
                  </div>
                </div>
                <div className="case-header-right">
                  <span className={`case-status ${statusClass(d.status)}`}>
                    {d.status}
                  </span>
                  <span className="case-amount">${d.escrowAmount.toLocaleString()}</span>
                  <span className="case-chevron">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="case-body">
                  <hr className="case-divider" />

                  {/* Evidence */}
                  <div className="evidence-section">
                    <div className="evidence-col">
                      <h4>Buyer Evidence</h4>
                      {d.buyerEvidence.map((file, i) => (
                        <div
                          key={i}
                          className="evidence-item"
                          onClick={() => setPreview(file)}
                        >
                          📎 {file}
                        </div>
                      ))}
                    </div>
                    <div className="evidence-col">
                      <h4>Seller Evidence</h4>
                      {d.sellerEvidence.map((file, i) => (
                        <div
                          key={i}
                          className="evidence-item"
                          onClick={() => setPreview(file)}
                        >
                          📎 {file}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="timeline">
                    <h4>Case Timeline</h4>
                    {d.timeline.map((event, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div>
                          <p className="timeline-text">{event.text}</p>
                          <span className="timeline-date">{event.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions — hide if resolved */}
                  {!isResolved && (
                    <div className="case-actions">
                      <button
                        className="release-btn"
                        onClick={() => handleAction(d.id, "release")}
                      >
                        ✓ Release Funds to Seller
                      </button>
                      <button
                        className="refund-btn"
                        onClick={() => handleAction(d.id, "refund")}
                      >
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

      {/* Confirmation modal */}
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
              This action is <strong>irreversible</strong>. Please provide a clear
              reason for your decision before proceeding.
            </p>

            <div className="confirm-notes-field">
              <label>Decision Notes <span className="required">*</span></label>
              <textarea
                rows={4}
                placeholder="Explain your reasoning — e.g. 'Seller provided valid tracking showing delivery. Buyer claim unsupported by evidence.'"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesError(false);
                }}
                className={notesError ? "notes-error" : ""}
              />
              {notesError && (
                <span className="error-msg">
                  Please provide at least a brief reason (10+ characters).
                </span>
              )}
            </div>

            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
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

      {/* File preview modal */}
      {preview && (
        <div className="preview-overlay" onClick={() => setPreview(null)}>
          <div className="preview-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setPreview(null)}>×</button>
            <p className="preview-filename">📎 {preview}</p>
            <p className="preview-placeholder">
              File preview would render here once connected to real file storage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};