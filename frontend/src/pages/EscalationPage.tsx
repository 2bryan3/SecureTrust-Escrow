// src/pages/EscalationPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/EscalationPage.css";

interface TxSummary {
  _id: string;
  amount: number;
  status: string;
  listingId: { title: string } | string;
  buyerId:   { _id: string; firstName: string; lastName: string } | string;
  sellerId:  { _id: string; firstName: string; lastName: string } | string;
}

export const EscalationPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();

  const [tx, setTx]               = useState<TxSummary | null>(null);
  const [loading, setLoading]      = useState(true);
  const [alreadyOpen, setAlreadyOpen] = useState(false);

  const [message, setMessage]     = useState("");
  const [evidence, setEvidence]   = useState<string[]>([]); // uploaded URLs
  const [previews, setPreviews]   = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!transactionId) return;
    Promise.all([
      axios.get(`/api/transactions/${transactionId}`, { withCredentials: true }),
      axios.get(`/api/disputes/transaction/${transactionId}`, { withCredentials: true }),
    ])
      .then(([txRes, disputeRes]) => {
        setTx(txRes.data.transaction);
        if (disputeRes.data.dispute) setAlreadyOpen(true);
      })
      .catch(() => setError("Could not load transaction details."))
      .finally(() => setLoading(false));
  }, [transactionId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        });

    const base64s = await Promise.all(files.map(toBase64));

    setPreviews(prev => [...prev, ...files.map((f, i) => ({
        name: f.name,
        url: base64s[i],
    }))]);
    setEvidence(prev => [...prev, ...base64s]);
  };

  const removeEvidence = (idx: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    setEvidence(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!message.trim()) { setError("Please describe the issue before submitting."); return; }
    if (message.trim().length < 20) { setError("Please provide more detail (at least 20 characters)."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(
        `/api/disputes/escalate/${transactionId}`,
        { escalationMessage: message.trim(), evidence },
        { withCredentials: true }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const listingTitle = tx
    ? (typeof tx.listingId === "object" ? tx.listingId.title : "this listing")
    : "";

  if (loading) {
    return (
      <div className="escalation-page">
        <div className="escalation-loading">Loading transaction details…</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="escalation-page">
        <div className="escalation-success-card">
          <div className="escalation-success-icon">⚖️</div>
          <h2>Dispute Submitted</h2>
          <p>
            A mediator has been notified and will review your case for{" "}
            <strong>{listingTitle}</strong>. You can monitor updates on the listing page.
          </p>
          <button className="esc-btn esc-btn--primary" onClick={() => navigate(-1)}>
            Return to Listing
          </button>
        </div>
      </div>
    );
  }

  if (alreadyOpen) {
    return (
      <div className="escalation-page">
        <div className="escalation-success-card">
          <div className="escalation-success-icon">📋</div>
          <h2>Dispute Already Open</h2>
          <p>
            A mediator is already reviewing a dispute for <strong>{listingTitle}</strong>.
            You can monitor the status on the listing page.
          </p>
          <button className="esc-btn esc-btn--primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="escalation-page">
      <div className="escalation-container">

        {/* Back */}
        <button className="esc-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Header */}
        <div className="esc-header">
          <div className="esc-header-icon">⚖️</div>
          <div>
            <h1>Escalate to Mediator</h1>
            <p className="esc-subtitle">
              A SecureTrust mediator will review both sides and make a binding ruling.
            </p>
          </div>
        </div>

        {/* Transaction context strip */}
        {tx && (
          <div className="esc-tx-strip">
            <div className="esc-tx-item">
              <span className="esc-tx-label">Listing</span>
              <span className="esc-tx-value">{listingTitle}</span>
            </div>
            <div className="esc-tx-item">
              <span className="esc-tx-label">Amount</span>
              <span className="esc-tx-value">${tx.amount.toLocaleString()}</span>
            </div>
            <div className="esc-tx-item">
              <span className="esc-tx-label">Status</span>
              <span className="esc-tx-value esc-tx-status">{tx.status}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="esc-form">

          {/* Message */}
          <div className="esc-field">
            <label className="esc-label">
              Describe the issue <span className="esc-required">*</span>
            </label>
            <p className="esc-field-hint">
              Be specific. Include what was agreed upon, what went wrong, and what outcome you're seeking.
              Example: "The item arrived broken — the screen is cracked. I have photos."
            </p>
            <textarea
              className={`esc-textarea ${error && !message.trim() ? "esc-textarea--error" : ""}`}
              rows={7}
              placeholder="e.g. The item arrived broken. The screen was cracked and the seller is not responding. I have photos of the damage and the original listing photos for comparison."
              value={message}
              onChange={e => { setMessage(e.target.value); setError(null); }}
            />
            <span className="esc-char-count">{message.length} chars</span>
          </div>

            {/* Evidence upload */}
            <div className="esc-field">
            <label className="esc-label">Evidence (optional)</label>
            <p className="esc-field-hint">
                Upload photos or files that support your case.
            </p>

            <div className="esc-dropzone" onClick={() => {
                if (fileInputRef.current) {
                fileInputRef.current.value = "";
                fileInputRef.current.click();
                }
            }}>
                {previews.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", width: "100%" }}
                    onClick={e => e.stopPropagation()}
                >
                    {previews.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                        {p.url.startsWith("data:image/") || p.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img
                            src={p.url}
                            alt={p.name}
                            style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                        />
                        ) : (
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "8px",
                            border: "1px solid var(--border)", background: "var(--surface)",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", fontSize: "1.4rem", gap: "4px"
                        }}>
                            📄
                            <span style={{ fontSize: "0.6rem", color: "var(--muted)", textAlign: "center", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                            {p.name}
                            </span>
                        </div>
                        )}
                        <button
                        onClick={e => { e.stopPropagation(); removeEvidence(i); }}
                        style={{
                            position: "absolute", top: "-6px", right: "-6px",
                            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "50%",
                            width: "18px", height: "18px", color: "var(--muted)",
                            fontSize: "0.7rem", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", lineHeight: 1,
                        }}
                        >×</button>
                    </div>
                    ))}
                    <div style={{
                    width: "80px", height: "80px", borderRadius: "8px",
                    border: "2px dashed var(--border)", display: "flex",
                    flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: "1.4rem", color: "var(--muted)",
                    }}
                    onClick={e => { e.stopPropagation(); if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
                    >
                    +
                    </div>
                </div>
                ) : (
                <>
                    <span className="esc-dropzone-icon">📷</span>
                    <span className="esc-dropzone-text">Click to attach photos or files</span>
                    <span className="esc-dropzone-sub">Images, PDFs, videos</span>
                </>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
                accept="image/*,application/pdf,video/*"
                onChange={handleFileChange}
            />
            </div>

          {/* Error */}
          {error && <div className="esc-error">{error}</div>}

          {/* Warning */}
          <div className="esc-warning">
            <strong>⚠️ Note:</strong> Submitting a dispute freezes the transaction. The mediator's
            decision is final and binding for both parties.
          </div>

          {/* Actions */}
          <div className="esc-actions">
            <button className="esc-btn esc-btn--ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="esc-btn esc-btn--danger"
              onClick={handleSubmit}
              disabled={submitting || uploading}
            >
              {submitting ? "Submitting…" : "Submit Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};