import os
import pytest
from datetime import datetime, timedelta

os.environ["DEV_MODE"] = "true"

from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal
from backend.db.models import User, PasswordResetOTP
from backend.auth.security import get_password_hash

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_full_secure_password_reset_flow(db_session):
    """TEST 1 & 10: Complete happy path with reset_token authorization and password login verification."""
    test_email = "secure_tester@fakesense.ai"
    test_old_pass = "OldPassword123!"
    test_new_pass = "NewSecurePassword999!"

    # Clean up test user
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    # Create user
    user = User(email=test_email, password_hash=get_password_hash(test_old_pass))
    db_session.add(user)
    db_session.commit()

    # 1. Request OTP
    res = client.post("/auth/forgot-password", json={"email": test_email})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "success"
    assert "If an account exists for this email" in data["message"]
    otp_code = data.get("dev_otp")
    assert otp_code is not None and len(otp_code) == 6

    # 2. Verify OTP -> Receive short-lived reset authorization token
    verify_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert verify_res.status_code == 200, verify_res.text
    v_data = verify_res.json()
    assert v_data["status"] == "success"
    reset_token = v_data.get("reset_token")
    assert reset_token is not None and len(reset_token) > 10

    # 3. Reset password using validated reset_token
    reset_res = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": test_new_pass,
        "confirm_password": test_new_pass
    })
    assert reset_res.status_code == 200, reset_res.text
    assert "successfully updated" in reset_res.json()["message"]

    # 4. Old password login must fail
    old_login = client.post("/auth/login", json={"email": test_email, "password": test_old_pass})
    assert old_login.status_code == 401

    # 5. New password login must succeed
    new_login = client.post("/auth/login", json={"email": test_email, "password": test_new_pass})
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_wrong_otp_rejected(db_session):
    """TEST 2: Invalid OTP code is safely rejected."""
    test_email = "wrong_otp_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    client.post("/auth/forgot-password", json={"email": test_email})
    bad_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": "000000"})
    assert bad_res.status_code == 400
    assert "Invalid verification code" in bad_res.json()["detail"]


def test_expired_otp_rejected(db_session):
    """TEST 3: Expired OTP is rejected."""
    test_email = "expired_otp_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/auth/forgot-password", json={"email": test_email})
    otp_code = res.json()["dev_otp"]

    # Fast forward expiration in database
    db_record = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).order_by(PasswordResetOTP.id.desc()).first()
    db_record.expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    verify_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json()["detail"].lower()


def test_max_attempts_invalidates_otp(db_session):
    """TEST 5: Exceeding 5 incorrect attempts permanently invalidates the OTP."""
    test_email = "brute_force_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/auth/forgot-password", json={"email": test_email})
    valid_otp = res.json()["dev_otp"]

    # 4 incorrect attempts
    for _ in range(4):
        bad = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": "999999"})
        assert bad.status_code == 400

    # 5th attempt invalidates OTP
    fifth = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": "999999"})
    assert fifth.status_code == 400
    assert "Too many incorrect attempts" in fifth.json()["detail"]

    # Attempting with the correct OTP now fails
    attempt_after = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": valid_otp})
    assert attempt_after.status_code == 400


def test_resend_otp_invalidates_old_otp(db_session):
    """TEST 6: Generating a new OTP invalidates the older OTP."""
    test_email = "resend_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    # 1. First OTP
    res1 = client.post("/auth/forgot-password", json={"email": test_email})
    otp1 = res1.json()["dev_otp"]

    # Bypass 60s cooldown by setting created_at to 2 minutes ago
    db_record = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).order_by(PasswordResetOTP.id.desc()).first()
    db_record.created_at = datetime.utcnow() - timedelta(minutes=2)
    db_session.commit()

    # 2. Resend OTP
    res2 = client.post("/auth/forgot-password", json={"email": test_email})
    otp2 = res2.json()["dev_otp"]
    assert otp1 != otp2

    # 3. Old OTP must fail
    old_verify = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp1})
    assert old_verify.status_code == 400

    # 4. New OTP must succeed
    new_verify = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp2})
    assert new_verify.status_code == 200


def test_unregistered_email_generic_anti_enumeration():
    """TEST 7: Unregistered email returns generic success to prevent account enumeration."""
    res = client.post("/auth/forgot-password", json={"email": "nonexistent_victim_8849@domain.org"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "If an account exists" in data["message"]
    # dev_otp should not be provided for non-existent users
    assert data.get("dev_otp") is None


def test_password_complexity_and_mismatch_validation(db_session):
    """TEST 8 & 9: Backend enforces password complexity and matching confirmation."""
    test_email = "complexity_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/auth/forgot-password", json={"email": test_email})
    otp_code = res.json()["dev_otp"]

    verify_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    reset_token = verify_res.json()["reset_token"]

    # 1. Password mismatch
    mismatch_res = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "ValidPassword123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert mismatch_res.status_code == 400
    assert "match" in mismatch_res.json()["detail"].lower()

    # 2. Too short (< 8 chars)
    short_res = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "Pass1!",
        "confirm_password": "Pass1!"
    })
    assert short_res.status_code == 400
    assert "8 characters" in short_res.json()["detail"]

    # 3. Missing special char
    no_spec_res = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "Password1234",
        "confirm_password": "Password1234"
    })
    assert no_spec_res.status_code == 400
    assert "special character" in no_spec_res.json()["detail"]


