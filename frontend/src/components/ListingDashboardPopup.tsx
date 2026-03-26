// frontend/src/components/ListingDashboardPopup.tsx
import React, { useState, useRef } from "react";
import "../styles/ListingDashboard.css";
import axios from "axios";
import { ToastPortal } from "./ToastPortal";

interface Milestone {
  id: string;
  title: string;
  status: "Pending" | "Completed" | "Evidence Submitted";
}

interface ListingDashboardPopupProps {
  listingTitle: string;
  deliveryMethod: "shipping" | "local_pickup";
  escrowAmount: number;
  isOwner: boolean;
  listingID: string;
  sellerID: string;
  onClose: () => void;
}

const getMilestones = (deliveryMethod: "shipping" | "local_pickup"): Milestone[] => {
  if (deliveryMethod === "shipping") {
    return [
      { id: "1", title: "Seller uploads tracking number or photo of packaged item", status: "Pending" },
      { id: "2", title: "Buyer confirms item received and matches listing", status: "Pending" },
      { id: "3", title: "Funds released to seller", status: "Pending" },
    ];
  }
  return [
    { id: "1", title: "Seller uploads photo of item before meetup", status: "Pending" },
    { id: "2", title: "Buyer confirms item at meetup", status: "Pending" },
    { id: "3", title: "Funds released to seller", status: "Pending" },
  ];
};

export const ListingDashboardPopup: React.FC<ListingDashboardPopupProps> = ({
  listingTitle,
  deliveryMethod,
  escrowAmount,
  isOwner,
  listingID,
  sellerID,
  onClose,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>(getMilestones(deliveryMethod));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMilestoneIndex = activeMilestone ? milestones.findIndex(m => m.id === activeMilestone.id) : -1;
  const milestone1Complete = milestones[0].status === "Completed" || milestones[0].status === "Evidence Submitted";
  const isFinalMilestone = activeMilestoneIndex === 2;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadEvidence = () => {
    if (!activeMilestone) return;
    setMilestones(prev => prev.map(m =>
      m.id === activeMilestone.id ? { ...m, status: "Evidence Submitted" } : m
    ));
    setActiveMilestone(prev => prev ? { ...prev, status: "Evidence Submitted" } : null);
    setSelectedFiles([]);
    setToast({ message: `Evidence submitted for: ${activeMilestone.title}`, type: "success" });
  };

  const handleConfirmReceipt = () => {
    if (!activeMilestone) return;
    setMilestones(prev => prev.map(m =>
      m.id === activeMilestone.id ? { ...m, status: "Completed" }
      : m.id === "3" ? { ...m, status: "Completed" }
      : m
    ));
    setActiveMilestone(prev => prev ? { ...prev, status: "Completed" } : null);
    setToast({ message: "Receipt confirmed! Funds will be released to the seller.", type: "success" });
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) return;
    try {
      await axios.post("/api/disputes/create", {
        listingID,
        sellerID,
        reason: escalationReason,
      }, { withCredentials: true });
      setToast({ message: "Dispute submitted. A mediator will review your case.", type: "success" });
      setShowEscalate(false);
      setEscalationReason("");
    } catch (err: any) {
      setToast({ message: err.response?.data?.message ?? "Failed to submit dispute.", type: "error" });
    }
  };

  const renderActions = () => {
    if (!activeMilestone || isFinalMilestone) return null;

    if (activeMilestoneIndex === 0) {
      if (isOwner) {
        return (
          <>
            {deliveryMethod === "shipping" && (
              <div className="cl-field" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box" as const }}
                />
              </div>
            )}
            <div className="evidence-upload">
              <div className="evidence-dropzone" onClick={() => fileInputRef.current?.click()}>
                <span className="evidence-icon">📎</span>
                <span className="evidence-hint">Click to attach evidence files</span>
              </div>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
              {selectedFiles.length > 0 && (
                <div className="evidence-file-list">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="evidence-file-item">
                      <span className="evidence-file-name">📄 {file.name}</span>
                      <button className="evidence-file-remove" onClick={() => handleRemoveFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="action-btn upload" onClick={handleUploadEvidence}>
              Upload Evidence
            </button>
          </>
        );
      } else {
        return <p className="dashboard-waiting">Waiting for seller to upload evidence...</p>;
      }
    }

    if (activeMilestoneIndex === 1) {
      if (!isOwner) {
        return (
          <button className="action-btn release" onClick={handleConfirmReceipt}>
            {deliveryMethod === "shipping" ? "Confirm Item Received" : "Confirm Item at Meetup"}
          </button>
        );
      } else {
        return <p className="dashboard-waiting">Waiting for buyer to confirm...</p>;
      }
    }

    return null;
  };

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />
        <div className="listing-dashboard-overlay" onClick={onClose}>
          <div className="listing-dashboard-popup" onClick={(e) => e.stopPropagation()}>

            <div className="dashboard-header">
              <div>
                <h2>{listingTitle}</h2>
                <p className="order-subtitle">Order Management</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="order-progress">
              {milestones.map((m, i) => (
                <div key={m.id} className={`progress-step ${m.status.toLowerCase().replace(" ", "-")}`}>
                  <div className="circle">{i + 1}</div>
                  <span>{m.title}</span>
                </div>
              ))}
            </div>

            <div className="dashboard-section">
              <h3>Milestones</h3>
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className={`milestone-card ${m.status.toLowerCase().replace(" ", "-")} ${activeMilestone?.id === m.id ? "active" : ""}`}
                  onClick={() => setActiveMilestone(m)}
                >
                  <span>{m.title}</span>
                  <span className="status">{m.status}</span>
                </div>
              ))}
            </div>

            <div className="dashboard-section">
              <h3>Funds</h3>
              <div className="funds-row">
                <div className="funds-left">
                  <div className="funds-amount">${escrowAmount}</div>
                  <div className="funds-status">Held in Escrow</div>
                </div>
                <div className="funds-right">
                  {activeMilestone ? (
                    <>
                      <div className="funds-meta-label">Active Milestone</div>
                      <div className="funds-meta-value">{activeMilestone.title}</div>
                    </>
                  ) : (
                    <>
                      <div className="funds-meta-label">Select a milestone</div>
                      <div className="funds-meta-value muted">to take action</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {activeMilestone && !isFinalMilestone && (
              <div className="dashboard-section actions-section">
                <h3>Actions — {activeMilestone.title}</h3>
                {renderActions()}
              </div>
            )}
            {/* change to milestone1Complete from "true" once we have real data to determine if milestone 1 is complete */}
            {true && (
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
                      onChange={e => setEscalationReason(e.target.value)}
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