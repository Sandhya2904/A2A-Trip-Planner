from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

from app.services.auth_service import AuthService


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RequestOtpPayload(BaseModel):
    identifier: str = Field(
        ...,
        min_length=4,
        description="Email or phone number.",
    )
    name: Optional[str] = Field(
        default=None,
        description="Optional user name.",
    )


class VerifyOtpPayload(BaseModel):
    identifier: str = Field(
        ...,
        min_length=4,
        description="Email or phone number.",
    )
    otp: str = Field(
        ...,
        min_length=4,
        max_length=8,
        description="OTP entered by user.",
    )
    name: Optional[str] = Field(
        default=None,
        description="Optional user name.",
    )


class LogoutPayload(BaseModel):
    token: str = Field(
        ...,
        min_length=10,
        description="Session token.",
    )


@router.post("/request-otp")
async def request_otp(payload: RequestOtpPayload) -> Dict[str, Any]:
    service = AuthService()

    return service.request_otp(
        identifier=payload.identifier,
        name=payload.name,
    )


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpPayload) -> Dict[str, Any]:
    service = AuthService()

    return service.verify_otp(
        identifier=payload.identifier,
        otp=payload.otp,
        name=payload.name,
    )


@router.get("/me")
async def get_me(
    authorization: str | None = Header(default=None),
) -> Dict[str, Any]:
    token = ""

    if authorization:
        token = authorization.replace("Bearer ", "").strip()

    service = AuthService()

    return service.get_current_user(token=token)


@router.post("/logout")
async def logout(payload: LogoutPayload) -> Dict[str, Any]:
    service = AuthService()

    return service.logout(token=payload.token)