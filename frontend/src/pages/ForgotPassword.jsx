import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import {
  ShieldCheck,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Check,
  X
} from "lucide-react";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-step workflow:
  // 1 = Forgot Password (Enter Email)
  // 2 = Verification Code (Enter 6-Digit OTP)
  // 3 = Create New Password (Password & Confirm Password)
  // 4 = Password Reset Successful
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  // Resend cooldown timer in seconds (60s cooldown)
  const [resendCooldown, setResendCooldown] = useState(60);
  // OTP Expiration timer in seconds (10 minutes = 600s)
  const [expiryTimeLeft, setExpiryTimeLeft] = useState(600);

  const otpInputRef = useRef(null);

  // Handle route-based initial step if navigated directly to /verify-reset-code or /reset-password
  useEffect(() => {
    if (location.pathname === "/verify-reset-code" && !email) {
      // If no email in state, restart at step 1
      setStep(1);
    }
  }, [location.pathname, email]);

  // Resend cooldown countdown effect
  useEffect(() => {
    let timer = null;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  // OTP expiration countdown effect
  useEffect(() => {
    let timer = null;
    if (step === 2 && expiryTimeLeft > 0) {
      timer = setInterval(() => {
        setExpiryTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, expiryTimeLeft]);

  // Auto-focus OTP input when entering step 2
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Password rules validation logic
  const passwordValidation = useMemo(() => {
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/~`']/.test(newPassword);

    const rulesMetCount = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    let strength = "Weak";
    let strengthColor = "var(--color-fake, #ef4444)";
    let strengthScore = 20;

    if (rulesMetCount === 5) {
      strength = "Strong";
      strengthColor = "var(--color-real, #10b981)";
      strengthScore = 100;
    } else if (rulesMetCount >= 4) {
      strength = "Good";
      strengthColor = "var(--color-primary, #2563eb)";
      strengthScore = 80;
    } else if (rulesMetCount >= 2) {
      strength = "Fair";
      strengthColor = "#f59e0b";
      strengthScore = 50;
    }

    const isAllValid = rulesMetCount === 5;
    const match = newPassword && confirmPassword && newPassword === confirmPassword;
    const mismatch = confirmPassword && newPassword !== confirmPassword;

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isAllValid,
      strength,
      strengthColor,
      strengthScore,
      match,
      mismatch
    };
  }, [newPassword, confirmPassword]);

  // Format MM:SS timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // STEP 1: REQUEST VERIFICATION CODE
  // ==========================================
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(cleanEmail);
      setSuccessMsg(res.message || "A verification code has been dispatched to your email.");
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setResendCooldown(60);
      setExpiryTimeLeft(res.expires_in_seconds || 600);
      setStep(2);
    } catch (err) {
      setError(err.message || "Unable to send verification code. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Resend code action
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword(email.trim().toLowerCase());
      setSuccessMsg("A new verification code has been sent to your email.");
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setResendCooldown(60);
      setExpiryTimeLeft(600);
      setOtpCode("");
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP CODE
  // ==========================================
  const handleOtpChange = (e) => {
    // Digits only, maximum 6 characters
    const cleanVal = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleanVal);
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const cleanDigits = pastedData.replace(/\D/g, "").slice(0, 6);
    if (cleanDigits) {
      setOtpCode(cleanDigits);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(email.trim().toLowerCase(), cleanOtp);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setSuccessMsg(res.message || "Verification code confirmed.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 3: RESET PASSWORD
  // ==========================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isAllValid) {
      setError("Please ensure your new password satisfies all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The confirmed password does not match the new password.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        reset_token: resetToken,
        email: email.trim().toLowerCase(),
        otp_code: otpCode.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      };

      const res = await api.auth.resetPassword(payload);
      setSuccessMsg(res.message || "Your password has been successfully reset!");
      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to update password. Your reset session may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div
        className="saas-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "36px 30px",
          boxShadow: "var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.5))",
          borderRadius: "14px",
          border: "1px solid var(--border-subtle, #334155)",
          background: "var(--bg-surface, #0f172a)"
        }}
      >
        {/* Header Icon & Branding */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: step === 4
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, var(--color-primary, #2563eb), #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px auto",
              boxShadow: step === 4
                ? "0 4px 14px rgba(16, 185, 129, 0.3)"
                : "0 4px 14px rgba(37, 99, 235, 0.3)"
            }}
          >
            {step === 4 ? (
              <CheckCircle2 size={26} color="#ffffff" />
            ) : step === 3 ? (
              <Lock size={24} color="#ffffff" />
            ) : step === 2 ? (
              <KeyRound size={24} color="#ffffff" />
            ) : (
              <ShieldCheck size={26} color="#ffffff" />
            )}
          </div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main, #f8fafc)", letterSpacing: "-0.02em", margin: "0 0 6px 0" }}>
            {step === 1 && "Forgot your password?"}
            {step === 2 && "Verify your email"}
            {step === 3 && "Create a new password"}
            {step === 4 && "Password Reset Successful"}
          </h2>

          <p style={{ fontSize: "0.84rem", color: "var(--text-muted, #94a3b8)", margin: 0, lineHeight: 1.5 }}>
            {step === 1 && "Enter the email address associated with your FakeSense account and we'll send you a verification code."}
            {step === 2 && (
              <span>
                Enter the 6-digit verification code sent to: <strong style={{ color: "var(--text-main, #ffffff)" }}>{email}</strong>
              </span>
            )}
            {step === 3 && "Your new password must be different from your previous password."}
            {step === 4 && "Your FakeSense password has been successfully updated."}
          </p>
        </div>

        {/* Step Progress Indicator (Steps 1 to 3) */}
        {step < 4 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "22px" }}>
            {[
              { num: 1, label: "Email" },
              { num: 2, label: "Code" },
              { num: 3, label: "Password" }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: step >= s.num ? "var(--color-primary, #2563eb)" : "var(--bg-surface-tertiary, #1e293b)",
                      color: step >= s.num ? "#ffffff" : "var(--text-muted, #64748b)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: step === s.num ? 700 : 500,
                      color: step === s.num ? "var(--text-main, #f8fafc)" : "var(--text-muted, #64748b)"
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    style={{
                      width: "24px",
                      height: "2px",
                      background: step > s.num ? "var(--color-primary, #2563eb)" : "var(--border-subtle, #334155)",
                      borderRadius: "2px"
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              color: "#f87171",
              fontSize: "0.82rem",
              marginBottom: "18px"
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Success / Status Message Banner */}
        {successMsg && step !== 4 && (
          <div
            className="animate-fade-in"
            style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              color: "#34d399",
              fontSize: "0.82rem",
              marginBottom: "18px"
            }}
          >
            <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ lineHeight: 1.4 }}>{successMsg}</span>
          </div>
        )}


        {/* ======================================================== */}
        {/* STEP 1: Enter Email Form */}
        {/* ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", marginBottom: "6px" }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type="email"
                  required
                  autoFocus
                  className="input-field"
                  style={{ paddingLeft: "36px" }}
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "4px" }}
            >
              {loading ? "Sending code..." : "Send Verification Code"}
              <ArrowRight size={15} />
            </button>

            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  color: "var(--text-muted, #94a3b8)",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Verification Code Page */}
        {/* ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #cbd5e1)" }}>
                  Verification Code
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.78rem",
                    color: expiryTimeLeft < 60 ? "#ef4444" : "var(--text-muted, #94a3b8)"
                  }}
                >
                  <Clock size={13} />
                  <span>Expires in: {formatTimer(expiryTimeLeft)}</span>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <KeyRound size={16} color="var(--text-muted, #64748b)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  autoFocus
                  maxLength={6}
                  className="input-field"
                  style={{
                    paddingLeft: "36px",
                    fontFamily: "monospace",
                    fontSize: "1.2rem",
                    letterSpacing: "6px",
                    fontWeight: 700,
                    textAlign: "left"
                  }}
                  placeholder="••••••"
                  value={otpCode}
                  onChange={handleOtpChange}
                  onPaste={handleOtpPaste}
                />
              </div>
            </div>

            {/* Email Inbox Notice */}
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "0.78rem",
                color: "var(--text-secondary, #cbd5e1)",
                lineHeight: 1.4
              }}
            >
              <Mail size={15} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                Please check your inbox (and spam folder) for your 6-digit verification code.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6 || expiryTimeLeft === 0}
              className="btn-primary"
              style={{ width: "100%", padding: "10px" }}
            >
              {loading ? "Verifying..." : "Verify Code"}
              <ArrowRight size={15} />
            </button>

            {/* Bottom Actions: Back to Email & Resend Code */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={13} /> Change Email
              </button>

              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendCode}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "var(--text-muted, #64748b)" : "var(--color-primary, #38bdf8)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Create New Password Page */}
        {/* ======================================================== */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted, #64748b)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  className="input-field"
                  style={{ paddingLeft: "36px", paddingRight: "36px" }}
                  placeholder="Enter secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    color: "var(--text-muted, #64748b)",
                    cursor: "pointer"
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600 }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Password Strength:</span>
                  <span style={{ color: passwordValidation.strengthColor }}>{passwordValidation.strength}</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "var(--bg-surface-tertiary, #1e293b)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${passwordValidation.strengthScore}%`,
                      height: "100%",
                      background: passwordValidation.strengthColor,
                      transition: "all 0.3s ease"
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #cbd5e1)" }}>
                  Confirm New Password
                </label>
                {passwordValidation.match && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-real, #10b981)", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                    <Check size={12} /> Passwords match
                  </span>
                )}
                {passwordValidation.mismatch && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-fake, #ef4444)", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                    <X size={12} /> Passwords do not match
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted, #64748b)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="input-field"
                  style={{
                    paddingLeft: "36px",
                    paddingRight: "36px",
                    borderColor: passwordValidation.mismatch ? "#ef4444" : passwordValidation.match ? "#10b981" : undefined
                  }}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted, #64748b)",
                    cursor: "pointer"
                  }}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div
              style={{
                padding: "12px",
                background: "var(--bg-surface-secondary, #1e293b)",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle, #334155)",
                fontSize: "0.77rem"
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", marginBottom: "6px" }}>
                Password Requirements:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
                {[
                  { met: passwordValidation.minLength, label: "At least 8 characters" },
                  { met: passwordValidation.hasUpper, label: "One uppercase letter" },
                  { met: passwordValidation.hasLower, label: "One lowercase letter" },
                  { met: passwordValidation.hasNumber, label: "One number" },
                  { met: passwordValidation.hasSpecial, label: "One special character" }
                ].map((req, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: req.met ? "var(--color-real, #10b981)" : "var(--text-muted, #94a3b8)",
                      transition: "color 0.2s ease"
                    }}
                  >
                    {req.met ? <Check size={13} color="var(--color-real, #10b981)" /> : <span style={{ width: "13px", textAlign: "center" }}>•</span>}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isAllValid || !passwordValidation.match}
              className="btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "4px" }}
            >
              {loading ? "Resetting password..." : "Reset Password"}
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 4: Success Page */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "10px 0 6px 0" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                border: "2px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}
            >
              <CheckCircle2 size={34} color="var(--color-real, #10b981)" />
            </div>

            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary, #cbd5e1)", marginBottom: "24px", lineHeight: 1.6 }}>
              Your FakeSense password has been successfully updated. You can now use your new password to sign into your account.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login", { state: { email, resetSuccess: true } })}
              className="btn-primary"
              style={{ width: "100%", padding: "11px" }}
            >
              Back to Login
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
