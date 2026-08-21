import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Download, ArrowLeft, FileText } from "lucide-react";

export const Report = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      await api.report.downloadReport(id);
    } catch (err) {
      alert("Download failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: "560px", padding: "60px 20px", textAlign: "center" }}>
      <div className="saas-card" style={{ padding: "36px 28px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          background: "var(--color-primary-light)",
          color: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px auto"
        }}>
          <FileText size={24} />
        </div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
          PDF Verification Report
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "20px" }}>
          Export multi-signal evidence audit for verification ID <span className="mono-text" style={{ color: "var(--color-primary)", fontWeight: 600 }}>{id}</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary"
            style={{ padding: "10px", fontSize: "0.9rem" }}
          >
            <Download size={15} />
            {downloading ? "Preparing Document..." : "Download Verification Report"}
          </button>
          <Link to={`/result?id=${id}`} className="btn-secondary" style={{ padding: "9px", fontSize: "0.85rem" }}>
            <ArrowLeft size={15} /> Return to Result Screen
          </Link>
        </div>
      </div>
    </div>
  );
};
