import React, { useState, useEffect } from "react";
import { Trash2, FileCheck, Sparkles } from "lucide-react";

export const MediaPreview = ({ file, onRemove, onVerify, isVerifying }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileCheck size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Selected Media File</h3>
        </div>
        <button
          onClick={onRemove}
          className="btn-secondary"
          disabled={isVerifying}
          style={{ padding: "6px 12px", fontSize: "0.8rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>

      {/* Media Player / Image Display */}
      <div style={{
        background: "#0f172a",
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maxHeight: "360px",
        marginBottom: "16px",
        border: "1px solid var(--border-subtle)",
        position: "relative",
      }}>
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            autoPlay
            muted
            loop
            style={{ width: "100%", maxHeight: "360px", objectFit: "contain" }}
          />
        ) : (
          <img
            src={previewUrl}
            alt="Selected preview"
            style={{ width: "100%", maxHeight: "360px", objectFit: "contain" }}
          />
        )}
      </div>

      {/* Media Details Chips */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
        padding: "12px 16px",
        background: "var(--bg-surface-secondary)",
        borderRadius: "8px",
        marginBottom: "18px",
        border: "1px solid var(--border-subtle)",
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>File: </span>
          <span className="mono-text" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            {file.name}
          </span>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Type: </span>
          <span className="badge badge-blue" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
            {isVideo ? "Video / MP4" : "Image / " + file.type.split("/")[1]?.toUpperCase()}
          </span>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Size: </span>
          <span className="mono-text" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className="btn-primary"
          style={{ width: "100%", padding: "12px 24px", fontSize: "0.95rem" }}
        >
          <Sparkles size={16} />
          {isVerifying ? "Verification in Progress..." : "Start AI Verification"}
        </button>
      </div>

    </div>
  );
};
