from datetime import datetime, timedelta
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, PasswordResetOTP
from ..schemas.auth import (
    UserRegister,
    UserLogin,
    UserOut,
    TokenResponse,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    VerifyOTPResponse,
    ResetPasswordRequest,
    AuthMessageResponse
)
from ..auth.security import verify_password, get_password_hash, create_access_token
from ..auth.dependencies import get_current_user
from ..services.email_service import (
    generate_secure_otp,
    generate_reset_token,
    hash_secret,
    verify_secret_hash,
    send_password_reset_otp,
    is_dev_mode
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def validate_password_strength(password: str) -> Optional[str]:
    """
    Enforces password complexity requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        return "Password must be at least 8 characters in length."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\/~`']", password):
        return "Password must contain at least one special character."
    return None


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(email=clean_email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=AuthMessageResponse)
@router.post("/forgot-password/request", response_model=AuthMessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password reset by generating a secure 6-digit OTP and sending it to the user's email.
    Includes rate limiting, cooldown protection, and anti-enumeration security.
    """
    clean_email = req.email.lower().strip()
    now = datetime.utcnow()

    # Rate limiting: Check number of OTP requests in the last 15 minutes for this email
    fifteen_mins_ago = now - timedelta(minutes=15)
    recent_requests_count = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == clean_email,
        PasswordResetOTP.created_at >= fifteen_mins_ago
    ).count()

    if recent_requests_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

    # Cooldown & active OTP check:
    last_otp = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == clean_email
    ).order_by(PasswordResetOTP.id.desc()).first()

    # Check if user exists (Anti-Enumeration)
    user = db.query(User).filter(User.email == clean_email).first()

    # Cooldown check: prevent requesting a new code within 60 seconds
    if last_otp and (now - last_otp.created_at).total_seconds() < 60:
        wait_seconds = int(60 - (now - last_otp.created_at).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {max(1, wait_seconds)} seconds before requesting another code."
        )

    email_result = {}

    if user:
        # Invalidate any existing unused OTPs for this email
        db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == clean_email,
            PasswordResetOTP.is_used == False
        ).update({"is_used": True})

        # Generate cryptographically secure 6-digit numeric OTP
        otp_code = generate_secure_otp(6)
        otp_hash_val = hash_secret(otp_code)
        expires_at = now + timedelta(minutes=10)

        otp_record = PasswordResetOTP(
            email=clean_email,
            otp_hash=otp_hash_val,
            otp_code=otp_code,  # Stored for dev debugging
            created_at=now,
            expires_at=expires_at,
            attempt_count=0,
            is_used=False
        )
        db.add(otp_record)
        db.commit()

        # Dispatch email
        email_result = send_password_reset_otp(clean_email, otp_code, expires_in_minutes=10)

    return AuthMessageResponse(
        status="success",
        message="If an account exists for this email, a verification code has been sent.",
        email=clean_email,
        dev_otp=email_result.get("dev_otp") if (user and is_dev_mode()) else None,
        expires_in_seconds=600
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
@router.post("/forgot-password/verify", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Validates the 6-digit OTP code against brute force limits and expiration.
    Upon successful validation, issues a short-lived single-use reset authorization token.
    """
    clean_email = req.email.lower().strip()
    clean_code = req.otp_code.strip()
    now = datetime.utcnow()

    # Find the active unexpired OTP record
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == clean_email,
        PasswordResetOTP.is_used == False
    ).order_by(PasswordResetOTP.id.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check the code and try again."
        )

    # Check expiration
    if otp_record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification code has expired. Please request a new code."
        )

    # Check attempt count limit (max 5 failed attempts)
    if otp_record.attempt_count >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Please request a new code."
        )

    # Compare OTP securely (check hash or fallback legacy code)
    is_valid = False
    if otp_record.otp_hash:
        is_valid = verify_secret_hash(clean_code, otp_record.otp_hash)
    elif otp_record.otp_code:
        is_valid = (clean_code == otp_record.otp_code)

    if not is_valid:
        otp_record.attempt_count += 1
        if otp_record.attempt_count >= 5:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new code."
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check the code and try again."
        )

    # Generate single-use reset authorization token (valid for 15 minutes)
    reset_token = generate_reset_token()
    token_hash_val = hash_secret(reset_token)

    otp_record.verified_at = now
    otp_record.reset_token_hash = token_hash_val
    otp_record.reset_token_expires_at = now + timedelta(minutes=15)
    db.commit()

    return VerifyOTPResponse(
        status="success",
        message="Verification code verified successfully.",
        email=clean_email,
        reset_token=reset_token
    )


@router.post("/reset-password", response_model=AuthMessageResponse)
@router.post("/forgot-password/reset", response_model=AuthMessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validates reset authorization token (or verified OTP) and applies the new password
    after strict password complexity validation.
    """
    now = datetime.utcnow()
    target_email = None
    target_otp_record = None

    # Scenario A: Authorized via reset_token
    if req.reset_token:
        token_hash_val = hash_secret(req.reset_token)
        target_otp_record = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.reset_token_hash == token_hash_val,
            PasswordResetOTP.is_used == False,
            PasswordResetOTP.verified_at.isnot(None)
        ).first()

        if not target_otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used password reset token. Please request a new code."
            )

        if target_otp_record.reset_token_expires_at and target_otp_record.reset_token_expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This password reset token has expired. Please request a new code."
            )

        target_email = target_otp_record.email

    # Scenario B: Legacy/Direct OTP verification (if email & otp_code passed)
    elif req.email and req.otp_code:
        clean_email = req.email.lower().strip()
        clean_code = req.otp_code.strip()
        target_otp_record = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == clean_email,
            PasswordResetOTP.is_used == False
        ).order_by(PasswordResetOTP.id.desc()).first()

        if not target_otp_record or target_otp_record.expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code."
            )

        is_valid = False
        if target_otp_record.otp_hash:
            is_valid = verify_secret_hash(clean_code, target_otp_record.otp_hash)
        elif target_otp_record.otp_code:
            is_valid = (clean_code == target_otp_record.otp_code)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code."
            )

        target_email = clean_email
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid reset token is required to reset password."
        )

    # Password confirmation match check
    if req.confirm_password is not None and req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The re-entered password does not match the new password."
        )

    # Password complexity validation
    strength_err = validate_password_strength(req.new_password)
    if strength_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=strength_err
        )

    # Find User account
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    # Hash and save new password
    user.password_hash = get_password_hash(req.new_password)

    # Invalidate this OTP / reset token and all prior OTPs for this email
    if target_otp_record:
        target_otp_record.is_used = True
        target_otp_record.used_at = now

    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == target_email
    ).update({"is_used": True})

    db.commit()

    return AuthMessageResponse(
        status="success",
        message="Your FakeSense password has been successfully updated. You can now sign in with your new credentials.",
        email=target_email
    )
