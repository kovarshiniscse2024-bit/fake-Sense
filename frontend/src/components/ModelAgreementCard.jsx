import React from "react";
import { GitPullRequest, CheckCircle2, AlertTriangle, AlertCircle, MessageSquare } from "lucide-react";

export const ModelAgreementCard = ({ agreement, modules = {}, onAskAi }) => {
  if (!agreement) return null;

  const { state = "MODERATE AGREEMENT", summary = "", variance = 0.0, max_delta = 0.0 } = agreement;

  const getStateConfig = (st) => {
    switch (st) {
      case "HIGH AGREEMENT":
        return { color: "var(--color-real)", bg: "var(--color-real-bg)", border: "var(--color-real-border)", icon: CheckCircle2 };
      case "MODERATE AGREEMENT":
        return { color: "var(--color-primary)", bg: "var(--color-primary-light)", border: "var(--color-primary-border)", icon: CheckCircle2 };
      case "MIXED":
        return { color: "var(--color-inconclusive)", bg: "var(--color-inconclusive-bg)", border: "var(--color-inconclusive-border)", icon: AlertTriangle };
      case "MODERATE DISAGREEMENT":
        return { color: "var(--color-inconclusive)", bg: "var(--color-inconclusive-bg)", border: "var(--color-inconclusive-border)", icon: AlertTriangle };
      case "HIGH DISAGREEMENT":
      default:
        return { color: "var(--color-fake)", bg: "var(--color-fake-bg)", border: "var(--color-fake-border)", icon: AlertCircle };
    }
  };

  const cfg = getStateConfig(state);
  const IconComp = cfg.icon;

  // Active module bars
  const activeMods = [];
  const friendlyNames = {
    visual_cnn: "Visual / Sensor Noise",
    face_analysis: "Facial Consistency",
    metadata: "Metadata Integrity",
    audio_visual_sync: "Audio-Visual Sync"
  };

  for (const [key, val] of Object.entries(modules)) {
    if (val && val.status === "completed" && val.suspicion_score !== undefined && val.suspicion_score !== null) {
      activeMods.push({
        id: key,
        name: friendlyNames[key] || key.replace("_", " ").toUpperCase(),
        suspicion: val.suspicion_score,
        details: val.details || "Analyzed"
      });
    }
  }

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "20px 24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: cfg.bg,
            color: cfg.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <GitPullRequest size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Model Agreement & Consistency
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Cross-model consensus evaluation based on actual signal variance
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "6px",
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
          fontWeight: 700,
          fontSize: "0.76rem"
        }}>
          <IconComp size={14} />
          <span>{state}</span>
        </div>
      </div>

      {/* Summary Narrative */}
      <div style={{
        padding: "12px 14px",
        background: "var(--bg-surface-secondary)",
        borderRadius: "8px",
        border: "1px solid var(--border-subtle)",
        marginBottom: "14px"
      }}>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
          {summary || "Active modules exhibit consistent forensic baselines across independent checks."}
        </p>
        <div style={{ display: "flex", gap: "14px", marginTop: "6px", fontSize: "0.74rem", color: "var(--text-muted)" }}>
          <span>Variance: <strong className="mono-text" style={{ color: "var(--text-main)" }}>{variance}</strong></span>
          <span>Max Delta: <strong className="mono-text" style={{ color: "var(--text-main)" }}>{Math.round(max_delta * 100)}%</strong></span>
        </div>
      </div>

      {/* Active Module Suspicion Comparison Bars */}
      {activeMods.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Module Suspicion Levels
          </span>

          {activeMods.map((m) => {
            const pct = Math.round(m.suspicion * 100);
            const barColor = pct >= 50 ? "var(--color-fake)" : (pct >= 30 ? "var(--color-inconclusive)" : "var(--color-real)");
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{m.name}</span>
                  <span className="mono-text" style={{ color: barColor, fontWeight: 700 }}>{pct}% Suspicion</span>
                </div>
                <div style={{ width: "100%", height: "5px", background: "var(--bg-surface-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(4, pct)}%`, height: "100%", background: barColor, borderRadius: "3px", transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action: Ask AI about Model Disagreement */}
      {onAskAi && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => onAskAi("Why do the forensic models agree or disagree on this media? Which module showed the highest suspicion?")}
            className="btn-secondary"
            style={{ fontSize: "0.78rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <MessageSquare size={13} color="var(--color-primary)" />
            Ask AI About Model Disagreement
          </button>
        </div>
      )}

    </div>
  );
};
