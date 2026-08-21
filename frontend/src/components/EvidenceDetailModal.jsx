import React from "react";
import { X, Layers, Bot } from "lucide-react";

export const EvidenceDetailModal = ({ evidence, onClose, onAskAi }) => {
  if (!evidence) return null;

  const severity = evidence.severity || "Medium";
  const score = evidence.score;

  const getSeverityBadge = () => {
    switch (severity.toLowerCase()) {
      case "high":
        return <span className="badge badge-manipulated" style={{ fontSize: "0.74rem" }}>High Anomaly</span>;
      case "medium":
        return <span className="badge badge-inconclusive" style={{ fontSize: "0.74rem" }}>Medium Anomaly</span>;
      case "low":
        return <span className="badge badge-inconclusive" style={{ fontSize: "0.74rem" }}>Low Anomaly</span>;
      default:
        return <span className="badge badge-real" style={{ fontSize: "0.74rem" }}>Normal</span>;
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
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="saas-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-surface-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Evidence Item Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: "4px 8px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "70vh", overflowY: "auto" }}>
          
          {/* Severity & Score Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Source Module</span>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-primary)" }}>{evidence.type || evidence.source}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Severity Rating</span>
              {getSeverityBadge()}
            </div>
          </div>

          {/* Forensic Finding */}
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Forensic Observation</span>
            <p style={{ marginTop: "3px", fontSize: "0.88rem", color: "var(--text-main)", lineHeight: "1.45", fontWeight: 500 }}>
              {evidence.finding || (typeof evidence === "string" ? evidence : "Forensic finding observed.")}
            </p>
          </div>

          {/* Model Suspicion Score */}
          {score !== undefined && score !== null && (
            <div style={{ background: "var(--bg-surface-secondary)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Calculated Suspicion Score</span>
              <span className="mono-text" style={{ fontSize: "0.95rem", fontWeight: 800, color: score >= 0.5 ? "var(--color-fake)" : "var(--color-real)" }}>
                {Math.round(score * 100)}% ({score.toFixed(3)})
              </span>
            </div>
          )}

          {/* Explanation */}
          {evidence.explanation && (
            <div>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Technical Explanation</span>
              <p style={{ marginTop: "3px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.45" }}>
                {evidence.explanation}
              </p>
            </div>
          )}

          {/* Contribution */}
          {evidence.contribution && (
            <div style={{ background: "var(--color-primary-light)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-primary-border)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--color-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Contribution to Verdict</span>
              <p style={{ marginTop: "3px", fontSize: "0.82rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                {evidence.contribution}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
            {onAskAi && (
              <button
                onClick={() => {
                  onClose();
                  onAskAi(`Explain this specific evidence finding: "${evidence.finding || evidence.type}" and how it affected the verdict.`);
                }}
                className="btn-primary"
                style={{ fontSize: "0.8rem", padding: "7px 14px" }}
              >
                <Bot size={14} /> Ask AI About This Finding
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "7px 14px" }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
