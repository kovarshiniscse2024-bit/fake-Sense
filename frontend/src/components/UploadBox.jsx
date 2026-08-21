import React, { useState, useRef } from "react";
import { UploadCloud, FileImage, FileVideo, AlertCircle } from "lucide-react";

export const UploadBox = ({ onFileSelect, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    const validExtensions = [".jpg", ".jpeg", ".png", ".mp4", ".mov", ".avi"];
    const ext = "." + file.name.split(".").pop().toLowerCase();

    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported format '${ext}'. Please upload JPG, PNG, or MP4.`);
      return;
    }

    const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".avi";
    const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMsg(`File size exceeds limit (${isVideo ? "100MB for video" : "50MB for image"}).`);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Clean Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className="saas-card"
        style={{
          border: isDragOver ? "2px dashed var(--color-primary)" : "2px dashed var(--border-strong)",
          background: isDragOver ? "var(--color-primary-light)" : "var(--bg-surface)",
          borderRadius: "14px",
          padding: "48px 24px",
          textAlign: "center",
          cursor: isProcessing ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: isDragOver ? "var(--shadow-md)" : "var(--shadow-sm)"
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".jpg,.jpeg,.png,.mp4,.mov,.avi"
          style={{ display: "none" }}
          disabled={isProcessing}
        />

        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          background: "var(--color-primary-light)",
          border: "1px solid var(--color-primary-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px auto",
        }}>
          <UploadCloud size={28} color="var(--color-primary)" />
        </div>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px", color: "var(--text-main)" }}>
          Drag and drop your media file here
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
          or <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>browse files</span> from your computer
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge badge-blue">
            <FileImage size={13} /> JPG / PNG (Max 50MB)
          </span>
          <span className="badge badge-purple">
            <FileVideo size={13} /> MP4 / MOV Video (Max 100MB)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: "10px 14px",
          background: "var(--color-fake-bg)",
          border: "1px solid var(--color-fake-border)",
          borderRadius: "8px",
          color: "var(--color-fake)",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

    </div>
  );
};
