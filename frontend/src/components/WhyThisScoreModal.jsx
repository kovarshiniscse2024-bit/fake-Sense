import React from "react";
import { X, HelpCircle, AlertTriangle, Info } from "lucide-react";

export const WhyThisScoreModal = ({ result, onClose, onAskAi }) => {
  if (!result) return null;

  const { authenticity_score, confidence, verdict, modules = {}, file_name } = result;

  const vis = modules.visual_cnn || {};
  const face = modules.face_analysis || {};
  const meta = modules.metadata || {};
  const sync = modules.audio_visual_sync || {};

  const getQualitativeImpact = (modKey, modData) => {
    if (!modData || modData.status !== "completed") {
      return { status: "Neutral / Skipped", text: "Did not contribute active suspicion signals to the score.", color: "var(--text-muted)", bg: "var(--bg-surface-secondary)", border: "var(--border-subtle)" };
    }
    const susp = modData.suspicion_score || 0;
    if (susp >= 0.50) {
      return { status: "Strong Manipulation Indicator", text: `High suspicion (${Math.round(susp * 100)}%) pulled the authenticity score down.`, color: "var(--color-fake)", bg: "var(--color-fake-bg)", border: "var(--color-fake-border)" };
    } else if (susp >= 0.30) {
      return { status: "Moderate Inconsistency", text: `Mild variations (${Math.round(susp * 100)}%) slightly decreased estimated authenticity.`, color: "var(--color-inconclusive)", bg: "var(--color-inconclusive-bg)", border: "var(--color-inconclusive-border)" };
    } else {
      return { status: "Authenticity Supporter", text: `Low suspicion (${Math.round(susp * 100)}%) confirms consistency with authentic baselines.`, color: "var(--color-real)", bg: "var(--color-real-bg)", border: "var(--color-real-border)" };
    }
  };

  const visImpact = getQualitativeImpact("visual_cnn", vis);
  const faceImpact = getQualitativeImpact("face_analysis", face);
  const metaImpact = getQualitativeImpact("metadata", meta);
  const syncImpact = getQualitativeImpact("audio_visual_sync", sync);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="saas-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "var(--shadow-xl)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                padding: "6px",
                borderRadius: "6px",
                background: "var(--color-primary-light)",
                color: "var(--color-primary)"
              }}>
                <HelpCircle size={18} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                Why This Score? ({authenticity_score}%)
              </h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px", margin: "4px 0 0 0" }}>
              Evidence aggregation breakdown for <span className="mono-text" style={{ color: "var(--color-primary)", fontWeight: 600 }}>{file_name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Hero Score Synthesis */}
        <div style={{
          padding: "14px 18px",
          background: "var(--bg-surface-secondary)",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
              Synthesized Verdict
            </span>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: verdict === "Likely Real" ? "var(--color-real)" : (verdict === "Likely Manipulated" ? "var(--color-fake)" : "var(--color-inconclusive)") }}>
              {verdict}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
              Confidence Rating
            </span>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
              {Math.round((confidence || 0.85) * 100)}%
            </div>
          </div>
        </div>

        {/* Qualitative Module Contribution Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
            Qualitative Forensic Signal Breakdown
          </h4>

          {/* Visual Analysis */}
          <div style={{ padding: "12px 14px", background: visImpact.bg, borderRadius: "8px", border: `1px solid ${visImpact.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>Visual / Sensor Noise Analysis</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: visImpact.color }}>{visImpact.status}</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              {vis.details || visImpact.text}
            </p>
          </div>

          {/* Facial Analysis */}
          <div style={{ padding: "12px 14px", background: faceImpact.bg, borderRadius: "8px", border: `1px solid ${faceImpact.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>Facial Boundary & Symmetry Analysis</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: faceImpact.color }}>{faceImpact.status}</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              {face.details || faceImpact.text}
            </p>
          </div>

          {/* Metadata */}
          <div style={{ padding: "12px 14px", background: metaImpact.bg, borderRadius: "8px", border: `1px solid ${metaImpact.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>Metadata & Hardware Provenance</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: metaImpact.color }}>{metaImpact.status}</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              {meta.details || metaImpact.text}
            </p>
          </div>

          {/* Audio Visual Sync (if applicable) */}
          {result.media_type === "video" && (
            <div style={{ padding: "12px 14px", background: syncImpact.bg, borderRadius: "8px", border: `1px solid ${syncImpact.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>Audio-Visual Synchronization</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: syncImpact.color }}>{syncImpact.status}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                {sync.details || syncImpact.text}
              </p>
            </div>
          )}
        </div>

        {/* Why this matters & Limitations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ padding: "12px 14px", background: "var(--color-primary-light)", borderRadius: "8px", border: "1px solid var(--color-primary-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.82rem", marginBottom: "4px" }}>
              <Info size={15} /> Why This Matters
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              FakeSense evaluates physical and statistical laws of image formation. Discrepancies across independent checks lower estimated authenticity.
            </p>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--color-inconclusive-bg)", borderRadius: "8px", border: "1px solid var(--color-inconclusive-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-inconclusive)", fontWeight: 700, fontSize: "0.82rem", marginBottom: "4px" }}>
              <AlertTriangle size={15} /> Limitations
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              This is a probabilistic assessment. Social media re-compression or studio lighting can trigger false anomalies.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          {onAskAi && (
            <button
              onClick={() => {
                onClose();
                onAskAi("Why was this authenticity score and verdict assigned based on the active modules?");
              }}
              className="btn-primary"
              style={{ fontSize: "0.82rem", padding: "7px 14px" }}
            >
              Ask AI to Explain In-Depth
            </button>
          )}
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "7px 14px" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
