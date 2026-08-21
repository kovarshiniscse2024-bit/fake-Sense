import os
import sys
import smtplib
import secrets
import hashlib
import hmac
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Ensure .env is loaded from backend/.env or workspace root
load_dotenv()
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path, override=False)


def get_smtp_config() -> Dict[str, Any]:
    """Retrieve SMTP / Email configuration from environment variables with fallback aliases."""
    host = (os.getenv("SMTP_HOST") or os.getenv("EMAIL_HOST") or "").strip()
    port_str = (os.getenv("SMTP_PORT") or os.getenv("EMAIL_PORT") or "587").strip()
    try:
        port = int(port_str)
    except ValueError:
        port = 587

    user = (os.getenv("SMTP_USER") or os.getenv("EMAIL_USERNAME") or os.getenv("EMAIL_USER") or "").strip()
    password = (os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD") or "").strip()

    # If from_email is not specified or left as default placeholder, use SMTP_USER if it's an email
    raw_from = (os.getenv("SMTP_FROM_EMAIL") or os.getenv("EMAIL_FROM") or "").strip()
    if not raw_from:
        from_email = user if ("@" in user) else "security@fakesense.ai"
    else:
        from_email = raw_from

    use_tls_str = (os.getenv("SMTP_USE_TLS") or os.getenv("EMAIL_USE_TLS") or "true").strip()
    use_tls = use_tls_str.lower() in ("true", "1", "yes")
    use_ssl_str = (os.getenv("SMTP_USE_SSL") or os.getenv("EMAIL_USE_SSL") or "false").strip()
    use_ssl = use_ssl_str.lower() in ("true", "1", "yes") or port == 465

    # Check if real credentials are fully configured (and not just default placeholder text)
    is_configured = bool(
        host
        and user
        and password
        and "your_16_character_app_password" not in password
        and "your_gmail_16_char_app_password" not in password
    )

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_email": from_email,
        "use_tls": use_tls,
        "use_ssl": use_ssl,
        "is_configured": is_configured
    }


def is_dev_mode() -> bool:
    """Returns True if DEV_MODE is explicitly enabled in environment variables."""
    val = (os.getenv("DEV_MODE") or "false").strip().lower()
    return val in ("true", "1", "yes")


def generate_secure_otp(length: int = 6) -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return str(secrets.randbelow(900000) + 100000)


def generate_reset_token() -> str:
    """Generate a cryptographically secure short-lived reset authorization token."""
    return secrets.token_urlsafe(32)


def hash_secret(value: str) -> str:
    """Compute SHA-256 cryptographic hash of a secret (OTP or token)."""
    return hashlib.sha256(value.strip().encode("utf-8")).hexdigest()


def verify_secret_hash(plain_value: str, hashed_value: Optional[str]) -> bool:
    """Safely verify a plain secret against its SHA-256 hash using constant-time comparison."""
    if not hashed_value:
        return False
    computed = hash_secret(plain_value)
    return hmac.compare_digest(computed, hashed_value)


