import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import {
  GitCompare,
  UploadCloud,
  Bot,
  ArrowLeft,
  AlertCircle,
  Trash2,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";

export const Compare = () => {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [isDragOverA, setIsDragOverA] = useState(false);
  const [isDragOverB, setIsDragOverB] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const inputRefA = useRef(null);
  const inputRefB = useRef(null);

  const [aiExplanation, setAiExplanation] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (fileA) {
      const url = URL.createObjectURL(fileA);
      setPreviewA(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewA(null);
    }
  }, [fileA]);

  useEffect(() => {
    if (fileB) {
      const url = URL.createObjectURL(fileB);
      setPreviewB(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewB(null);
    }
  }, [fileB]);

  const validateFile = (file) => {
    const validExtensions = [".jpg", ".jpeg", ".png", ".mp4", ".mov", ".avi"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      throw new Error(`Unsupported format '${ext}'. Please upload JPG, PNG, or MP4.`);
    }
    const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".avi";
    const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit (${isVideo ? "100MB for video" : "50MB for image"}).`);
    }
    return true;
  };

  const handleSelectFileA = (file) => {
    try {
      if (file) {
        validateFile(file);
        setFileA(file);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectFileB = (file) => {
    try {
      if (file) {
        validateFile(file);
        setFileB(file);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunComparison = async () => {
    if (!fileA || !fileB) {
      setError("Please select both Media A and Media B to compare.");
      return;
    }

    setError(null);
    setComparing(true);
    setAiExplanation("");
    setResults(null);

    try {
      const data = await api.compare.upload(fileA, fileB);
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to complete media comparison.");
    } finally {
      setComparing(false);
    }
  };

  const handleAskCustomAi = async (customPrompt) => {
    if (!results) return;
    setLoadingAi(true);
    setError(null);

    try {
      const data = await api.compare.explain(
        results.media_a.verification_id,
        results.media_b.verification_id,
        customPrompt
      );
      setAiExplanation(data.answer);
    } catch (err) {
      setError("Failed to generate AI comparative explanation: " + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case "Likely AI-Generated":
        return <span className="badge badge-ai">Likely AI-Generated</span>;
      case "Likely Authentic":
      case "Likely Real":
        return <span className="badge badge-real">Likely Authentic</span>;
      case "Likely Manipulated":
        return <span className="badge badge-manipulated">Likely Manipulated</span>;
      default:
        return <span className="badge badge-inconclusive">Inconclusive</span>;
    }
  };

  const formatModuleOutcome = (mod) => {
    if (!mod) return <span style={{ color: "var(--text-muted)" }}>N/A</span>;
    const status = mod.status || "unknown";
    if (status === "not_applicable") return <span style={{ color: "var(--text-muted)" }}>Not Applicable</span>;
    if (status === "skipped") return <span style={{ color: "var(--color-inconclusive)" }}>Skipped</span>;
    if (status === "failed") return <span style={{ color: "var(--color-fake)" }}>Failed</span>;
    
    const result = (mod.result || "Normal").replace("_", " ");
    const score = mod.suspicion_score !== null && mod.suspicion_score !== undefined ? `${Math.round(mod.suspicion_score * 100)}%` : "";
    
    const isSusp = (mod.suspicion_score || 0) >= 0.5;
    return (
      <span style={{ color: isSusp ? "var(--color-fake)" : "var(--color-real)", fontWeight: 600 }}>
        {result} {score && `(${score})`}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isSimilarResults = results && (
    results.media_a.verdict === results.media_b.verdict &&
    Math.abs(results.media_a.authenticity_score - results.media_b.authenticity_score) <= 5
  );

  return (
    <div className="app-container animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <GitCompare size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
              Dual Media Comparison
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Independent multi-signal verification pipelines with comparative AI difference analysis
            </p>
          </div>
        </div>

        <Link to="/upload" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back to Single Upload
        </Link>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--color-fake-bg)", border: "1px solid var(--color-fake-border)", borderRadius: "8px", color: "var(--color-fake)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Upload Dropzone Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* Media A Dropzone & Preview */}
        <div className="saas-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="badge badge-blue" style={{ fontSize: "0.72rem" }}>MEDIA A</span>
            {fileA ? (
              <button
                onClick={() => { setFileA(null); setResults(null); }}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "0.74rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
              >
                <Trash2 size={12} /> Remove
              </button>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No file selected</span>
            )}
          </div>

          <input
            id="compare-file-input-a"
            ref={inputRefA}
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,.mov,.avi"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleSelectFileA(e.target.files[0]);
              }
            }}
            onClick={(e) => { e.target.value = null; }}
            style={{ display: "none" }}
            disabled={comparing}
          />

          {!fileA ? (
            <label
              htmlFor="compare-file-input-a"
              onDragOver={(e) => { e.preventDefault(); setIsDragOverA(true); }}
              onDragLeave={() => setIsDragOverA(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverA(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleSelectFileA(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: isDragOverA ? "2px dashed var(--color-primary)" : "2px dashed var(--border-strong)",
                borderRadius: "10px",
                padding: "36px 18px",
                textAlign: "center",
                cursor: comparing ? "not-allowed" : "pointer",
                background: isDragOverA ? "var(--color-primary-light)" : "var(--bg-surface-secondary)",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <UploadCloud size={30} color="var(--color-primary)" />
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                Choose Media A
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                JPG, PNG, or MP4 (Image or Video)
              </span>
            </label>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Media A Preview Frame */}
              <div style={{
                height: "180px",
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-subtle)",
                position: "relative"
              }}>
                {fileA.type.startsWith("video") ? (
                  <video src={previewA} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <img src={previewA} alt="Media A" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>

              <div style={{ padding: "10px 12px", background: "var(--color-primary-light)", borderRadius: "8px", border: "1px solid var(--color-primary-border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCheck size={18} color="var(--color-primary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fileA.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                    {formatFileSize(fileA.size)} • {fileA.type || "Media file"}
                  </div>
                </div>
                <CheckCircle2 size={16} color="var(--color-real)" />
              </div>
            </div>
          )}
        </div>

        {/* Media B Dropzone & Preview */}
        <div className="saas-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>MEDIA B</span>
            {fileB ? (
              <button
                onClick={() => { setFileB(null); setResults(null); }}
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "0.74rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
              >
                <Trash2 size={12} /> Remove
              </button>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No file selected</span>
            )}
          </div>

          <input
            id="compare-file-input-b"
            ref={inputRefB}
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,.mov,.avi"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleSelectFileB(e.target.files[0]);
              }
            }}
            onClick={(e) => { e.target.value = null; }}
            style={{ display: "none" }}
            disabled={comparing}
          />

          {!fileB ? (
            <label
              htmlFor="compare-file-input-b"
              onDragOver={(e) => { e.preventDefault(); setIsDragOverB(true); }}
              onDragLeave={() => setIsDragOverB(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverB(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleSelectFileB(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: isDragOverB ? "2px dashed var(--color-accent-purple)" : "2px dashed var(--border-strong)",
                borderRadius: "10px",
                padding: "36px 18px",
                textAlign: "center",
                cursor: comparing ? "not-allowed" : "pointer",
                background: isDragOverB ? "var(--color-purple-bg)" : "var(--bg-surface-secondary)",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <UploadCloud size={30} color="var(--color-accent-purple)" />
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                Choose Media B
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                JPG, PNG, or MP4 (Image or Video)
              </span>
            </label>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Media B Preview Frame */}
              <div style={{
                height: "180px",
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-subtle)",
                position: "relative"
              }}>
                {fileB.type.startsWith("video") ? (
                  <video src={previewB} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <img src={previewB} alt="Media B" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>

              <div style={{ padding: "10px 12px", background: "var(--color-purple-bg)", borderRadius: "8px", border: "1px solid var(--color-purple-border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCheck size={18} color="var(--color-accent-purple)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fileB.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                    {formatFileSize(fileB.size)} • {fileB.type || "Media file"}
                  </div>
                </div>
                <CheckCircle2 size={16} color="var(--color-real)" />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Compare Action Button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleRunComparison}
          disabled={comparing || !fileA || !fileB}
          className="btn-primary"
          style={{
            padding: "11px 34px",
            fontSize: "0.95rem",
            opacity: (!fileA || !fileB) ? 0.5 : 1,
            cursor: (!fileA || !fileB || comparing) ? "not-allowed" : "pointer"
          }}
        >
          <GitCompare size={16} /> {comparing ? "Executing Independent Dual Pipelines..." : "Compare Media Files"}
        </button>
        {(!fileA || !fileB) && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Select both Media A and Media B to begin independent analysis.
          </p>
        )}
      </div>

      {/* Comparison Results Section */}
      {results && (
        <div className="saas-card animate-fade-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Sparkles size={16} color="var(--color-primary)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  Forensic Comparison Matrix
                </h2>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                Independent verification pipeline outputs for <span className="mono-text">{results.media_a.file_name}</span> vs <span className="mono-text">{results.media_b.file_name}</span>.
              </p>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => handleAskCustomAi("Why are these results different?")}
                disabled={loadingAi}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "6px 12px", color: "var(--color-primary)", borderColor: "var(--color-primary-border)" }}
              >
                <Bot size={14} /> Why are they different?
              </button>
              <button
                onClick={() => handleAskCustomAi("Which one is more suspicious and why?")}
                disabled={loadingAi}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "6px 12px", color: "var(--color-inconclusive)", borderColor: "var(--color-inconclusive-border)" }}
              >
                <Bot size={14} /> Which is more suspicious?
              </button>
              <button
                onClick={() => handleAskCustomAi("Compare the facial and visual noise analysis of Media A and Media B.")}
                disabled={loadingAi}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "6px 12px", color: "var(--color-accent-purple)", borderColor: "var(--color-purple-border)" }}
              >
                <Bot size={14} /> Compare facial & visual
              </button>
            </div>
          </div>

          {/* Outcome Status Banner */}
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: isSimilarResults ? "var(--color-real-bg)" : "var(--color-primary-light)",
            border: isSimilarResults ? "1px solid var(--color-real-border)" : "1px solid var(--color-primary-border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.82rem",
            color: isSimilarResults ? "var(--color-real)" : "var(--color-primary)"
          }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              {isSimilarResults
                ? "Both media files were independently verified and produced matching authentic forensic profiles."
                : "Forensic divergence detected across multi-signal analysis modules."}
            </span>
          </div>

          {/* Side-by-Side Visual Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            
            {/* Card Media A */}
            <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)", border: "1px solid var(--color-primary-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span className="badge badge-blue">MEDIA A</span>
                {getVerdictBadge(results.media_a.verdict)}
              </div>
              <div style={{ height: "140px", borderRadius: "6px", overflow: "hidden", background: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {fileA?.type.startsWith("video") ? (
                  <video src={previewA} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <img src={previewA} alt="Media A" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {results.media_a.file_name}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Authenticity:</span>
                <span className="mono-text" style={{ fontWeight: 800, color: "var(--text-main)" }}>{results.media_a.authenticity_score}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "2px" }}>
                <span style={{ color: "var(--text-muted)" }}>Confidence:</span>
                <span className="mono-text" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{Math.round(results.media_a.confidence * 100)}%</span>
              </div>
            </div>

            {/* Card Media B */}
            <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)", border: "1px solid var(--color-purple-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span className="badge badge-purple">MEDIA B</span>
                {getVerdictBadge(results.media_b.verdict)}
              </div>
              <div style={{ height: "140px", borderRadius: "6px", overflow: "hidden", background: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {fileB?.type.startsWith("video") ? (
                  <video src={previewB} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <img src={previewB} alt="Media B" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {results.media_b.file_name}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Authenticity:</span>
                <span className="mono-text" style={{ fontWeight: 800, color: "var(--text-main)" }}>{results.media_b.authenticity_score}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "2px" }}>
                <span style={{ color: "var(--text-muted)" }}>Confidence:</span>
                <span className="mono-text" style={{ fontWeight: 600, color: "var(--color-accent-purple)" }}>{Math.round(results.media_b.confidence * 100)}%</span>
              </div>
            </div>

          </div>

          {/* Side-by-Side Comparison Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)", background: "var(--bg-surface-secondary)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", width: "26%", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Forensic Metric</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-primary)", width: "37%", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                    Media A ({results.media_a.file_name})
                    <span className="mono-text" style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 400, marginTop: "1px", textTransform: "none" }}>
                      ID: {results.media_a.verification_id}
                    </span>
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-accent-purple)", width: "37%", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                    Media B ({results.media_b.file_name})
                    <span className="mono-text" style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 400, marginTop: "1px", textTransform: "none" }}>
                      ID: {results.media_b.verification_id}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Final Verdict</td>
                  <td style={{ padding: "10px 14px" }}>{getVerdictBadge(results.media_a.verdict)}</td>
                  <td style={{ padding: "10px 14px" }}>{getVerdictBadge(results.media_b.verdict)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Authenticity Score</td>
                  <td className="mono-text" style={{ padding: "10px 14px", fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>{results.media_a.authenticity_score}%</td>
                  <td className="mono-text" style={{ padding: "10px 14px", fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>{results.media_b.authenticity_score}%</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Confidence Rating</td>
                  <td className="mono-text" style={{ padding: "10px 14px" }}>{Math.round(results.media_a.confidence * 100)}%</td>
                  <td className="mono-text" style={{ padding: "10px 14px" }}>{Math.round(results.media_b.confidence * 100)}%</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Visual / CNN Analysis</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_a.modules?.visual_cnn)}</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_b.modules?.visual_cnn)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Facial Region Analysis</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_a.modules?.face_analysis)}</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_b.modules?.face_analysis)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Audio Analysis</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_a.modules?.audio_analysis)}</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_b.modules?.audio_analysis)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Audio-Visual Sync</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_a.modules?.audio_visual_sync)}</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_b.modules?.audio_visual_sync)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Metadata & Headers</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_a.modules?.metadata)}</td>
                  <td style={{ padding: "10px 14px" }}>{formatModuleOutcome(results.media_b.modules?.metadata)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Evidence Count</td>
                  <td style={{ padding: "10px 14px" }}>{results.media_a.evidence?.length || 0} signals</td>
                  <td style={{ padding: "10px 14px" }}>{results.media_b.evidence?.length || 0} signals</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>Processing Time</td>
                  <td className="mono-text" style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} color="var(--color-primary)" />
                      {results.media_a.performance_summary?.total_duration_seconds ? `${results.media_a.performance_summary.total_duration_seconds}s` : "< 1.0s"}
                    </span>
                  </td>
                  <td className="mono-text" style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} color="var(--color-accent-purple)" />
                      {results.media_b.performance_summary?.total_duration_seconds ? `${results.media_b.performance_summary.total_duration_seconds}s` : "< 1.0s"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Explanation Box */}
          {aiExplanation && (
            <div className="saas-card animate-fade-in" style={{ padding: "18px 20px", background: "var(--bg-surface-secondary)", borderRadius: "10px", border: "1px solid var(--color-primary-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Bot size={18} color="var(--color-primary)" />
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                  AI Comparative Explanation
                </h4>
              </div>
              <div style={{ fontSize: "0.85rem", lineHeight: "1.55", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
                {aiExplanation}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
