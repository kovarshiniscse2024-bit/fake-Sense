import React, { useState } from "react";
import { Sparkles, Play, RotateCcw, ArrowRight, MessageSquare } from "lucide-react";
import { api } from "../services/api";

export const WhatIfSimulator = ({ verificationId, originalResult, onAskAi }) => {
  const [excludedSignals, setExcludedSignals] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!verificationId || !originalResult) return null;

  const availableSignals = [
    { id: "metadata", label: "Metadata & Provenance", desc: "Exclude EXIF header and camera tag inspection" },
    { id: "face_analysis", label: "Facial Region Analysis", desc: "Exclude facial boundary seams and symmetry checks" },
    { id: "visual_cnn", label: "Visual / Sensor Noise", desc: "Exclude sensor noise residual covariance & 2D FFT" },
  ];

  if (originalResult.media_type === "video") {
    availableSignals.push({
      id: "audio_visual_sync",
      label: "Audio-Visual Synchronization",
      desc: "Exclude phoneme-viseme lip-sync correlation"
    });
  }

  const handleToggleSignal = (sigId) => {
    setExcludedSignals((prev) =>
      prev.includes(sigId) ? prev.filter((id) => id !== sigId) : [...prev, sigId]
    );
  };

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.verify.whatIf(verificationId, excludedSignals);
      setSimResult(res);
    } catch (err) {
      setError(err.message || "Failed to execute hypothetical simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setExcludedSignals([]);
    setSimResult(null);
    setError(null);
  };

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "20px 24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-purple-bg)",
            color: "var(--color-accent-purple)",
            display: "flex"
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                What-If Forensic Simulator
              </h3>
              <span className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                Sensitivity Modeling
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Simulate hypothetical scenarios by excluding specific signals to test verdict sensitivity
            </p>
          </div>
        </div>

        {simResult && (
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: "0.76rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <RotateCcw size={12} /> Reset Simulation
          </button>
        )}
      </div>

      {/* Signal Exclusion Toggles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {availableSignals.map((sig) => {
          const isSelected = excludedSignals.includes(sig.id);
          return (
            <div
              key={sig.id}
              onClick={() => handleToggleSignal(sig.id)}
              className="saas-card"
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: isSelected ? "var(--color-fake-bg)" : "var(--bg-surface)",
                border: isSelected ? "1px solid var(--color-fake-border)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px"
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                style={{ marginTop: "3px", accentColor: "var(--color-fake)", cursor: "pointer" }}
              />
              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isSelected ? "var(--color-fake)" : "var(--text-main)", display: "block" }}>
                  {isSelected ? `Exclude ${sig.label}` : `Include ${sig.label}`}
                </span>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginTop: "1px" }}>
                  {sig.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Run Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
          {excludedSignals.length === 0
            ? "Select one or more signals above to simulate their removal."
            : `${excludedSignals.length} signal(s) selected for hypothetical removal.`}
        </span>

        <button
          onClick={handleRunSimulation}
          disabled={loading || excludedSignals.length === 0}
          className="btn-primary"
          style={{
            fontSize: "0.82rem",
            padding: "7px 16px",
            opacity: excludedSignals.length === 0 ? 0.6 : 1,
            cursor: excludedSignals.length === 0 ? "not-allowed" : "pointer"
          }}
        >
          <Play size={13} /> {loading ? "Simulating..." : "Run Hypothetical Simulation"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--color-fake-bg)", borderRadius: "8px", color: "var(--color-fake)", fontSize: "0.82rem", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {/* Simulation Result Comparison Box */}
      {simResult && (
        <div className="saas-card" style={{
          padding: "16px 18px",
          background: "var(--bg-surface-secondary)",
          borderRadius: "10px",
          border: "1px solid var(--color-purple-border)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "8px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-accent-purple)" }}>
              SIMULATION — NOT AN ACTUAL VERIFICATION
            </span>
            <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
              Hypothetical Modeling
            </span>
          </div>

          {/* Metric Comparison Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center" }}>
            
            {/* Original Box */}
            <div style={{ padding: "10px", background: "var(--bg-surface)", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Original Result</span>
              <div className="mono-text" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "1px" }}>
                {simResult.original_score}%
              </div>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: simResult.original_verdict === "Likely Real" ? "var(--color-real)" : "var(--color-fake)" }}>
                {simResult.original_verdict}
              </span>
            </div>

            {/* Transition Arrow & Delta */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "16px",
                background: simResult.score_diff > 0 ? "var(--color-real-bg)" : (simResult.score_diff < 0 ? "var(--color-fake-bg)" : "var(--bg-surface)"),
                color: simResult.score_diff > 0 ? "var(--color-real)" : (simResult.score_diff < 0 ? "var(--color-fake)" : "var(--text-muted)"),
                border: `1px solid ${simResult.score_diff > 0 ? "var(--color-real-border)" : (simResult.score_diff < 0 ? "var(--color-fake-border)" : "var(--border-subtle)")}`,
                fontWeight: 800,
                fontSize: "0.78rem"
              }}>
                <ArrowRight size={13} />
                <span>{simResult.score_diff > 0 ? `+${simResult.score_diff}%` : `${simResult.score_diff}%`}</span>
              </div>
            </div>

            {/* Simulated Box */}
            <div style={{ padding: "10px", background: "var(--color-purple-bg)", borderRadius: "8px", border: "1px solid var(--color-purple-border)", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--color-accent-purple)", textTransform: "uppercase" }}>Simulated Result</span>
              <div className="mono-text" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-accent-purple)", marginTop: "1px" }}>
                {simResult.simulated_score}%
              </div>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: simResult.simulated_verdict === "Likely Real" ? "var(--color-real)" : "var(--color-fake)" }}>
                {simResult.simulated_verdict}
              </span>
            </div>
          </div>

          {/* Narrative Explanation */}
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45, background: "var(--bg-surface)", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
            {simResult.explanation}
          </p>

          {/* Ask AI about this simulation */}
          {onAskAi && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => onAskAi(`What if we removed ${simResult.excluded_signals.join(" and ")}? Explain the hypothetical impact in detail.`)}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "5px 12px", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <MessageSquare size={13} color="var(--color-accent-purple)" />
                Ask AI About This Simulation
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
