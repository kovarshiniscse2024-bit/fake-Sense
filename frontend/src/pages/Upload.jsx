import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadBox } from "../components/UploadBox";
import { MediaPreview } from "../components/MediaPreview";
import { ProgressSteps, STAGES } from "../components/ProgressSteps";
import { api } from "../services/api";
import { ShieldCheck, Info, Lock } from "lucide-react";

export const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleStartVerification = async () => {
    if (!selectedFile) return;

    setIsVerifying(true);
    setError(null);
    setCurrentStage(0);

    // Simulate truthful progress stages during backend execution
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const result = await api.verify.uploadAndVerify(selectedFile);
      
      // Finalize progress steps
      setCurrentStage(STAGES.length - 1);
      clearInterval(stageInterval);

      // Brief delay to showcase complete state before navigating
      setTimeout(() => {
        navigate(`/result?id=${result.verification_id}`, { state: { result } });
      }, 500);

    } catch (err) {
      clearInterval(stageInterval);
      setIsVerifying(false);
      setError(err.message || "Media verification failed.");
    }
  };

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: "800px" }}>
      
      {/* Title Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-main)", marginBottom: "6px" }}>
          Verify Media
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto" }}>
          Upload an image or video to analyze its authenticity using multiple forensic signals.
        </p>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "var(--color-fake-bg)",
          border: "1px solid var(--color-fake-border)",
          borderRadius: "8px",
          color: "var(--color-fake)",
          fontSize: "0.88rem",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      {/* Verification in Progress View */}
      {isVerifying ? (
        <ProgressSteps currentStageIndex={currentStage} />
      ) : (
        <>
          {/* File Picker or Media Preview */}
          {!selectedFile ? (
            <UploadBox onFileSelect={handleFileSelect} isProcessing={isVerifying} />
          ) : (
            <MediaPreview
              file={selectedFile}
              onRemove={handleRemoveFile}
              onVerify={handleStartVerification}
              isVerifying={isVerifying}
            />
          )}

          {/* Privacy Notice Banner */}
          <div className="saas-card" style={{
            marginTop: "20px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            background: "var(--bg-surface-secondary)",
            border: "1px solid var(--border-subtle)"
          }}>
            <Lock size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: "var(--text-main)" }}>Privacy & Security Guarantee: </strong>
              Uploaded media files are processed securely in temporary buffers and purged immediately according to retention policy.
            </div>
          </div>
        </>
      )}

    </div>
  );
};
