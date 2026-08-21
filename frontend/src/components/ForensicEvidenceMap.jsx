import React, { useState } from "react";
import {
  UploadCloud,
  Eye,
  Smile,
  FileCode,
  Volume2,
  Cpu,
  Gauge,
  Layers,
  ArrowRight,
  X
} from "lucide-react";

export const ForensicEvidenceMap = ({ result, onAskAi }) => {
  const [selectedModule, setSelectedModule] = useState(null);

  if (!result) return null;

  const { media_type, modules = {}, verdict, authenticity_score, confidence } = result;

  const vis = modules.visual_cnn || {};
  const face = modules.face_analysis || {};
  const meta = modules.metadata || {};
  const sync = modules.audio_visual_sync || {};

  // Build list of active applicable pipeline nodes
  const pipelineNodes = [
    {
      id: "input",
      title: "Uploaded Media",
      type: "source",
      icon: UploadCloud,
      status: "Verified Input",
      badgeClass: "badge-blue",
      summary: `${result.file_name} (${media_type?.toUpperCase()})`,
      details: `Target media format validated and preprocessed into normalized inspection frames.`
    },
    {
      id: "visual_cnn",
      title: "Visual / CNN Analysis",
      type: "module",
      icon: Eye,
      status: vis.status === "completed" ? (vis.suspicion_score >= 0.45 ? "Suspicious Noise" : "Normal Sensor Pattern") : (vis.status || "Completed"),
      badgeClass: vis.suspicion_score >= 0.45 ? "badge-manipulated" : "badge-real",
      suspicion: vis.suspicion_score,
      summary: vis.details || "Photo-Response Non-Uniformity (PRNU) & 2D FFT spectral decay analyzed.",
      evidence: vis.result,
      analyzed: "High-frequency Fourier transform spectral power, Error Level Analysis (ELA) block compression, and PRNU sensor noise covariance across Bayer RGB channels.",
      limitations: "Heavy repeated compression on social media can degrade sensor noise grain."
    },
    {
      id: "face_analysis",
      title: "Facial Region Analysis",
      type: "module",
      icon: Smile,
      status: face.status === "completed" ? (face.suspicion_score >= 0.45 ? "Boundary Inconsistency" : "Continuous Geometry") : (face.status === "skipped" ? "No Faces Detected" : (face.status || "Completed")),
      badgeClass: face.status === "skipped" ? "badge-gray" : (face.suspicion_score >= 0.45 ? "badge-manipulated" : "badge-real"),
      suspicion: face.suspicion_score,
      summary: face.details || "Evaluates Sobel facial perimeter gradients, bilateral symmetry, and skin texture continuity.",
      evidence: face.result,
      analyzed: "Boundary blending gradients around detected facial bounding box, color temperature consistency between face ROI and background, and Laplacian skin texture variance.",
      limitations: "Extreme side-profile angles or harsh single-point studio lighting can create natural color contrasts."
    },
  ];

  // If video, include audio-visual sync
  if (media_type === "video") {
    pipelineNodes.push({
      id: "audio_visual_sync",
      title: "Audio-Visual Analysis",
      type: "module",
      icon: Volume2,
      status: sync.status === "completed" ? (sync.suspicion_score >= 0.45 ? "Sync Disparity" : "Audio-Visual Aligned") : "Not Applicable",
      badgeClass: sync.status === "completed" ? (sync.suspicion_score >= 0.45 ? "badge-manipulated" : "badge-real") : "badge-gray",
      suspicion: sync.suspicion_score,
      summary: sync.details || "Speech waveform to visual lip-movement cross-correlation.",
      evidence: sync.result,
      analyzed: "Phoneme to viseme temporal alignment and audio track spectrogram continuity.",
      limitations: "Low framerate video or asynchronous network recording can induce slight delay."
    });
  }

  // Metadata module
  pipelineNodes.push({
    id: "metadata",
    title: "Metadata Analysis",
    type: "module",
    icon: FileCode,
    status: meta.metrics?.provenance_verified ? "Hardware Verified" : (meta.suspicion_score >= 0.50 ? "Software Modified" : "Web Container (Neutral)"),
    badgeClass: meta.metrics?.provenance_verified ? "badge-real" : (meta.suspicion_score >= 0.50 ? "badge-manipulated" : "badge-inconclusive"),
    suspicion: meta.suspicion_score,
    summary: meta.details || "EXIF camera tag validation and software editing signature detection.",
    evidence: meta.result,
    analyzed: "TIFF/EXIF metadata headers, camera model tags, timestamp continuity, and known generative AI tool signatures.",
    limitations: "Social media transit routinely strips EXIF metadata for user privacy."
  });

  // Evidence Aggregation node
  pipelineNodes.push({
    id: "aggregation",
    title: "Evidence Aggregation",
    type: "synthesis",
    icon: Cpu,
    status: "Dynamic Fusion",
    badgeClass: "badge-purple",
    summary: `Dynamically weighted multi-signal aggregation across ${pipelineNodes.length - 1} evidence streams.`,
    details: "Combines active signal suspicion scores using coverage-weighted normalization and localized peak anomaly penalties."
  });

  // Final Verdict node
  pipelineNodes.push({
    id: "verdict",
    title: "Verdict Synthesis",
    type: "verdict",
    icon: Gauge,
    status: verdict,
    badgeClass: verdict === "Likely Real" ? "badge-real" : (verdict === "Likely Manipulated" ? "badge-manipulated" : "badge-inconclusive"),
    summary: `Authenticity Score: ${authenticity_score}% | Confidence: ${Math.round((confidence || 0.85) * 100)}%`,
    details: `Final probabilistic determination grounded on multi-module evidence convergence.`
  });

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "24px" }}>
      
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)"
          }}>
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Forensic Evidence Map
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Visual pipeline showing how independent forensic signals connect to the final verdict
            </p>
          </div>
        </div>

        <span className="badge badge-blue" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
          {pipelineNodes.length} Nodes Evaluated
        </span>
      </div>

      {/* Interactive Pipeline Map Flow */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
        marginTop: "10px"
      }}>
        {pipelineNodes.map((node) => {
          const IconComp = node.icon;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedModule(node)}
              className="saas-card glass-card-interactive"
              style={{
                padding: "16px",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{
                    padding: "6px",
                    borderRadius: "6px",
                    background: "var(--bg-surface-secondary)",
                    color: "var(--color-primary)",
                    display: "flex"
                  }}>
                    <IconComp size={15} />
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {node.title}
                  </span>
                </div>

                <div style={{ marginBottom: "6px" }}>
                  <span className={`badge ${node.badgeClass}`} style={{ fontSize: "0.68rem" }}>
                    {node.status}
                  </span>
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                  {node.summary}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "var(--color-primary)", fontWeight: 600 }}>
                <span>Inspect Evidence →</span>
                {node.suspicion !== undefined && node.suspicion !== null && (
                  <span className="mono-text" style={{ color: "var(--text-main)", fontWeight: 700 }}>
                    {Math.round(node.suspicion * 100)}% Suspicion
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Forensic Node Inspection Modal */}
      {selectedModule && (
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
          onClick={() => setSelectedModule(null)}
        >
          <div
            className="saas-card animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "560px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  padding: "8px",
                  borderRadius: "8px",
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  display: "flex"
                }}>
                  {React.createElement(selectedModule.icon, { size: 18 })}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                    {selectedModule.title}
                  </h3>
                  <span className={`badge ${selectedModule.badgeClass}`} style={{ fontSize: "0.68rem", marginTop: "2px" }}>
                    Status: {selectedModule.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
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
                  {selectedModule.analyzed || selectedModule.details || selectedModule.summary}
                </p>
              </div>

              <div style={{ padding: "10px 14px", background: "var(--bg-surface-secondary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: 700, color: "var(--color-primary)", display: "block", marginBottom: "3px" }}>
                  Forensic Observation:
                </span>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.82rem" }}>
                  {selectedModule.summary}
                </p>
              </div>

              {selectedModule.limitations && (
                <div style={{ padding: "10px 14px", background: "var(--color-inconclusive-bg)", borderRadius: "8px", border: "1px solid var(--color-inconclusive-border)" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-inconclusive)", display: "block", marginBottom: "3px" }}>
                    Forensic Limitations:
                  </span>
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.82rem" }}>
                    {selectedModule.limitations}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              {onAskAi && (
                <button
                  onClick={() => {
                    const promptText = `Explain the ${selectedModule.title} result in detail. How did it affect the ${verdict} verdict?`;
                    setSelectedModule(null);
                    onAskAi(promptText);
                  }}
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", padding: "7px 14px" }}
                >
                  Ask AI About This Module
                </button>
              )}
              <button
                onClick={() => setSelectedModule(null)}
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
