from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    verifications = relationship("Verification", back_populates="user", cascade="all, delete-orphan")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=True)  # SHA-256 cryptographic hash of 6-digit OTP
    otp_code = Column(String(6), nullable=True)  # Maintained for backward compatibility
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
    reset_token_hash = Column(String, index=True, nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String, primary_key=True, index=True)  # e.g., VS-000001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    media_type = Column(String, nullable=False)  # 'image' | 'video'
    verdict = Column(String, nullable=False)  # 'Likely Real' | 'Likely Manipulated' | 'Inconclusive'
    authenticity_score = Column(Integer, nullable=False)  # 0 - 100
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    modules_json = Column(Text, nullable=False)  # JSON serialized dict
    evidence_json = Column(Text, nullable=False)  # JSON serialized list
    timeline_json = Column(Text, nullable=True, default="[]")  # JSON serialized list of timeline steps
    performance_json = Column(Text, nullable=True, default="{}")  # JSON serialized performance summary
    
    # Media Storage & Technical Metadata for Previews & Reports
    media_path = Column(String, nullable=True)  # Local file path to stored original/safe media
    thumbnail_path = Column(String, nullable=True)  # Local file path to generated thumbnail
    file_size = Column(Integer, nullable=True)  # File size in bytes
    mime_type = Column(String, nullable=True)  # e.g. image/jpeg, video/mp4
    width = Column(Integer, nullable=True)  # Width in pixels
    height = Column(Integer, nullable=True)  # Height in pixels
    duration = Column(Float, nullable=True)  # Duration in seconds for video
    sha256_hash = Column(String, nullable=True)  # SHA-256 cryptographic image hash

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="verifications")


# Composite index for rapid user history & dashboard aggregation
Index("ix_verifications_user_created", Verification.user_id, Verification.created_at.desc())
