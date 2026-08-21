import React from "react";
import { Gauge, HelpCircle } from "lucide-react";

export const ScoreCard = ({ score = 50, confidence = 0.85, verdict = "Inconclusive", onOpenWhyScore }) => {
  const getScoreColor = (val, verd) => {
    if (verd === "Likely AI-Generated") return "#7e22ce";
    if (verd === "Likely Authentic" || verd === "Likely Real" || val >= 68) return "var(--color-real)";
    if (verd === "Likely Manipulated" || val <= 45) return "var(--color-fake)";
    return "var(--color-inconclusive)";
  };

  const scoreColor = getScoreColor(score, verdict);

  return (
    <div className="saas-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              padding: "6px",
              borderRadius: "6px",
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
              display: "flex"
            }}>
              <Gauge size={18} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Authenticity Index & Confidence</h3>
          </div>

          {onOpenWhyScore && (
            <button
              onClick={onOpenWhyScore}
              className="btn-secondary"
              style={{
                fontSize: "0.76rem",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--color-primary)",
                borderColor: "var(--color-primary-border)"
              }}
            >
              <HelpCircle size={13} /> Why this score?
            </button>
          )}
        </div>

        {/* Authenticity Progress Bar */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Estimated Authenticity
            </span>
            <span className="mono-text" style={{ fontSize: "1rem", fontWeight: 800, color: scoreColor }}>
              {score} / 100
            </span>
          </div>
          <div style={{ height: "7px", background: "var(--bg-surface-secondary)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${score}%`,
              background: scoreColor,
              borderRadius: "4px",
              transition: "width 0.5s ease"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            <span>0% Manipulated</span>
            <span>50% Inconclusive</span>
            <span>100% Authentic</span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Signal Consistency Confidence
            </span>
            <span className="mono-text" style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-primary)" }}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div style={{ height: "7px", background: "var(--bg-surface-secondary)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${confidence * 100}%`,
              background: "var(--color-primary)",
              borderRadius: "4px",
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      </div>

      {onOpenWhyScore && (
        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
          <span
            onClick={onOpenWhyScore}
            style={{ fontSize: "0.76rem", color: "var(--color-primary)", cursor: "pointer", fontWeight: 600 }}
          >
            Click to view qualitative signal contributions →
          </span>
        </div>
      )}
    </div>
  );
};
