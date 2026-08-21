import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { ArrowLeft, SearchCode, Binary, Activity, Tag } from "lucide-react";

export const Evidence = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.verify.getById(id)
        .then(setResult)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>Loading Forensic Signal Metrics...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <h3>Forensic Record Not Found</h3>
        <Link to="/dashboard" className="btn-secondary" style={{ marginTop: "16px" }}>Back to Dashboard</Link>
      </div>
    );
  }

  const modules = result.modules || {};

  return (
    <div className="app-container animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to={`/result?id=${result.verification_id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back to Result Summary
        </Link>
        <span className="mono-text" style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
          Forensic Telemetry: {result.verification_id}
        </span>
      </div>

      <div className="saas-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex"
          }}>
            <SearchCode size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              Deep Forensic Signal Inspector
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Raw mathematical matrices, frequency domain energy measurements, and EXIF attributes
            </p>
          </div>
        </div>

        {/* Modules Forensic Signals Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          
          {/* Visual/CNN Signals */}
          <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", color: "var(--color-primary)" }}>
              <Binary size={16} />
              <h4 style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0 }}>Visual Frequency & ELA Matrix</h4>
            </div>
            <pre className="mono-text" style={{
              background: "#0f172a",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              color: "#38bdf8",
              overflowX: "auto",
              border: "1px solid var(--border-subtle)"
            }}>
              {JSON.stringify(modules.visual_cnn?.metrics || { note: "Standard noise distribution" }, null, 2)}
            </pre>
          </div>

          {/* Facial Analysis Signals */}
          <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", color: "var(--color-real)" }}>
              <Activity size={16} />
              <h4 style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0 }}>Facial Blend & Geometry Vectors</h4>
            </div>
            <pre className="mono-text" style={{
              background: "#0f172a",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              color: "#34d399",
              overflowX: "auto",
              border: "1px solid var(--border-subtle)"
            }}>
              {JSON.stringify(modules.face_analysis?.metrics || { note: "No face detected" }, null, 2)}
            </pre>
          </div>

          {/* Audio-Visual Sync Signals */}
          <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", color: "var(--color-accent-purple)" }}>
              <Activity size={16} />
              <h4 style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0 }}>Audio-Visual Temporal Motion</h4>
            </div>
            <pre className="mono-text" style={{
              background: "#0f172a",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              color: "#c084fc",
              overflowX: "auto",
              border: "1px solid var(--border-subtle)"
            }}>
              {JSON.stringify(modules.audio_visual_sync?.metrics || { note: "Video or audio track omitted" }, null, 2)}
            </pre>
          </div>

          {/* Metadata Inspector */}
          <div className="saas-card" style={{ padding: "16px", background: "var(--bg-surface-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", color: "var(--color-inconclusive)" }}>
              <Tag size={16} />
              <h4 style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0 }}>Container & EXIF Header Tags</h4>
            </div>
            <pre className="mono-text" style={{
              background: "#0f172a",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              color: "#fbbf24",
              overflowX: "auto",
              border: "1px solid var(--border-subtle)"
            }}>
              {JSON.stringify(modules.metadata?.metrics || { note: "Standard metadata" }, null, 2)}
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
};
