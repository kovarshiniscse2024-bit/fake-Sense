import React, { useState } from "react";
import { Radar, X } from "lucide-react";

export const ForensicRiskRadar = ({ riskRadar, modules = {}, onAskAi }) => {
  const [selectedDimension, setSelectedDimension] = useState(null);

  if (!riskRadar) return null;

  const getDimensionStatusConfig = (val) => {
    switch (val) {
      case "NORMAL":
      case "VERIFIED":
      case "SYNCHRONIZED":
      case "HIGH":
        return { color: "var(--color-real)", bg: "var(--color-real-bg)", border: "var(--color-real-border)" };
      case "NEUTRAL":
      case "MODERATE":
        return { color: "var(--color-primary)", bg: "var(--color-primary-light)", border: "var(--color-primary-border)" };
      case "SUSPICIOUS":
      case "MODERATE INCONSISTENCY":
        return { color: "var(--color-inconclusive)", bg: "var(--color-inconclusive-bg)", border: "var(--color-inconclusive-border)" };
      case "ANOMALOUS":
      case "SEVERE ANOMALY":
      case "TAMPERED":
      case "LIMITED":
        return { color: "var(--color-fake)", bg: "var(--color-fake-bg)", border: "var(--color-fake-border)" };
      case "NOT APPLICABLE":
      default:
        return { color: "var(--text-muted)", bg: "var(--bg-surface-secondary)", border: "var(--border-subtle)" };
    }
  };

  const dimensions = [
    {
      id: "visual",
      label: "Visual Integrity",
      value: riskRadar.visual_integrity || "NORMAL",
      analyzed: "Photo-Response Non-Uniformity (PRNU) sensor noise residual covariance, 2D FFT spectral decay, and JPEG Error Level Analysis.",
      evidence: modules.visual_cnn?.details || "Sensor noise and high-frequency spectral patterns conform to camera baseline.",
      limitations: "Heavy social media re-compression can degrade high-frequency pixel grain."
    },
    {
      id: "facial",
      label: "Facial Consistency",
      value: riskRadar.facial_consistency || "NOT APPLICABLE",
      analyzed: "Sobel facial boundary edge gradient discontinuities, YCrCb color temperature covariance vs background, and bilateral symmetry.",
      evidence: modules.face_analysis?.details || (riskRadar.facial_consistency === "NOT APPLICABLE" ? "No facial bounding boxes detected in media." : "Facial gradient continuity evaluated."),
      limitations: "Extreme side angles and strong directional stage lighting can induce natural color differentials."
    },
    {
      id: "metadata",
      label: "Metadata Integrity",
      value: riskRadar.metadata_integrity || "NEUTRAL",
      analyzed: "EXIF camera hardware provenance tags, timestamp chronology, and digital editing software markers.",
      evidence: modules.metadata?.details || "Inspected EXIF headers and container metadata.",
      limitations: "Web platforms (WhatsApp, Twitter) routinely strip metadata headers during transit."
    },
    {
      id: "audio_visual",
      label: "Audio-Visual Consistency",
      value: riskRadar.audio_visual_consistency || "NOT APPLICABLE",
      analyzed: "Speech phoneme to visual viseme lip-movement synchronization and acoustic spectrogram analysis.",
      evidence: modules.audio_visual_sync?.details || "Only applicable to video media with active audio tracks.",
      limitations: "Audio track compression or variable framerate video can induce slight temporal offset."
    },
    {
      id: "quality",
      label: "Overall Evidence Quality",
      value: riskRadar.evidence_quality || "HIGH",
      analyzed: "Multi-module signal coverage factor and inter-module variance penalty weighting.",
      evidence: "Composite confidence calculated from active sensor availability and signal agreement.",
      limitations: "Evaluates statistical probabilities based on currently available forensic modules."
    }
  ];

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "20px 24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)"
          }}>
            <Radar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Forensic Risk Radar
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Multi-dimensional qualitative integrity evaluation across active forensic vectors
            </p>
          </div>
        </div>

        <span className="badge badge-blue" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
          5 Qualitative Vectors
        </span>
      </div>

      {/* Dimensional Radar Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "10px",
        marginTop: "8px"
      }}>
        {dimensions.map((dim) => {
          const cfg = getDimensionStatusConfig(dim.value);
          return (
            <div
              key={dim.id}
              onClick={() => setSelectedDimension(dim)}
              className="saas-card glass-card-interactive"
              style={{
                padding: "14px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "6px"
              }}
            >
              <div>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 500 }}>
                  {dim.label}
                </span>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: cfg.color,
                    display: "inline-block"
                  }}
                >
                  {dim.value}
                </span>
              </div>

              <span style={{ fontSize: "0.72rem", color: "var(--color-primary)", marginTop: "2px", fontWeight: 600 }}>
                Inspect Details →
              </span>
            </div>
          );
        })}
      </div>

      {/* Dimension Detail Modal */}
      {selectedDimension && (
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
          onClick={() => setSelectedDimension(null)}
        >
          <div
            className="saas-card animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-surface)",
              borderRadius: "14px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "var(--shadow-xl)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                  {selectedDimension.label}
                </h3>
                <span style={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: getDimensionStatusConfig(selectedDimension.value).color,
                  marginTop: "2px",
                  display: "inline-block"
                }}>
                  Rating: {selectedDimension.value}
                </span>
              </div>
              <button
                onClick={() => setSelectedDimension(null)}
                className="btn-secondary"
                style={{ padding: "4px 8px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              <div style={{ padding: "10px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: 700, color: "var(--color-primary)", display: "block", marginBottom: "3px" }}>
                  What Was Analyzed:
                </span>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.82rem" }}>
                  {selectedDimension.analyzed}
                </p>
              </div>

              <div style={{ padding: "10px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: 700, color: "var(--color-primary)", display: "block", marginBottom: "3px" }}>
                  Forensic Observation:
                </span>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.82rem" }}>
                  {selectedDimension.evidence}
                </p>
              </div>

              <div style={{ padding: "10px 14px", background: "var(--color-inconclusive-bg)", borderRadius: "8px", border: "1px solid var(--color-inconclusive-border)" }}>
                <span style={{ fontWeight: 700, color: "var(--color-inconclusive)", display: "block", marginBottom: "3px" }}>
                  Forensic Limitations:
                </span>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.82rem" }}>
                  {selectedDimension.limitations}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              {onAskAi && (
                <button
                  onClick={() => {
                    const promptText = `Explain the ${selectedDimension.label} evaluation (${selectedDimension.value}). What does this mean for the verification result?`;
                    setSelectedDimension(null);
                    onAskAi(promptText);
                  }}
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", padding: "7px 14px" }}
                >
                  Ask AI About This Vector
                </button>
              )}
              <button
                onClick={() => setSelectedDimension(null)}
                className="btn-secondary"
                style={{ fontSize: "0.82rem", padding: "7px 14px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
