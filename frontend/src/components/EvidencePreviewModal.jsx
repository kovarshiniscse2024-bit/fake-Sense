import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
  X,
  Download,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Layers,
  HardDrive,
  Copy,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  Eye,
  Smile,
  FileCode,
  Volume2
} from "lucide-react";

export const EvidencePreviewModal = ({ item, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const navigate = useNavigate();

  if (!item) return null;

  const isVideo = item.media_type === "video";
  const mediaUrl = api.media.getMediaUrl(item.id);
  const thumbUrl = api.media.getThumbnailUrl(item.id);

  const handleCopyId = () => {
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await api.report.downloadReport(item.id);
    } catch (err) {
      alert("Failed to download PDF report: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Standard Size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getVerdictBadge = (verdict) => {
    if (verdict === "Likely AI-Generated") {
      return (
        <span className="badge badge-ai" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
          <ShieldAlert size={14} style={{ marginRight: "4px" }} /> Likely AI-Generated
        </span>
      );
    }
    if (verdict === "Likely Authentic" || verdict === "Likely Real") {
      return (
        <span className="badge badge-real" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
          <ShieldCheck size={14} style={{ marginRight: "4px" }} /> Likely Authentic
        </span>
      );
    }
    if (verdict === "Likely Manipulated") {
      return (
        <span className="badge badge-manipulated" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
          <ShieldAlert size={14} style={{ marginRight: "4px" }} /> Likely Manipulated
        </span>
      );
    }
    return (
      <span className="badge badge-inconclusive" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
        <AlertTriangle size={14} style={{ marginRight: "4px" }} /> Inconclusive
      </span>
    );
  };

  const modules = item.modules || {};
  const vis = modules.visual_cnn || {};
  const face = modules.face_analysis || {};
  const meta = modules.metadata || {};
  const sync = modules.audio_visual_sync || {};

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        className="saas-card"
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--border-subtle)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-blue" style={{ fontSize: "0.72rem" }}>
                {isVideo ? "VIDEO EVIDENCE" : "IMAGE ARTIFACT"}
              </span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                {item.file_name}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span className="mono-text">ID: {item.id}</span>
              <button
                onClick={handleCopyId}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--color-primary)" }}
                title="Copy ID"
              >
                {copied ? <Check size={13} color="var(--color-real)" /> : <Copy size={13} />}
              </button>
              <span>•</span>
              <span>Verified on {new Date(item.created_at).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "var(--bg-surface-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "6px",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex"
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Left Large Media + Right Forensic Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          
          {/* Left Media Container */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                width: "100%",
                height: "340px",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#0b1329",
                border: "1px solid #1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {mediaError ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                  {isVideo ? <VideoIcon size={40} style={{ margin: "0 auto 8px auto" }} /> : <ImageIcon size={40} style={{ margin: "0 auto 8px auto" }} />}
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>Preview Unavailable</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>File was verified in a prior session or pruned.</div>
                </div>
              ) : isVideo ? (
                <video
                  controls
                  poster={thumbUrl}
                  src={mediaUrl}
                  onError={() => setMediaError(true)}
                  style={{ maxWidth: "100%", maxHeight: "340px", display: "block" }}
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={mediaUrl}
                  alt={item.file_name}
                  onError={(e) => {
                    if (e.target.src !== thumbUrl) {
                      e.target.src = thumbUrl;
                    } else {
                      setMediaError(true);
                    }
                  }}
                  style={{ maxWidth: "100%", maxHeight: "340px", objectFit: "contain", display: "block" }}
                />
              )}
            </div>

            {/* Technical Metadata Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              background: "var(--bg-surface-secondary)",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.78rem"
            }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Resolution: </span>
                <span className="mono-text" style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {item.width && item.height ? `${item.width}×${item.height} px` : "Standard Resolution"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>File Size: </span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{formatFileSize(item.file_size)}</span>
              </div>
            </div>
          </div>

          {/* Right Forensic Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Verdict & Score Banner */}
            <div style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "var(--bg-surface-secondary)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Verification Verdict
                </div>
                <div style={{ marginTop: "4px" }}>
                  {getVerdictBadge(item.verdict)}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Authenticity Score</div>
                <div className="mono-text" style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {item.authenticity_score}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-primary)", fontWeight: 600 }}>
                  {Math.round(item.confidence * 100)}% Confidence
                </div>
              </div>
            </div>

            {/* Evidence Signals List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Forensic Signal Breakdown
              </div>

              {/* Visual / CNN */}
              <div style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Eye size={13} color="var(--color-primary)" /> Visual / CNN Analysis
                  </span>
                  <span style={{ color: vis.suspicion_score >= 0.5 ? "var(--color-fake)" : "var(--color-real)", fontWeight: 700 }}>
                    {vis.result ? vis.result.replace("_", " ").toUpperCase() : (vis.status || "Completed")}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {vis.details || "Analyzes sensor pattern noise, ELA compression, and spectral decay."}
                </div>
              </div>

              {/* Face Analysis */}
              <div style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Smile size={13} color="var(--color-primary)" /> Facial Region Analysis
                  </span>
                  <span style={{ color: face.status === "skipped" ? "var(--text-muted)" : (face.suspicion_score >= 0.5 ? "var(--color-fake)" : "var(--color-real)"), fontWeight: 700 }}>
                    {face.status === "skipped" ? "No Faces Detected" : (face.result ? face.result.replace("_", " ").toUpperCase() : (face.status || "Completed"))}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {face.details || "Evaluates facial boundary blending, lighting gradients, and skin texture."}
                </div>
              </div>

              {/* Metadata */}
              <div style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <FileCode size={13} color="var(--color-primary)" /> Metadata & Headers
                  </span>
                  <span style={{ color: meta.suspicion_score >= 0.5 ? "var(--color-fake)" : "var(--color-real)", fontWeight: 700 }}>
                    {meta.result ? meta.result.replace("_", " ").toUpperCase() : (meta.status || "Completed")}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {meta.details || "Validates EXIF container headers and AI editor footprints."}
                </div>
              </div>

              {/* Audio Visual Sync (if video) */}
              {isVideo && (
                <div style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Volume2 size={13} color="var(--color-primary)" /> Audio-Visual Alignment
                    </span>
                    <span style={{ color: sync.suspicion_score >= 0.5 ? "var(--color-fake)" : "var(--color-real)", fontWeight: 700 }}>
                      {sync.status === "completed" ? (sync.result || "Aligned").toUpperCase() : "Not Applicable"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {sync.details || "Cross-correlates audio track phonemes with visual lip motion."}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Action Buttons Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px", flexWrap: "wrap" }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            <Download size={14} /> {downloading ? "Downloading..." : "Download Report"}
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(`/result?id=${item.id}`);
            }}
            className="btn-primary"
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            <ExternalLink size={14} /> Open Full Result
          </button>
        </div>

      </div>
    </div>
  );
};
