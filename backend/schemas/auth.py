from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification OTP code")


class VerifyOTPResponse(BaseModel):
    status: str
    message: str
    email: Optional[EmailStr] = None
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    reset_token: Optional[str] = Field(None, description="Short-lived reset authorization token issued after OTP verification")
    email: Optional[EmailStr] = None
    otp_code: Optional[str] = None
    new_password: str = Field(..., description="New password")
    confirm_password: Optional[str] = None


class AuthMessageResponse(BaseModel):
    status: str
    message: str
    email: Optional[EmailStr] = None
    reset_token: Optional[str] = None
    dev_otp: Optional[str] = None
    expires_in_seconds: Optional[int] = None