def send_password_reset_otp(email: str, otp_code: str, expires_in_minutes: int = 10) -> Dict[str, Any]:
    """
    Dispatches a FakeSense password reset verification code to the specified email.
    If SMTP credentials are provided, transmits a polished HTML/text email via SMTP.
    Otherwise, logs cleanly to the server console for local testing.
    """
    cfg = get_smtp_config()
    subject = "FakeSense Password Reset Verification Code"

    # Plain text fallback version
    text_content = f"""FakeSense Media Forensics Platform
Password Reset Request

We received a request to reset your FakeSense account password.

Your 6-digit verification code is:
{otp_code}

This code expires in {expires_in_minutes} minutes.

If you did not request a password reset, you can safely ignore this email.
For security reasons, never share this code with anyone.

--
FakeSense Security Team
"""

    # Rich responsive HTML formatted version
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FakeSense Password Reset</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 14px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }}
    .logo-row {{ display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }}
    .logo-text {{ font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: -0.02em; }}
    .badge {{ background: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 6px; }}
    .title {{ font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
    .subtitle {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
    .otp-card {{ background: #080d1a; border: 2px dashed #0284c7; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0; }}
    .otp-code {{ font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; line-height: 1; }}
    .expiry {{ font-size: 12px; color: #64748b; margin-top: 10px; }}
    .notice {{ font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 16px 0; }}
    .warning {{ font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px; padding: 12px; margin-top: 24px; }}
    .footer {{ font-size: 11px; color: #475569; margin-top: 32px; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-row">
      <span class="logo-text">&#x1F6E1;&#xFE0F; FakeSense</span>
      <span class="badge">AI Forensics</span>
    </div>
    <div class="title">Password Reset Request</div>
    <p class="subtitle">
      We received a request to reset your FakeSense account password.
    </p>
    <div class="notice">
      Your 6-digit verification code is:
    </div>
    <div class="otp-card">
      <div class="otp-code">{otp_code}</div>
      <div class="expiry">This code expires in {expires_in_minutes} minutes.</div>
    </div>
    <p class="notice">
      Enter this code on the password reset page to choose a new password.
      If you did not request a password reset, you can safely ignore this email.
    </p>
    <div class="warning">
      &#x1F512; <strong>For security reasons, never share this code with anyone.</strong> FakeSense team members will never ask for your verification code.
    </div>
    <div class="footer">
      FakeSense Media Verification & Digital Forensics System &copy; 2026<br>
      Automated security notification &bull; Do not reply to this email.
    </div>
  </div>
</body>
</html>"""

    # Check if real SMTP credentials are configured
    if cfg["is_configured"]:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = formataddr(("FakeSense Security", cfg["from_email"]))
            msg["To"] = email

            part_text = MIMEText(text_content, "plain", "utf-8")
            part_html = MIMEText(html_content, "html", "utf-8")
            msg.attach(part_text)
            msg.attach(part_html)

            if cfg["use_ssl"]:
                server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=15)
            else:
                server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=15)
                if cfg["use_tls"]:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()

            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from_email"], [email], msg.as_string())
            server.quit()

            print(f"[EMAIL SERVICE] Successfully delivered verification code to {email} via SMTP ({cfg['host']})")
            return {
                "success": True,
                "mode": "smtp",
                "email": email,
                "dev_otp": None,  # Hidden when real email is delivered
                "message": f"Verification code sent to {email}"
            }
        except smtplib.SMTPAuthenticationError as auth_err:
            error_msg = (
                f"SMTP Authentication Failed: {auth_err}. "
                "If using Gmail, make sure you are using a 16-character Google App Password (not your personal password)."
            )
            print(f"[EMAIL SERVICE ERROR] {error_msg}")
            return {
                "success": False,
                "mode": "smtp_auth_error",
                "email": email,
                "error": error_msg,
                "dev_otp": otp_code if is_dev_mode() else None,
                "message": error_msg
            }
        except Exception as e:
            error_msg = f"SMTP transmission failed: {e}"
            print(f"[EMAIL SERVICE ERROR] {error_msg}")
            return {
                "success": False,
                "mode": "smtp_error",
                "email": email,
                "error": error_msg,
                "dev_otp": otp_code if is_dev_mode() else None,
                "message": error_msg
            }

    # Simulation mode (when SMTP is not configured or in dev mode)
    print("=" * 65)
    print(f"[FAKESENSE EMAIL DISPATCH (Simulation Mode)] To: {email}")
    print(f"[ONE-TIME PASSWORD]: {otp_code}")
    print(f"[EXPIRES IN]: {expires_in_minutes} minutes")
    print("=" * 65)

    return {
        "success": True,
        "mode": "simulation",
        "email": email,
        "dev_otp": otp_code if is_dev_mode() else None,
        "message": f"Verification code processed for {email}."
    }


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    print(f"Testing FakeSense Email Service for target: {target}...")
    cfg = get_smtp_config()
    print(f"SMTP Configured: {cfg['is_configured']} (Host: {cfg['host']}, Port: {cfg['port']}, User: {cfg['user']})")
    res = send_password_reset_otp(target, "123456", expires_in_minutes=10)
    print(f"Result: {res}")
