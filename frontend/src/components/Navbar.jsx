import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LayoutDashboard, UploadCloud, History, LogOut, GitCompare } from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/upload", label: "Verify Media", icon: UploadCloud },
    { to: "/compare", label: "Compare", icon: GitCompare },
    { to: "/history", label: "History", icon: History },
  ];

  return (
    <header style={{
      background: "var(--bg-header)",
      borderBottom: "1px solid var(--bg-header-border)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
    }}>
      <div style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px"
      }}>
        
        {/* Brand Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/login"} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg, #2563eb, #0284c7)",
            padding: "7px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.18rem", letterSpacing: "-0.025em", color: "#f8fafc", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>FakeSense</span>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.15)",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(56, 189, 248, 0.3)"
              }}>
                AI
              </span>
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Media Forensics Platform
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to === "/upload" && (location.pathname === "/analysis" || location.pathname === "/result"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                    background: isActive ? "#2563eb" : "transparent",
                    color: isActive ? "#ffffff" : "#94a3b8",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#f8fafc";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Status / Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isAuthenticated && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 10px",
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px"
              }}>
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#ffffff"
                }}>
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 500, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#94a3b8",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                }}
                title="Sign out of FakeSense"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
