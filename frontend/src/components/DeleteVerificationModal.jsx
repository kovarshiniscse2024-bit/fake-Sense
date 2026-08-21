import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

export const DeleteVerificationModal = ({ verificationId, fileName, onConfirm, onCancel }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onCancel}
    >
      <div
        className="saas-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "var(--shadow-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--color-fake-bg)",
              border: "1px solid var(--color-fake-border)",
              color: "var(--color-fake)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Delete Verification Record?
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Privacy & Data Deletion Control
            </p>
          </div>
        </div>

        {/* Message */}
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.45", margin: 0 }}>
          Are you sure you want to delete verification <strong style={{ color: "var(--text-main)" }}>{verificationId}</strong> ({fileName}) and its stored forensic context?
        </p>

        <div style={{ padding: "10px 12px", background: "var(--color-fake-bg)", borderRadius: "6px", border: "1px solid var(--color-fake-border)", fontSize: "0.76rem", color: "var(--color-fake)" }}>
          ⚠️ This action is permanent. The verification record will be purged immediately.
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          <button onClick={onCancel} disabled={deleting} className="btn-secondary" style={{ padding: "7px 14px", fontSize: "0.82rem" }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="btn-danger"
            style={{
              padding: "7px 14px",
              fontSize: "0.82rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Trash2 size={13} /> {deleting ? "Deleting..." : "Delete Verification"}
          </button>
        </div>
      </div>
    </div>
  );
};
