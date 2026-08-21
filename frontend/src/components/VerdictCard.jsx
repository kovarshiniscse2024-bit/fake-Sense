import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Download, Sparkles, Cpu } from "lucide-react";

export const VerdictCard = ({ result, onDownloadPdf, isDownloading }) => {
  const verdict = result.verdict || "Inconclusive";
  const authScore = result.authenticity_score ?? 50;
  const confidence = result.confidence ?? 0.85;

  let verdictConfig = {
    title: "Likely Authentic",
    desc: "Forensic analysis indicates consistent authentic camera signals, natural noise patterns, and optical frequency falloff.",
    icon: ShieldCheck,
    badgeClass: "badge-real",
    color: "var(--color-real)",
    bg: "var(--color-real-bg)",
    border: "var(--color-real-border)",
  };

  if (verdict === "Likely AI-Generated") {
    verdictConfig = {
      title: "Likely AI-Generated",
      desc: "Synthetic diffusion residuals, non-optical frequency decay, or generative AI texture markers detected.",
      icon: Sparkles,
      badgeClass: "badge-ai",
      color: "#7e22ce",
      bg: "#f3e8ff",
      border: "#d8b4fe",
    };
  } else if (verdict === "Likely Manipulated") {
    verdictConfig = {
      title: "Likely Manipulated",
      desc: "Suspicious localized manipulation patterns, frequency irregularities, or facial boundary anomalies detected.",
      icon: ShieldAlert,
      badgeClass: "badge-manipulated",
      color: "var(--color-fake)",
      bg: "var(--color-fake-bg)",
      border: "var(--color-fake-border)",
    };
  } else if (verdict === "Likely Authentic" || verdict === "Likely Real") {
    verdictConfig = {
      title: "Likely Authentic",
      desc: "Forensic analysis indicates consistent authentic camera signals, natural noise patterns, and optical frequency falloff.",
      icon: ShieldCheck,
      badgeClass: "badge-real",
      color: "var(--color-real)",
      bg: "var(--color-real-bg)",
      border: "var(--color-real-border)",
    };
  } else {
    verdictConfig = {
      title: "Inconclusive",
      desc: "Evidence is mixed or insufficient to confirm genuine origin or deliberate manipulation.",
      icon: AlertTriangle,
      badgeClass: "badge-inconclusive",
      color: "var(--color-inconclusive)",
      bg: "var(--color-inconclusive-bg)",
      border: "var(--color-inconclusive-border)",
    };
  }

  const Icon = verdictConfig.icon;

  return (
    <div
      className="saas-card animate-fade-in"
      style={{
        padding: "28px 32px",
        background: "var(--bg-surface)",
        border: `1px solid var(--border-subtle)`,
        borderRadius: "14px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
        
        {/* Left Verdict Hero */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: "1 1 360px" }}>
          <div style={{
            padding: "14px",
            borderRadius: "12px",
            background: verdictConfig.bg,
            border: `1px solid ${verdictConfig.border}`,
            color: verdictConfig.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon size={36} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className={`badge ${verdictConfig.badgeClass}`} style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                AI Verdict
              </span>
              <span className="mono-text" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                ID: {result.verification_id}
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: verdictConfig.color, letterSpacing: "-0.02em", margin: "2px 0 4px 0" }}>
              {verdictConfig.title}
            </h1>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "480px", margin: 0, lineHeight: 1.45 }}>
              {verdictConfig.desc}
            </p>
          </div>
        </div>

        {/* Right Stats & Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {/* Authenticity Score */}
            <div style={{
              padding: "10px 18px",
              background: "var(--bg-surface-secondary)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
              minWidth: "115px"
            }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Authenticity
              </div>
              <div className="mono-text" style={{ fontSize: "1.6rem", fontWeight: 800, color: verdictConfig.color }}>
                {authScore}%
              </div>
            </div>

            {/* Confidence Rating */}
            <div style={{
              padding: "10px 18px",
              background: "var(--bg-surface-secondary)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
              minWidth: "115px"
            }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Confidence
              </div>
              <div className="mono-text" style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                {Math.round(confidence * 100)}%
              </div>
            </div>
          </div>

          {/* PDF Download Button */}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="btn-primary"
              style={{ width: "100%", padding: "9px 16px", fontSize: "0.85rem" }}
            >
              <Download size={15} />
              {isDownloading ? "Generating PDF..." : "Download Verification Report"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
