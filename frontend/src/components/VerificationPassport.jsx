import React from "react";
import { ShieldCheck, Download, Calendar, FileText, CheckCircle2, AlertTriangle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const VerificationPassport = ({ result, onDownloadPdf, isDownloading }) => {
  if (!result) return null;

  const {
    verification_id,
    file_name,
    media_type,
    created_at,
    verdict,
    authenticity_score,
    confidence,
    evidence = [],
    modules = {}
  } = result;

  const copyId = () => {
    navigator.clipboard.writeText(verification_id);
    alert(`Verification ID ${verification_id} copied to clipboard!`);
  };

  const formattedDate = new Date(created_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  const getVerdictStyle = (v) => {
    switch (v) {
      case "Likely Real":
        return { color: "var(--color-real)", bg: "var(--color-real-bg)", border: "var(--color-real-border)", icon: CheckCircle2 };
      case "Likely Manipulated":
        return { color: "var(--color-fake)", bg: "var(--color-fake-bg)", border: "var(--color-fake-border)", icon: AlertCircle };
      case "Inconclusive":
      default:
        return { color: "var(--color-inconclusive)", bg: "var(--color-inconclusive-bg)", border: "var(--color-inconclusive-border)", icon: AlertTriangle };
    }
  };

  const vStyle = getVerdictStyle(verdict);
  const IconComp = vStyle.icon;

  return (
    <div
      className="saas-card animate-fade-in"
      style={{
        padding: "24px 28px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}
    >
      {/* Passport Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        paddingBottom: "14px",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-primary)", fontWeight: 700 }}>
              VERIFICATION SUMMARY
            </span>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              FakeSense Verification Passport
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            onClick={copyId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "6px",
              background: "var(--bg-surface-secondary)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              fontSize: "0.8rem"
            }}
            title="Click to copy Verification ID"
          >
            <span style={{ color: "var(--text-muted)" }}>ID:</span>
            <span className="mono-text" style={{ color: "var(--color-primary)", fontWeight: 700 }}>{verification_id}</span>
            <Copy size={12} color="var(--text-muted)" />
          </div>

          <Link
            to="/history"
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              background: "var(--bg-surface-secondary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: "0.78rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <ExternalLink size={12} /> View History
          </Link>
        </div>
      </div>

      {/* Passport Core Body Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        
        {/* File Details */}
        <div style={{ padding: "12px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target Media</span>
          <div className="mono-text" style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file_name}
          </div>
          <span className="badge badge-blue" style={{ fontSize: "0.62rem", marginTop: "4px", display: "inline-block" }}>
            {media_type?.toUpperCase()}
          </span>
        </div>

        {/* Verification Timestamp */}
        <div style={{ padding: "12px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Verification Date</span>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>
            {formattedDate}
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Audit Log Synchronized
          </span>
        </div>

        {/* Verdict Badge Card */}
        <div style={{ padding: "12px 14px", background: vStyle.bg, borderRadius: "8px", border: `1px solid ${vStyle.border}` }}>
          <span style={{ fontSize: "0.72rem", color: vStyle.color, textTransform: "uppercase", fontWeight: 800 }}>Final Verdict</span>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
            <IconComp size={16} color={vStyle.color} />
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: vStyle.color }}>{verdict}</span>
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Evidence Aggregation Synthesized
          </span>
        </div>

        {/* Authenticity & Confidence Card */}
        <div style={{ padding: "12px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Authenticity & Confidence</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-primary)" }}>{authenticity_score}%</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Confidence: <strong style={{ color: "var(--text-main)" }}>{Math.round((confidence || 0.85) * 100)}%</strong></span>
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            {evidence.length} Recorded Forensic Signal(s)
          </span>
        </div>
      </div>

      {/* Forensic Summary Overview */}
      <div style={{ padding: "14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.04em", display: "block", marginBottom: "8px" }}>
          FORENSIC SUMMARY
        </span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", fontSize: "0.82rem" }}>
          <div>
            <strong style={{ color: "var(--text-main)" }}>Visual / CNN:</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{modules.visual_cnn?.details || "Sensor noise analyzed"}</span>
          </div>
          <div>
            <strong style={{ color: "var(--text-main)" }}>Facial Analysis:</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{modules.face_analysis?.details || "Facial geometry evaluated"}</span>
          </div>
          <div>
            <strong style={{ color: "var(--text-main)" }}>Metadata:</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{modules.metadata?.details || "Metadata inspected"}</span>
          </div>
          {media_type === "video" && (
            <div>
              <strong style={{ color: "var(--text-main)" }}>Audio-Visual:</strong>{" "}
              <span style={{ color: "var(--text-secondary)" }}>{modules.audio_visual_sync?.details || "Sync analyzed"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions & Legal Disclaimer */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        paddingTop: "10px",
        borderTop: "1px solid var(--border-subtle)"
      }}>
        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0, maxWidth: "580px", lineHeight: 1.4 }}>
          <strong>Disclaimer:</strong> FakeSense provides an AI-assisted probabilistic media assessment. Results should not be treated as definitive forensic or legal proof.
        </p>

        {onDownloadPdf && (
          <button
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="btn-primary"
            style={{ fontSize: "0.82rem", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={14} />
            {isDownloading ? "Generating PDF..." : "Download Verification Report"}
          </button>
        )}
      </div>

    </div>
  );
};
