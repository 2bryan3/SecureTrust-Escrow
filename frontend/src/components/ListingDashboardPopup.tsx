// frontend/src/components/ListingDashboardPopup.tsx
import React, { useState, useRef } from "react";
import "../styles/ListingDashboard.css";

interface Milestone {
  id: string;
  title: string;
  status: "Pending" | "Completed" | "Evidence Submitted";
}

interface ListingDashboardPopupProps {
  listingTitle: string;
  milestones: Milestone[];
  escrowAmount: number;
  onClose: () => void;
}

export const ListingDashboardPopup: React.FC<ListingDashboardPopupProps> = ({
  listingTitle,
  milestones,
  escrowAmount,
  onClose,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    alert(`Uploading ${selectedFiles.length} files for ${activeMilestone.title}`);
  };

  const handleConfirmRelease = () => {
    if (!activeMilestone) return;
    alert(`Confirming release for ${activeMilestone.title}`);
  };

  const handleAddFunds = () => {
    if (!activeMilestone) return;
    const amount = prompt("Enter amount to add to escrow:", "0");
    if (amount) alert(`Adding $${amount} to ${activeMilestone.title}`);
  };

  return (
    <div className="listing-dashboard-overlay" onClick={onClose}>
      <div className="listing-dashboard-popup" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2>{listingTitle}</h2>
            <p className="order-subtitle">Order Management</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Progress tracker */}
        <div className="order-progress">
          {milestones.map((m, i) => (
            <div key={m.id} className={`progress-step ${m.status.toLowerCase().replace(" ", "-")}`}>
              <div className="circle">{i + 1}</div>
              <span>{m.title}</span>
            </div>
          ))}
        </div>

        {/* Milestones */}
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

        {/* Funds */}
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

        {/* Actions */}
        {activeMilestone && (
          <div className="dashboard-section actions-section">
            <h3>Actions — {activeMilestone.title}</h3>

            {/* File upload */}
            <div className="evidence-upload">
              <div
                className="evidence-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="evidence-icon">📎</span>
                <span className="evidence-hint">
                  Click to attach evidence files
                </span>
              </div>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {/* File list */}
              {selectedFiles.length > 0 && (
                <div className="evidence-file-list">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="evidence-file-item">
                      <span className="evidence-file-name">📄 {file.name}</span>
                      <button
                        className="evidence-file-remove"
                        onClick={() => handleRemoveFile(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="action-btn upload" onClick={handleUploadEvidence}>
              Upload Evidence
            </button>
            <button className="action-btn release" onClick={handleConfirmRelease}>
              Confirm & Release Funds
            </button>
            <button className="action-btn add" onClick={handleAddFunds}>
              Add Funds
            </button>
          </div>
        )}
      </div>
    </div>
  );
};