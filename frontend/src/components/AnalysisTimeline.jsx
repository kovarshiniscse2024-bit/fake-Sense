import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MinusCircle,
  ListOrdered
} from "lucide-react";

export const AnalysisTimeline = ({ timeline }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!timeline || timeline.length === 0) return null;

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getStatusDisplay = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return {
          icon: <CheckCircle2 size={16} color="var(--color-real)" />,
          badge: <span className="badge badge-real" style={{ fontSize: "0.68rem" }}>Completed</span>,
        };
      case "not_applicable":
        return {
          icon: <MinusCircle size={16} color="var(--text-muted)" />,
          badge: <span className="badge badge-gray" style={{ fontSize: "0.68rem" }}>Not Applicable</span>,
        };
      case "skipped":
        return {
          icon: <MinusCircle size={16} color="var(--color-inconclusive)" />,
          badge: <span className="badge badge-inconclusive" style={{ fontSize: "0.68rem" }}>Skipped</span>,
        };
      case "failed":
        return {
          icon: <XCircle size={16} color="var(--color-fake)" />,
          badge: <span className="badge badge-manipulated" style={{ fontSize: "0.68rem" }}>Failed</span>,
        };
      default:
        return {
          icon: <Clock size={16} color="var(--color-primary)" />,
          badge: <span className="badge badge-blue" style={{ fontSize: "0.68rem" }}>Running</span>,
        };
    }
  };

  return (
    <div className="saas-card animate-fade-in" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
        <div style={{
          padding: "8px",
          borderRadius: "8px",
          background: "var(--color-primary-light)",
          color: "var(--color-primary)",
          display: "flex"
        }}>
          <ListOrdered size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            Verification Analysis Timeline
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
            Chronological multi-stage pipeline execution history and sub-second stage durations.
          </p>
        </div>
      </div>

      {/* Timeline Steps Accordion List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {timeline.map((step, idx) => {
          const isExpanded = expandedIndex === idx;
          const statusInfo = getStatusDisplay(step.status);
          const durationStr = step.duration !== undefined ? `${step.duration.toFixed(2)}s` : "0.0s";

          return (
            <div
              key={idx}
              className="saas-card"
              style={{
                borderRadius: "8px",
                border: isExpanded ? "1px solid var(--color-primary-border)" : "1px solid var(--border-subtle)",
                background: isExpanded ? "var(--bg-surface-secondary)" : "var(--bg-surface)",
                overflow: "hidden",
                transition: "all 0.15s ease",
              }}
            >
              {/* Accordion Header Row */}
              <div
                onClick={() => toggleExpand(idx)}
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {statusInfo.icon}
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                      {step.module}
                    </span>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                      {step.short_result}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="mono-text" style={{ fontSize: "0.76rem", color: "var(--color-primary)", fontWeight: 600 }}>
                    {durationStr}
                  </span>
                  {statusInfo.badge}
                  {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expandable Module Details */}
              {isExpanded && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)",
                    fontSize: "0.8rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    {step.details || "Execution completed without anomaly flag."}
                  </p>
                  {step.evidence && (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      <strong>Evidence Signal:</strong> {step.evidence}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
