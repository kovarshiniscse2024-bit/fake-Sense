import React from "react";
import { CheckCircle2, Loader2, Circle, Cpu } from "lucide-react";

export const STAGES = [
  { id: "validation", label: "File validation", desc: "Validating headers, MIME types, and file integrity" },
  { id: "preprocessing", label: "Media preprocessing", desc: "Normalizing dimensions, extracting frames, scanning audio" },
  { id: "face_detection", label: "Face detection", desc: "Locating facial bounding boxes and landmark structures" },
  { id: "visual_cnn", label: "Visual / CNN analysis", desc: "Scanning ELA compression error levels and DCT frequency anomalies" },
  { id: "av_sync", label: "Audio-visual analysis", desc: "Cross-correlating lip phoneme optical flow with audio envelope" },
  { id: "metadata", label: "Metadata analysis", desc: "Inspecting EXIF tags, camera hardware, and software markers" },
  { id: "aggregation", label: "Evidence aggregation", desc: "Normalizing module weights and cross-module anomaly checks" },
  { id: "scoring", label: "Final scoring & verdict", desc: "Calculating authenticity index, confidence, and human explanation" },
];

export const ProgressSteps = ({ currentStageIndex = 0 }) => {
  return (
    <div className="saas-card animate-fade-in" style={{ padding: "32px 28px", maxWidth: "640px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          padding: "8px",
          borderRadius: "8px",
          background: "var(--color-primary-light)",
          color: "var(--color-primary)"
        }}>
          <Cpu size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-main)", margin: 0 }}>
            Verification in Progress
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Evaluating multi-signal media integrity pipeline
          </p>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{
        height: "5px",
        background: "var(--bg-surface-secondary)",
        borderRadius: "3px",
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        <div style={{
          height: "100%",
          width: `${Math.min(100, ((currentStageIndex + 1) / STAGES.length) * 100)}%`,
          background: "var(--color-primary)",
          transition: "width 0.3s ease",
        }} />
      </div>

      {/* Stage Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div
              key={stage.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: isCurrent ? "var(--color-primary-light)" : "transparent",
                border: isCurrent ? "1px solid var(--color-primary-border)" : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ marginTop: "2px" }}>
                {isDone && <CheckCircle2 size={18} color="var(--color-real)" />}
                {isCurrent && <Loader2 size={18} color="var(--color-primary)" style={{ animation: "spin 1s linear infinite" }} />}
                {isPending && <Circle size={18} color="var(--text-faint)" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "0.88rem",
                  fontWeight: isCurrent ? 700 : (isDone ? 600 : 500),
                  color: isDone ? "var(--text-main)" : (isCurrent ? "var(--color-primary)" : "var(--text-faint)"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span>{stage.label}</span>
                  {isCurrent && (
                    <span className="badge badge-blue" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                      Processing
                    </span>
                  )}
                  {isDone && (
                    <span className="badge badge-real" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                      Completed
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", color: isCurrent ? "var(--text-secondary)" : "var(--text-muted)", marginTop: "1px" }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