def test_reset_token_reuse_rejected(db_session):
    """TEST 11: Single-use reset token cannot be reused after password update."""
    test_email = "token_reuse_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/auth/forgot-password", json={"email": test_email})
    otp_code = res.json()["dev_otp"]
    v_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    reset_token = v_res.json()["reset_token"]

    # First reset works
    r1 = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!"
    })
    assert r1.status_code == 200

    # Second reset with same token must fail
    r2 = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "AnotherNewPassword999!",
        "confirm_password": "AnotherNewPassword999!"
    })
    assert r2.status_code == 400
    assert "invalid or already used" in r2.json()["detail"].lower()


def test_expired_reset_token_rejected(db_session):
    """TEST 12: Expired reset authorization token is rejected."""
    test_email = "expired_token_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    res = client.post("/auth/forgot-password", json={"email": test_email})
    otp_code = res.json()["dev_otp"]
    v_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    reset_token = v_res.json()["reset_token"]

    # Fast-forward reset token expiration in DB
    db_record = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).order_by(PasswordResetOTP.id.desc()).first()
    db_record.reset_token_expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    r = client.post("/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "ValidPassword999!",
        "confirm_password": "ValidPassword999!"
    })
    assert r.status_code == 400
    assert "expired" in r.json()["detail"].lower()


def test_rate_limiting_and_cooldown(db_session):
    """TEST 14: Rate limit of max 3 OTP requests in 15 minutes and 60-second cooldown."""
    test_email = "ratelimit_user@fakesense.ai"
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    user = User(email=test_email, password_hash=get_password_hash("Password123!"))
    db_session.add(user)
    db_session.commit()

    # 1. First request succeeds
    r1 = client.post("/auth/forgot-password", json={"email": test_email})
    assert r1.status_code == 200

    # 2. Immediate second request hits 60s cooldown
    r2 = client.post("/auth/forgot-password", json={"email": test_email})
    assert r2.status_code == 429
    assert "wait" in r2.json()["detail"].lower()

    # Bypass cooldown by setting created_at to 3 minutes ago
    db_records = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).all()
    for rec in db_records:
        rec.created_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    # 3. Second request succeeds
    r3 = client.post("/auth/forgot-password", json={"email": test_email})
    assert r3.status_code == 200

    # Bypass cooldown again
    db_records = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).all()
    for rec in db_records:
        rec.created_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    # 4. Third request succeeds
    r4 = client.post("/auth/forgot-password", json={"email": test_email})
    assert r4.status_code == 200

    # Bypass cooldown again
    db_records = db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).all()
    for rec in db_records:
        rec.created_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    # 5. 4th request in 15 minutes exceeds 3-per-15-min rate limit
    r5 = client.post("/auth/forgot-password", json={"email": test_email})
    assert r5.status_code == 429
    assert "Too many requests" in r5.json()["detail"]


def test_e2e_register_forgot_reset_and_access_dashboard(db_session):
    """TEST 15: Complete lifecycle - Register account -> Request reset -> Update password -> Login -> Access /auth/me and /dashboard/summary."""
    test_email = "lifecycle_user@fakesense.ai"
    initial_pass = "InitialPass123!"
    final_pass = "FinalUpdatedPass999!"

    # Clean up
    db_session.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).delete()
    db_session.query(User).filter(User.email == test_email).delete()
    db_session.commit()

    # 1. Register new user
    reg_res = client.post("/auth/register", json={"email": test_email, "password": initial_pass})
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]

    # 2. Request OTP
    req_res = client.post("/auth/forgot-password", json={"email": test_email})
    assert req_res.status_code == 200
    otp = req_res.json()["dev_otp"]

    # 3. Verify OTP
    v_res = client.post("/auth/verify-otp", json={"email": test_email, "otp_code": otp})
    assert v_res.status_code == 200
    token = v_res.json()["reset_token"]

    # 4. Reset password
    rst_res = client.post("/auth/reset-password", json={
        "reset_token": token,
        "new_password": final_pass,
        "confirm_password": final_pass
    })
    assert rst_res.status_code == 200

    # 5. Login with new credentials
    login_res = client.post("/auth/login", json={"email": test_email, "password": final_pass})
    assert login_res.status_code == 200
    jwt_token = login_res.json()["access_token"]

    # 6. Access protected /auth/me
    auth_headers = {"Authorization": f"Bearer {jwt_token}"}
    me_res = client.get("/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    assert me_res.json()["id"] == user_id

    # 7. Access protected dashboard
    dash_res = client.get("/dashboard/summary", headers=auth_headers)
    assert dash_res.status_code == 200

