import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.resetSuccess) {
      setSuccessMsg("Password reset successfully! Please sign in with your new credentials.");
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("researcher@fakesense.ai");
    setPassword("SecurePassword123!");
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="saas-card animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "32px 28px", boxShadow: "var(--shadow-md)" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            boxShadow: "0 1px 3px rgba(37, 99, 235, 0.3)"
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", margin: "0 0 4px 0" }}>
            Welcome to FakeSense
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
            Sign in to access your media forensics workspace
          </p>
        </div>

        {/* Success Alert (e.g., after password reset) */}
        {successMsg && (
          <div style={{
            padding: "8px 12px",
            background: "var(--color-real-bg)",
            border: "1px solid var(--color-real-border)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-real)",
            fontSize: "0.82rem",
            marginBottom: "16px"
          }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "8px 12px",
            background: "var(--color-fake-bg)",
            border: "1px solid var(--color-fake-border)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-fake)",
            fontSize: "0.82rem",
            marginBottom: "16px"
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
              <input
                type="email"
                required
                className="input-field"
                style={{ paddingLeft: "36px" }}
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field"
                style={{ paddingLeft: "36px", paddingRight: "36px" }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "10px", marginTop: "4px" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Demo Quick Auto-Fill */}
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn-secondary"
            style={{ width: "100%", padding: "7px", fontSize: "0.78rem", color: "var(--color-primary)" }}
          >
            <Sparkles size={13} /> Auto-fill Demo Credentials
          </button>
        </div>

        {/* Toggle Register */}
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};
