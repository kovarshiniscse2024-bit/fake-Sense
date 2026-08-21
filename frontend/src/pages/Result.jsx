import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { VerdictCard } from "../components/VerdictCard";
import { MediaViewer } from "../components/MediaViewer";
import { ScoreCard } from "../components/ScoreCard";
import { ModuleResult } from "../components/ModuleResult";
import { EvidenceExplorer } from "../components/EvidenceExplorer";
import { AnalysisTimeline } from "../components/AnalysisTimeline";
import { PerformanceSummary } from "../components/PerformanceSummary";
import { AgentChat } from "../components/AgentChat";
import { DeleteVerificationModal } from "../components/DeleteVerificationModal";
import { ForensicEvidenceMap } from "../components/ForensicEvidenceMap";
import { WhyThisScoreModal } from "../components/WhyThisScoreModal";
import { ModelAgreementCard } from "../components/ModelAgreementCard";
import { ForensicRiskRadar } from "../components/ForensicRiskRadar";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { VerificationPassport } from "../components/VerificationPassport";
import {
  Download,
  UploadCloud,
  ArrowLeft,
  FileCheck2,
  Trash2,
  GitCompare,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";

export const Result = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const verificationId = searchParams.get("id");

  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWhyScore, setShowWhyScore] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState("");

  useEffect(() => {
    if (!result && verificationId) {
      fetchResult();
    }
  }, [verificationId]);

  useEffect(() => {
    if (result && result.verdict === "Likely Real" && result.authenticity_score >= 70) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#2563eb"],
      });
    }
  }, [result]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const data = await api.verify.getById(verificationId);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to load verification result.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      setDownloadingPdf(true);
      await api.report.downloadReport(result.verification_id);
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDeleteVerification = async () => {
    if (!result) return;
    try {
      await api.verify.delete(result.verification_id);
      setShowDeleteModal(false);
      navigate("/history", { state: { message: "Verification deleted successfully. All stored analysis data has been purged." } });
    } catch (err) {
      alert("Failed to delete verification: " + err.message);
    }
  };

  const handleAskAi = (promptText) => {
    setAgentPrompt(promptText);
    const chatElement = document.getElementById("ask-fakesense-ai");
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ fontSize: "1.05rem", color: "var(--color-primary)", fontWeight: 600 }}>
          Loading AI Verification Result...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="app-container" style={{ maxWidth: "560px", textAlign: "center", padding: "60px 20px" }}>
        <div className="saas-card" style={{ padding: "36px" }}>
          <AlertCircle size={40} color="var(--color-fake)" style={{ margin: "0 auto 14px auto" }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "6px" }}>Verification Not Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "18px" }}>
            {error || "Could not locate this verification ID in your records (it may have been deleted)."}
          </p>
          <Link to="/upload" className="btn-primary">
            <UploadCloud size={15} /> Verify New Media
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Navigation & Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/compare" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "7px 12px" }}>
            <GitCompare size={14} /> Compare
          </Link>
          <Link to="/upload" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "7px 12px" }}>
            <UploadCloud size={14} /> Verify Another
          </Link>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="btn-primary"
            style={{ fontSize: "0.82rem", padding: "7px 14px" }}
          >
            <Download size={14} /> {downloadingPdf ? "Generating..." : "Download Report"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "7px 10px", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
            title="Delete this verification record"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Hero Verdict Card */}
      <VerdictCard
        result={result}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={downloadingPdf}
      />

      {/* Prominent Actual Media Viewer & Technical Specs */}
      <MediaViewer result={result} />

      {/* Verification Passport */}
      <VerificationPassport
        result={result}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={downloadingPdf}
      />

      {/* Grid: Score Card & Media Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        
        {/* Authenticity & Confidence Meter with 'Why this score?' Trigger */}
        <ScoreCard
          score={result.authenticity_score}
          confidence={result.confidence}
          verdict={result.verdict}
          onOpenWhyScore={() => setShowWhyScore(true)}
        />

        {/* Media Verification Metadata Card */}
        <div className="saas-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{
                padding: "6px",
                borderRadius: "6px",
                background: "var(--color-primary-light)",
                color: "var(--color-primary)"
              }}>
                <FileCheck2 size={18} />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Verification Metadata</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "5px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Target File:</span>
                <span className="mono-text" style={{ fontWeight: 600, color: "var(--text-main)" }}>{result.file_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "5px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Media Type:</span>
                <span className="badge badge-blue" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                  {result.media_type?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "5px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Verification ID:</span>
                <span className="mono-text" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{result.verification_id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Timestamp:</span>
                <span className="mono-text" style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  {new Date(result.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "8px" }}>
            <button
              onClick={() => setShowWhyScore(true)}
              className="btn-secondary"
              style={{ width: "100%", padding: "7px", fontSize: "0.82rem", textAlign: "center" }}
            >
              Why this score? ({result.authenticity_score}%)
            </button>
          </div>
        </div>

      </div>

      {/* Forensic Evidence Map */}
      <ForensicEvidenceMap
        result={result}
        onAskAi={handleAskAi}
      />

      {/* Model Agreement & Risk Radar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        <ModelAgreementCard
          agreement={result.model_agreement}
          modules={result.modules}
          onAskAi={handleAskAi}
        />

        <ForensicRiskRadar
          riskRadar={result.risk_radar}
          modules={result.modules}
          onAskAi={handleAskAi}
        />
      </div>

      {/* Visual Evidence Explorer */}
      <EvidenceExplorer
        result={result}
        onAskAiAboutEvidence={(item) => {
          const finding = typeof item === "object" ? item.finding : item;
          const type = typeof item === "object" ? (item.type || item.source) : "this signal";
          handleAskAi(`Explain this evidence in detail: "${finding}" from ${type}. How did it affect the result?`);
        }}
      />

      {/* Verification Analysis Timeline */}
      <AnalysisTimeline timeline={result.timeline} />

      {/* What-If Forensic Simulator */}
      <WhatIfSimulator
        verificationId={result.verification_id}
        originalResult={result}
        onAskAi={handleAskAi}
      />

      {/* Performance Summary & Module Results */}
      <PerformanceSummary
        performance={result.performance_summary}
        confidence={result.confidence}
        evidenceCount={result.evidence?.length}
      />

      <ModuleResult modules={result.modules} />

      {/* AI Verification Agent Conversational Interface */}
      <div id="ask-fakesense-ai">
        <AgentChat
          verificationResult={result}
          externalPrompt={agentPrompt}
        />
      </div>

      {/* Why This Score Modal */}
      {showWhyScore && (
        <WhyThisScoreModal
          result={result}
          onClose={() => setShowWhyScore(false)}
          onAskAi={handleAskAi}
        />
      )}

      {/* Delete Verification Confirmation Modal */}
      {showDeleteModal && (
        <DeleteVerificationModal
          verificationId={result.verification_id}
          fileName={result.file_name}
          onConfirm={handleDeleteVerification}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

    </div>
  );
};
