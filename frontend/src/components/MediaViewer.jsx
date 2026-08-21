import React, { useState } from "react";
import { api } from "../services/api";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Maximize2,
  Copy,
  Check,
  FileCheck2,
  HardDrive,
  Clock,
  Layers
} from "lucide-react";

export const MediaViewer = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!result) return null;

  const isVideo = result.media_type === "video";
  const mediaUrl = api.media.getMediaUrl(result.verification_id);
  const thumbUrl = api.media.getThumbnailUrl(result.verification_id);

  const handleCopyId = () => {
    navigator.clipboard.writeText(result.verification_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Standard Size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="saas-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            padding: "6px",
            borderRadius: "6px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex"
          }}>
            {isVideo ? <VideoIcon size={18} /> : <ImageIcon size={18} />}
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Analyzed Target Media
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "1px 0 0 0" }}>
              Original visual artifact submitted for multi-signal digital forensics
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="badge badge-blue" style={{ fontSize: "0.72rem" }}>
            {isVideo ? "VIDEO STREAM" : "IMAGE ARTIFACT"}
          </span>
          <button
            onClick={handleCopyId}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: "0.74rem" }}
            title="Copy Verification ID"
          >
            {copied ? <Check size={12} color="var(--color-real)" /> : <Copy size={12} />}
            <span className="mono-text">{result.verification_id}</span>
          </button>
        </div>
      </div>

      {/* Prominent Media Display Container */}
      <div style={{
        width: "100%",
        maxHeight: "440px",
        minHeight: "220px",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#0b1329",
        border: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)"
      }}>
        {loadError ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
            {isVideo ? <VideoIcon size={36} style={{ margin: "0 auto 8px auto" }} /> : <ImageIcon size={36} style={{ margin: "0 auto 8px auto" }} />}
            <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#f8fafc" }}>Preview Unavailable</p>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
              Media artifact is cached securely or was verified in a prior session.
            </p>
          </div>
        ) : isVideo ? (
          <video
            controls
            poster={thumbUrl}
            src={mediaUrl}
            onError={() => setLoadError(true)}
            style={{
              maxWidth: "100%",
              maxHeight: "440px",
              borderRadius: "8px",
              display: "block"
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={mediaUrl}
            alt={result.file_name}
            onError={(e) => {
              // Try fallback to thumbnail if full media url errored
              if (e.target.src !== thumbUrl) {
                e.target.src = thumbUrl;
              } else {
                setLoadError(true);
              }
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "440px",
              objectFit: "contain",
              display: "block"
            }}
          />
        )}
      </div>

      {/* Technical Specifications Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "10px",
        background: "var(--bg-surface-secondary)",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid var(--border-subtle)",
        fontSize: "0.82rem"
      }}>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileCheck2 size={12} /> Target File Name
          </div>
          <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={result.file_name}>
            {result.file_name}
          </div>
        </div>

        <div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <Layers size={12} /> Dimensions / Resolution
          </div>
          <div className="mono-text" style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>
            {result.width && result.height ? `${result.width} × ${result.height} px` : "Standard Resolution"}
          </div>
        </div>

        <div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <HardDrive size={12} /> File Size & Type
          </div>
          <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>
            {formatFileSize(result.file_size)} • <span style={{ textTransform: "uppercase" }}>{result.mime_type?.split("/")[1] || result.media_type}</span>
          </div>
        </div>

        {isVideo && (
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} /> Duration
            </div>
            <div className="mono-text" style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>
              {result.duration ? `${result.duration.toFixed(1)}s` : "Stream Track"}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
