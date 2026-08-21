import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { DashboardChart } from "../components/DashboardChart";
import {
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Download,
  FileCheck2,
  Image as ImageIcon,
  Video as VideoIcon,
  ArrowRight
} from "lucide-react";

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id, e) => {
    e.stopPropagation();
    try {
      await api.report.downloadReport(id);
    } catch (err) {
      alert("Failed to download PDF report: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ fontSize: "1.05rem", color: "var(--color-primary)", fontWeight: 600 }}>
          Loading AI Forensics Dashboard...
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Verifications",
      value: summary?.total_verifications ?? 0,
      icon: Layers,
      color: "var(--color-primary)",
      bg: "var(--color-primary-light)",
      border: "var(--color-primary-border)",
      desc: "Historical verified media items"
    },
    {
      title: "Likely Real",
      value: summary?.likely_real_count ?? 0,
      icon: ShieldCheck,
      color: "var(--color-real)",
      bg: "var(--color-real-bg)",
      border: "var(--color-real-border)",
      desc: "Authentic camera captures"
    },
    {
      title: "Likely Manipulated",
      value: summary?.likely_manipulated_count ?? 0,
      icon: ShieldAlert,
      color: "var(--color-fake)",
      bg: "var(--color-fake-bg)",
      border: "var(--color-fake-border)",
      desc: "AI/deepfake anomalies detected"
    },
    {
      title: "Inconclusive",
      value: summary?.inconclusive_count ?? 0,
      icon: AlertTriangle,
      color: "var(--color-inconclusive)",
      bg: "var(--color-inconclusive-bg)",
      border: "var(--color-inconclusive-border)",
      desc: "Low confidence / noise"
    },
  ];

  return (
    <div className="app-container animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* SaaS Hero Banner */}
      <div className="saas-card" style={{
        padding: "32px 32px",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "24px"
      }}>
        <div style={{ flex: "1 1 440px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-primary)",
              fontWeight: 700,
              background: "var(--color-primary-light)",
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid var(--color-primary-border)"
            }}>
              AGENTIC AI MEDIA VERIFICATION
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", margin: "4px 0 8px 0" }}>
            Verify digital media with confidence
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0, maxWidth: "620px", lineHeight: 1.5 }}>
            Analyze images and videos using multiple forensic signals and receive an explainable authenticity assessment.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/upload" className="btn-primary" style={{ padding: "11px 22px", fontSize: "0.92rem" }}>
            <UploadCloud size={18} />
            <span>Verify Media</span>
          </Link>
          <Link to="/history" className="btn-secondary" style={{ padding: "11px 20px", fontSize: "0.92rem" }}>
            <span>View History</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="saas-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                padding: "10px",
                borderRadius: "10px",
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Icon size={22} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {stat.title}
                </div>
                <div className="mono-text" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginTop: "1px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "1px" }}>
                  {stat.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Section */}
      <DashboardChart
        distribution={summary?.verdict_distribution || []}
        trend={summary?.trend_history || []}
      />

      {/* Recent Verifications Section */}
      <div className="saas-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Recent Verifications</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px", margin: 0 }}>Your latest media integrity assessments with actual media previews</p>
          </div>
          <Link to="/history" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            <span>View Full History</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {summary?.recent_verifications && summary.recent_verifications.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {summary.recent_verifications.map((item) => {
              let badgeClass = "badge-inconclusive";
              if (item.verdict === "Likely Real") badgeClass = "badge-real";
              if (item.verdict === "Likely Manipulated") badgeClass = "badge-manipulated";

              const isVideo = item.media_type === "video";
              const thumbUrl = api.media.getThumbnailUrl(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/result?id=${item.id}`)}
                  className="saas-card glass-card-interactive"
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    
                    {/* Actual Media Thumbnail / Poster */}
                    <div style={{
                      width: "60px",
                      height: "50px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#0f172a",
                      flexShrink: 0,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border-subtle)"
                    }}>
                      <img
                        src={thumbUrl}
                        alt={item.file_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div style={{ display: "none", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#94a3b8" }}>
                        {isVideo ? <VideoIcon size={20} /> : <ImageIcon size={20} />}
                      </div>
                      {isVideo && (
                        <div style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "2px",
                          background: "rgba(15, 23, 42, 0.85)",
                          color: "#f8fafc",
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "3px"
                        }}>
                          VIDEO
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                        {item.file_name}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        <span className="mono-text" style={{ color: "var(--text-secondary)" }}>ID: {item.id}</span>
                        <span>•</span>
                        <span style={{ textTransform: "uppercase", fontWeight: 600, color: "var(--color-primary)" }}>{item.media_type}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span className={`badge ${badgeClass}`}>
                      {item.verdict}
                    </span>

                    <div style={{ textAlign: "right", minWidth: "85px" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Authenticity</div>
                      <div className="mono-text" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main)" }}>
                        {item.authenticity_score}%
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDownloadPdf(item.id, e)}
                        className="btn-secondary"
                        style={{ padding: "5px 9px", fontSize: "0.78rem" }}
                        title="Download PDF Report"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => navigate(`/result?id=${item.id}`)}
                        className="btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "0.78rem", color: "var(--color-primary)", borderColor: "var(--color-primary-border)" }}
                      >
                        View Result →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-muted)", background: "var(--bg-surface-secondary)", borderRadius: "8px" }}>
            <UploadCloud size={36} color="var(--text-faint)" style={{ margin: "0 auto 10px auto" }} />
            <p style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>No Verifications Yet</p>
            <p style={{ fontSize: "0.82rem", marginTop: "2px", marginBottom: "14px" }}>Upload your first image or video to begin analysis.</p>
            <Link to="/upload" className="btn-primary" style={{ padding: "7px 16px", fontSize: "0.85rem" }}>
              Verify Media Now
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};
