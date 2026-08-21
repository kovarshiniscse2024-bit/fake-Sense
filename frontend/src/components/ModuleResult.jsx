import React from "react";
import { Eye, UserCheck, Mic, FileCode, CheckCircle, AlertCircle, MinusCircle, AlertTriangle } from "lucide-react";

export const ModuleResult = ({ modules = {} }) => {
  const moduleConfigs = [
    {
      key: "visual_cnn",
      name: "Visual / CNN Analysis",
      icon: Eye,
      weight: "40% Weight",
      desc: "Analyzes Error Level Analysis (ELA), DCT frequency domain energy, and noise grain.",
    },
    {
      key: "face_analysis",
      name: "Facial Region Analysis",
      icon: UserCheck,
      weight: "25% Weight",
      desc: "Inspects boundary blending seams, color consistency, and facial landmark integrity.",
    },
    {
      key: "audio_visual_sync",
      name: "Audio-Visual Synchronization",
      icon: Mic,
      weight: "25% Weight",
      desc: "Cross-correlates mouth optical flow motion with audio speech envelope dynamics.",
    },
    {
      key: "metadata",
      name: "Metadata & Header Inspection",
      icon: FileCode,
      weight: "10% Weight",
      desc: "Scans EXIF camera hardware tags, quantization tables, and editing signatures.",
    },
  ];

  const getStatusBadge = (status, score) => {
    if (status === "skipped" || status === "not_applicable") {
      return <span className="badge badge-gray"><MinusCircle size={12} /> Skipped</span>;
    }
    if (status === "failed") {
      return <span className="badge badge-manipulated"><AlertTriangle size={12} /> Failed</span>;
    }
    if (score !== null && score !== undefined) {
      if (score >= 0.60) {
        return <span className="badge badge-manipulated"><AlertCircle size={12} /> Suspicious ({Math.round(score * 100)}%)</span>;
      }
      if (score >= 0.35) {
        return <span className="badge badge-inconclusive"><AlertCircle size={12} /> Moderate ({Math.round(score * 100)}%)</span>;
      }
      return <span className="badge badge-real"><CheckCircle size={12} /> Normal ({Math.round(score * 100)}%)</span>;
    }
    return <span className="badge badge-real"><CheckCircle size={12} /> Completed</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
        Multi-Signal Forensic Modules
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
        {moduleConfigs.map((cfg) => {
          const mod = modules[cfg.key] || { status: "not_applicable", details: "Module not executed." };
          const Icon = cfg.icon;
          const score = mod.suspicion_score;

          return (
            <div key={cfg.key} className="saas-card" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      padding: "6px",
                      borderRadius: "6px",
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary)"
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                        {cfg.name}
                      </h4>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {cfg.weight}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(mod.status, score)}
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: "6px 0 0 0" }}>
                  {mod.details || cfg.desc}
                </p>
              </div>

              {score !== null && score !== undefined && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                    <span>Suspicion Level</span>
                    <span className="mono-text" style={{ fontWeight: 700, color: score > 0.5 ? "var(--color-fake)" : "var(--color-real)" }}>
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "var(--bg-surface-secondary)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${score * 100}%`,
                      background: score > 0.5 ? "var(--color-fake)" : "var(--color-real)",
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
