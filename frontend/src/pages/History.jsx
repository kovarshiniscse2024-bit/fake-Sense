import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { DeleteVerificationModal } from "../components/DeleteVerificationModal";
import { EvidencePreviewModal } from "../components/EvidencePreviewModal";
import {
  Search,
  Download,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  Trash2,
  GitCompare,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Video as VideoIcon,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  X,
  RotateCcw
} from "lucide-react";

export const History = () => {
  const [historyData, setHistoryData] = useState({ total: 0, page: 1, page_size: 12, items: [] });
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [authenticityFilter, setAuthenticityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  
  // Modals & Feedback
  const [previewTarget, setPreviewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      setToastMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchHistory();
  }, [page, pageSize, verdictFilter, mediaTypeFilter, dateRangeFilter, authenticityFilter, sortBy]);

  const fetchHistory = async (overrideSearch = search) => {
    try {
      setLoading(true);
      const data = await api.history.getHistory({
        page,
        pageSize,
        search: overrideSearch,
        verdict: verdictFilter,
        mediaType: mediaTypeFilter,
        dateRange: dateRangeFilter,
        authenticityTier: authenticityFilter,
        sort: sortBy,
      });
      setHistoryData(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleClearFilters = () => {
    setSearch("");
    setVerdictFilter("all");
    setMediaTypeFilter("all");
    setDateRangeFilter("all");
    setAuthenticityFilter("all");
    setSortBy("newest");
    setPage(1);
    fetchHistory("");
  };

  const hasActiveFilters = 
    search.trim() !== "" ||
    verdictFilter !== "all" ||
    mediaTypeFilter !== "all" ||
    dateRangeFilter !== "all" ||
    authenticityFilter !== "all" ||
    sortBy !== "newest";

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.verify.delete(deleteTarget.id);
      setDeleteTarget(null);
      setToastMessage("Verification record and associated media deleted successfully.");
      fetchHistory();
    } catch (err) {
      alert("Failed to delete record: " + err.message);
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

  const totalPages = Math.ceil(historyData.total / historyData.page_size) || 1;
  const startItemIndex = historyData.total === 0 ? 0 : (historyData.page - 1) * historyData.page_size + 1;
  const endItemIndex = Math.min(historyData.page * historyData.page_size, historyData.total);

  const renderVerdictBadge = (verdict) => {
    if (verdict === "Likely AI-Generated") return <span className="badge badge-ai">Likely AI-Generated</span>;
    if (verdict === "Likely Authentic" || verdict === "Likely Real") return <span className="badge badge-real">Likely Authentic</span>;
    if (verdict === "Likely Manipulated") return <span className="badge badge-manipulated">Likely Manipulated</span>;
    return <span className="badge badge-inconclusive">Inconclusive</span>;
  };

  return (
    <div className="app-container animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-main)", margin: 0 }}>
              Evidence Library
            </h1>
            <span style={{
              fontSize: "0.76rem",
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary-border)",
              padding: "3px 10px",
              borderRadius: "14px",
              fontWeight: 700
            }}>
              {historyData.total} Evidence Items
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            Secure history of previously analyzed digital media and forensic verification results.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* View Toggle */}
          <div style={{
            display: "flex",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "2px"
          }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === "grid" ? "var(--color-primary-light)" : "transparent",
                color: viewMode === "grid" ? "var(--color-primary)" : "var(--text-muted)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.82rem",
                fontWeight: 600
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                background: viewMode === "list" ? "var(--color-primary-light)" : "transparent",
                color: viewMode === "list" ? "var(--color-primary)" : "var(--text-muted)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.82rem",
                fontWeight: 600
              }}
              title="List View"
            >
              <List size={15} /> List
            </button>
          </div>

          <Link to="/upload" className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.88rem" }}>
            <UploadCloud size={16} /> Verify New Media
          </Link>
        </div>
      </div>

      {toastMessage && (
        <div style={{ padding: "10px 16px", background: "var(--color-real-bg)", border: "1px solid var(--color-real-border)", borderRadius: "8px", color: "var(--color-real)", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-real)" }}><X size={14} /></button>
        </div>
      )}

      {/* Filter and Search Bar Section */}
      <div className="saas-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* Top Row: Search Input + Sort Dropdown + Per Page */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          
          {/* Large Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 320px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={16} color="var(--text-faint)" style={{ position: "absolute", left: "12px", top: "11px" }} />
              <input
                type="text"
                placeholder="Search by file name, verification ID..."
                className="input-field"
                style={{ padding: "8px 14px 8px 36px", fontSize: "0.88rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); fetchHistory(""); }}
                  style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600 }}>
              Search
            </button>
          </form>

          {/* Sort Dropdown & Items Per Page */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="input-field"
                style={{ padding: "7px 12px", fontSize: "0.82rem", width: "auto", cursor: "pointer" }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_score">Highest Authenticity</option>
                <option value="lowest_score">Lowest Authenticity</option>
                <option value="highest_confidence">Highest Confidence</option>
                <option value="lowest_confidence">Lowest Confidence</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="input-field"
                style={{ padding: "7px 10px", fontSize: "0.82rem", width: "auto", cursor: "pointer" }}
              >
                <option value="12">12 / page</option>
                <option value="24">24 / page</option>
                <option value="48">48 / page</option>
              </select>
            </div>
          </div>

        </div>

        {/* Filter Controls Row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            
            {/* Verdict Filter */}
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginRight: "3px" }}>Verdict:</span>
              {[
                { label: "All", val: "all" },
                { label: "Likely Authentic", val: "Likely Authentic" },
                { label: "Likely AI-Generated", val: "Likely AI-Generated" },
                { label: "Likely Manipulated", val: "Likely Manipulated" },
                { label: "Inconclusive", val: "Inconclusive" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => { setVerdictFilter(pill.val); setPage(1); }}
                  style={{
                    background: verdictFilter === pill.val ? "var(--color-primary-light)" : "var(--bg-surface-secondary)",
                    color: verdictFilter === pill.val ? "var(--color-primary)" : "var(--text-secondary)",
                    border: verdictFilter === pill.val ? "1px solid var(--color-primary-border)" : "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "3px 10px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Media Type Filter */}
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginRight: "3px" }}>Type:</span>
              {[
                { label: "All", val: "all" },
                { label: "Images", val: "image" },
                { label: "Videos", val: "video" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => { setMediaTypeFilter(pill.val); setPage(1); }}
                  style={{
                    background: mediaTypeFilter === pill.val ? "var(--color-primary-light)" : "var(--bg-surface-secondary)",
                    color: mediaTypeFilter === pill.val ? "var(--color-primary)" : "var(--text-secondary)",
                    border: mediaTypeFilter === pill.val ? "1px solid var(--color-primary-border)" : "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "3px 10px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginRight: "3px" }}>Date:</span>
              {[
                { label: "All", val: "all" },
                { label: "Today", val: "today" },
                { label: "7 Days", val: "7days" },
                { label: "30 Days", val: "30days" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => { setDateRangeFilter(pill.val); setPage(1); }}
                  style={{
                    background: dateRangeFilter === pill.val ? "var(--color-primary-light)" : "var(--bg-surface-secondary)",
                    color: dateRangeFilter === pill.val ? "var(--color-primary)" : "var(--text-secondary)",
                    border: dateRangeFilter === pill.val ? "1px solid var(--color-primary-border)" : "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "3px 10px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Authenticity Filter */}
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginRight: "3px" }}>Score:</span>
              {[
                { label: "All", val: "all" },
                { label: "High (≥70%)", val: "high" },
                { label: "Medium", val: "medium" },
                { label: "Low (<40%)", val: "low" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => { setAuthenticityFilter(pill.val); setPage(1); }}
                  style={{
                    background: authenticityFilter === pill.val ? "var(--color-primary-light)" : "var(--bg-surface-secondary)",
                    color: authenticityFilter === pill.val ? "var(--color-primary)" : "var(--text-secondary)",
                    border: authenticityFilter === pill.val ? "1px solid var(--color-primary-border)" : "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "3px 10px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

          </div>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-secondary"
              style={{ padding: "4px 10px", fontSize: "0.76rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          )}

        </div>

      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", fontSize: "0.78rem" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Active Filters:</span>
          {search && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Search: "{search}" <X size={11} style={{ cursor: "pointer" }} onClick={() => { setSearch(""); fetchHistory(""); }} />
            </span>
          )}
          {verdictFilter !== "all" && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Verdict: {verdictFilter} <X size={11} style={{ cursor: "pointer" }} onClick={() => setVerdictFilter("all")} />
            </span>
          )}
          {mediaTypeFilter !== "all" && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Type: {mediaTypeFilter.toUpperCase()} <X size={11} style={{ cursor: "pointer" }} onClick={() => setMediaTypeFilter("all")} />
            </span>
          )}
          {dateRangeFilter !== "all" && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Date: {dateRangeFilter} <X size={11} style={{ cursor: "pointer" }} onClick={() => setDateRangeFilter("all")} />
            </span>
          )}
          {authenticityFilter !== "all" && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Score: {authenticityFilter} <X size={11} style={{ cursor: "pointer" }} onClick={() => setAuthenticityFilter("all")} />
            </span>
          )}
          {sortBy !== "newest" && (
            <span className="badge badge-blue" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px" }}>
              Sort: {sortBy} <X size={11} style={{ cursor: "pointer" }} onClick={() => setSortBy("newest")} />
            </span>
          )}
        </div>
      )}

      {/* Main Evidence Content (Grid or List) */}
      {loading ? (
        <div className="saas-card" style={{ padding: "80px 20px", textAlign: "center", color: "var(--color-primary)", fontSize: "0.95rem" }}>
          <div style={{ fontWeight: 600 }}>Loading Evidence Library...</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Retrieving forensic verification records and media previews</div>
        </div>
      ) : historyData.items.length > 0 ? (
        
        viewMode === "grid" ? (
          /* GRID VIEW: 4 columns on large screens, 2 on tablet, 1 on mobile */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "18px"
          }}>
            {historyData.items.map((item) => {
              const isVideo = item.media_type === "video";
              const thumbUrl = api.media.getThumbnailUrl(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewTarget(item)}
                  className="saas-card glass-card-interactive"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer"
                  }}
                >
                  {/* Media Thumbnail Frame */}
                  <div style={{
                    height: "165px",
                    width: "100%",
                    background: "#0b1329",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: "1px solid var(--border-subtle)"
                  }}>
                    <img
                      src={thumbUrl}
                      alt={item.file_name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                    <div style={{ display: "none", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#94a3b8", flexDirection: "column", gap: "4px" }}>
                      {isVideo ? <VideoIcon size={30} /> : <ImageIcon size={30} />}
                      <span style={{ fontSize: "0.72rem" }}>Preview Unavailable</span>
                    </div>

                    {/* Media Type Badge */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      background: "rgba(15, 23, 42, 0.88)",
                      color: "#f8fafc",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {isVideo ? <VideoIcon size={11} /> : <ImageIcon size={11} />}
                      {item.media_type?.toUpperCase()}
                    </div>

                    {/* Verdict Pill Overlay */}
                    <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                      {renderVerdictBadge(item.verdict)}
                    </div>

                    {/* Quick Preview Hover Overlay Icon */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        right: "6px",
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600
                      }}
                      title="Quick Preview"
                    >
                      <Maximize2 size={11} /> Preview
                    </div>
                  </div>

                  {/* Card Details */}
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    <div>
                      <div
                        style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={item.file_name}
                      >
                        {item.file_name}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        <span className="mono-text">ID: {item.id}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Authenticity & Confidence Progress */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", background: "var(--bg-surface-secondary)", padding: "8px 10px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Authenticity:</span>
                        <span className="mono-text" style={{ fontWeight: 800, color: "var(--text-main)" }}>{item.authenticity_score}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Confidence:</span>
                        <span className="mono-text" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{Math.round(item.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/result?id=${item.id}`)}
                        className="btn-secondary"
                        style={{ padding: "5px 9px", fontSize: "0.74rem", color: "var(--color-primary)" }}
                      >
                        <Eye size={12} /> View
                      </button>

                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => navigate(`/compare`)}
                          className="btn-secondary"
                          style={{ padding: "5px 7px", fontSize: "0.74rem" }}
                          title="Compare Media"
                        >
                          <GitCompare size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(item.id, e)}
                          className="btn-secondary"
                          style={{ padding: "5px 7px", fontSize: "0.74rem" }}
                          title="Download PDF Report"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                          className="btn-secondary"
                          style={{ padding: "5px 7px", fontSize: "0.74rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
                          title="Delete Verification"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW: Compact forensic audit table */
          <div className="saas-card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", width: "70px" }}>Media</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>File Details & ID</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Verdict</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Authenticity</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Confidence</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.items.map((row) => {
                    const isVideo = row.media_type === "video";
                    const thumbUrl = api.media.getThumbnailUrl(row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setPreviewTarget(row)}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          background: "var(--bg-surface)",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-secondary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
                      >
                        {/* Thumbnail */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{
                            width: "52px",
                            height: "40px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#0b1329",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--border-subtle)"
                          }}>
                            <img
                              src={thumbUrl}
                              alt={row.file_name}
                              loading="lazy"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                            <div style={{ display: "none", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#94a3b8" }}>
                              {isVideo ? <VideoIcon size={16} /> : <ImageIcon size={16} />}
                            </div>
                            {isVideo && (
                              <div style={{
                                position: "absolute",
                                bottom: "1px",
                                right: "1px",
                                background: "rgba(15, 23, 42, 0.85)",
                                color: "#f8fafc",
                                fontSize: "0.5rem",
                                fontWeight: 700,
                                padding: "1px 3px",
                                borderRadius: "2px"
                              }}>
                                V
                              </div>
                            )}
                          </div>
                        </td>

                        {/* File Details */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                            {row.file_name}
                          </div>
                          <div className="mono-text" style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                            {row.id} • <span style={{ textTransform: "uppercase" }}>{row.media_type}</span>
                          </div>
                        </td>

                        {/* Verdict */}
                        <td style={{ padding: "10px 16px" }}>
                          {renderVerdictBadge(row.verdict)}
                        </td>

                        {/* Authenticity */}
                        <td style={{ padding: "10px 16px" }}>
                          <span className="mono-text" style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)" }}>
                            {row.authenticity_score}%
                          </span>
                        </td>

                        {/* Confidence */}
                        <td style={{ padding: "10px 16px" }}>
                          <span className="mono-text" style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 600 }}>
                            {Math.round(row.confidence * 100)}%
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "10px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setPreviewTarget(row)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                              title="Quick Preview"
                            >
                              <Maximize2 size={12} />
                            </button>
                            <button
                              onClick={() => navigate(`/result?id=${row.id}`)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.74rem", color: "var(--color-primary)" }}
                              title="View Full Result"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => navigate(`/compare`)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                              title="Compare Mode"
                            >
                              <GitCompare size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDownloadPdf(row.id, e)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                              title="Download PDF"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(row);
                              }}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.74rem", color: "var(--color-fake)", borderColor: "var(--color-fake-border)" }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* EMPTY STATE */
        <div className="saas-card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <UploadCloud size={44} color="var(--text-faint)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 6px 0" }}>
            {hasActiveFilters ? "No matching evidence found" : "No verification history yet"}
          </h3>
          <p style={{ fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto 18px auto" }}>
            {hasActiveFilters
              ? "No media verifications matched your current search and filter criteria. Try adjusting or clearing your filters."
              : "Upload your first image or video to begin forensic analysis and build your evidence library."}
          </p>
          {hasActiveFilters ? (
            <button onClick={handleClearFilters} className="btn-secondary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
              <RotateCcw size={14} /> Clear All Filters
            </button>
          ) : (
            <Link to="/upload" className="btn-primary" style={{ padding: "9px 22px", fontSize: "0.88rem" }}>
              <span>Verify New Media →</span>
            </Link>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="saas-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing {startItemIndex}–{endItemIndex} of {historyData.total} evidence items
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary"
              style={{ padding: "5px 10px", fontSize: "0.78rem" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {/* Page number indicators */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    background: page === pageNum ? "var(--color-primary)" : "var(--bg-surface-secondary)",
                    color: page === pageNum ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary"
              style={{ padding: "5px 10px", fontSize: "0.78rem" }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewTarget && (
        <EvidencePreviewModal
          item={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}

      {/* Delete Verification Confirmation Modal */}
      {deleteTarget && (
        <DeleteVerificationModal
          verificationId={deleteTarget.id}
          fileName={deleteTarget.file_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
};
