import React, { useState } from "react";
import { EvidenceDetailModal } from "./EvidenceDetailModal";
import { api } from "../services/api";
import {
  Layers,
  ScanLine,
  Info,
  Image as ImageIcon,
  Video as VideoIcon,
  SearchCode
} from "lucide-react";

export const EvidenceExplorer = ({ result, onAskAiAboutEvidence }) => {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [mediaError, setMediaError] = useState(false);

  const evidenceList = result?.evidence || [];
  const fileName = result?.file_name || "Media";
  const isVideo = result?.media_type === "video";
  const mediaUrl = result?.verification_id ? api.media.getMediaUrl(result.verification_id) : null;
  const thumbUrl = result?.verification_id ? api.media.getThumbnailUrl(result.verification_id) : null;

  // Collect genuine localized regions if any
  const localizedBoxes = [];
  evidenceList.forEach((ev) => {
    if (typeof ev === "object" && ev.localization?.available && ev.localization?.boxes) {
      ev.localization.boxes.forEach((box) => {
        localizedBoxes.push({
          ...box,
          evidenceRef: ev,
        });
      });
    }
  });

  const hasLocalization = localizedBoxes.length > 0;

  const getSeverityBadge = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "high":
        return <span className="badge badge-manipulated" style={{ fontSize: "0.68rem" }}>High Anomaly</span>;
      case "medium":
        return <span className="badge badge-inconclusive" style={{ fontSize: "0.68rem" }}>Medium</span>;
      case "low":
        return <span className="badge badge-inconclusive" style={{ fontSize: "0.68rem" }}>Low</span>;
      default:
        return <span className="badge badge-real" style={{ fontSize: "0.68rem" }}>Normal</span>;
    }
  };

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header with Title and Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex"
          }}>
            <ScanLine size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Visual Evidence Explorer
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Side-by-side artifact inspection with detected signal evidence
            </p>
          </div>
        </div>

        {/* Severity Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-surface-secondary)", padding: "4px 12px", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.72rem" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>LEGEND:</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-fake)", fontWeight: 600 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-fake)" }} /> High
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-inconclusive)", fontWeight: 600 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-inconclusive)" }} /> Medium
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-real)", fontWeight: 600 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-real)" }} /> Normal
          </span>
        </div>
      </div>

      {/* Grid: Actual Media Visual Preview & Interactive Evidence List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* Left: Actual Media Visual Representation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "260px",
              background: "#0b1329",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mediaError || !mediaUrl ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                <Layers size={36} color="var(--color-primary)" style={{ opacity: 0.85, margin: "0 auto 8px auto" }} />
                <div className="mono-text" style={{ fontSize: "0.82rem", color: "#f8fafc", fontWeight: 600 }}>{fileName}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>Preview Unavailable</div>
              </div>
            ) : isVideo ? (
              <video
                controls
                poster={thumbUrl}
                src={mediaUrl}
                onError={() => setMediaError(true)}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={fileName}
                onError={(e) => {
                  if (e.target.src !== thumbUrl) {
                    e.target.src = thumbUrl;
                  } else {
                    setMediaError(true);
                  }
                }}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            )}
          </div>

          {/* Localization Transparency Notice */}
          <div style={{
            padding: "8px 12px",
            background: "var(--bg-surface-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "6px",
            fontSize: "0.76rem",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <Info size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              {hasLocalization
                ? "Visual bounding-box overlay extracted from validated facial detection boundary seams."
                : "Regional localization is not available for this verification."}
            </span>
          </div>
        </div>

        {/* Right: Interactive Evidence Item Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Detected Evidence Signals ({evidenceList.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
            {evidenceList.length > 0 ? (
              evidenceList.map((ev, index) => {
                const isObj = typeof ev === "object";
                const type = isObj ? ev.type || ev.source : "Forensic Signal";
                const finding = isObj ? ev.finding : ev;
                const severity = isObj ? ev.severity : "medium";
                const details = isObj ? ev.details : "";

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedEvidence({ ...ev, id: ev.id || `ev-${index}`, title: type, finding, severity, details })}
                    className="saas-card glass-card-interactive"
                    style={{
                      padding: "10px 14px",
                      background: "var(--bg-surface-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-main)" }}>
                          {type}
                        </span>
                        {getSeverityBadge(severity)}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {finding}
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.72rem", color: "var(--color-primary)", flexShrink: 0 }}
                    >
                      Inspect →
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", background: "var(--bg-surface-secondary)", borderRadius: "8px" }}>
                All analyzed media features conform to standard photographic baseline distributions.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Dialog for Evidence Item Inspection */}
      {selectedEvidence && (
        <EvidenceDetailModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          onAskAi={onAskAiAboutEvidence}
        />
      )}

    </div>
  );
};
