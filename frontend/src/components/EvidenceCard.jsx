import React from "react";
import { ListFilter, CheckCircle2, AlertCircle, Info } from "lucide-react";

export const EvidenceCard = ({ evidence = [], verdict = "Inconclusive" }) => {
  return (
    <div className="saas-card" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          padding: "6px",
          borderRadius: "6px",
          background: "var(--color-primary-light)",
          color: "var(--color-primary)",
          display: "flex"
        }}>
          <ListFilter size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Why This Result?</h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Explainable AI deductions and module forensic evidence
          </p>
        </div>
      </div>

      {evidence && evidence.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {evidence.map((item, idx) => {
            const isSuspicious = item.toLowerCase().includes("detected") || item.toLowerCase().includes("mismatch") || item.toLowerCase().includes("inconsistencies");
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: isSuspicious ? "var(--color-fake-bg)" : "var(--bg-surface-secondary)",
                  border: isSuspicious ? "1px solid var(--color-fake-border)" : "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ marginTop: "2px" }}>
                  {isSuspicious ? (
                    <AlertCircle size={15} color="var(--color-fake)" />
                  ) : (
                    <CheckCircle2 size={15} color="var(--color-real)" />
                  )}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          padding: "12px 14px",
          background: "var(--bg-surface-secondary)",
          borderRadius: "8px",
          color: "var(--text-secondary)",
          fontSize: "0.82rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Info size={16} color="var(--color-primary)" />
          <span>All analyzed media features conform to standard photographic baseline distributions.</span>
        </div>
      )}
    </div>
  );
};
