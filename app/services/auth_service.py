from __future__ import annotations

import hashlib
import json
import os
import secrets
import smtplib
import ssl
import time
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict, Optional


class AuthService:
    """
    Real email OTP authentication service.

    Current production-safe behavior:
    - Email OTP is sent using SMTP.
    - OTP is not shown on screen anymore.
    - Phone OTP is not faked. It requires a real SMS provider.
    """

    OTP_TTL_SECONDS = 300
    MAX_ATTEMPTS = 5

    def __init__(self) -> None:
        self.project_root = Path(__file__).resolve().parents[2]
        self.data_dir = self.project_root / "data"
        self.users_path = self.data_dir / "auth_users.json"
        self.otp_path = self.data_dir / "auth_otps.json"
        self.sessions_path = self.data_dir / "auth_sessions.json"

        self.data_dir.mkdir(parents=True, exist_ok=True)

    def request_otp(self, *, identifier: str, name: Optional[str] = None) -> Dict[str, Any]:
        clean_identifier = self._clean_identifier(identifier)

        if not clean_identifier:
            return {
                "success": False,
                "message": "Email address is required.",
            }

        if self._identifier_type(clean_identifier) != "email":
            return {
                "success": False,
                "message": "Phone OTP needs an SMS provider. Please use email login for now.",
            }

        otp = self._generate_otp()
        now = int(time.time())

        otps = self._read_json(self.otp_path)

        otps[clean_identifier] = {
            "otp_hash": self._hash_value(otp),
            "name": str(name or "").strip(),
            "expires_at": now + self.OTP_TTL_SECONDS,
            "attempts": 0,
            "created_at": now,
        }

        email_result = self._send_email_otp(
            email=clean_identifier,
            otp=otp,
            name=name or "Traveller",
        )

        if not email_result["success"]:
            return email_result

        self._write_json(self.otp_path, otps)

        return {
            "success": True,
            "message": "OTP sent successfully to your email.",
            "masked_identifier": self._mask_identifier(clean_identifier),
            "expires_in_seconds": self.OTP_TTL_SECONDS,
        }

    def verify_otp(
        self,
        *,
        identifier: str,
        otp: str,
        name: Optional[str] = None,
    ) -> Dict[str, Any]:
        clean_identifier = self._clean_identifier(identifier)
        clean_otp = str(otp or "").strip()

        if not clean_identifier or not clean_otp:
            return {
                "success": False,
                "message": "Email and OTP are required.",
            }

        otps = self._read_json(self.otp_path)
        otp_record = otps.get(clean_identifier)

        if not otp_record:
            return {
                "success": False,
                "message": "No OTP request found. Please request a new OTP.",
            }

        now = int(time.time())

        if now > int(otp_record.get("expires_at", 0)):
            otps.pop(clean_identifier, None)
            self._write_json(self.otp_path, otps)

            return {
                "success": False,
                "message": "OTP expired. Please request a new OTP.",
            }

        attempts = int(otp_record.get("attempts", 0))

        if attempts >= self.MAX_ATTEMPTS:
            otps.pop(clean_identifier, None)
            self._write_json(self.otp_path, otps)

            return {
                "success": False,
                "message": "Too many incorrect attempts. Please request a new OTP.",
            }

        if self._hash_value(clean_otp) != otp_record.get("otp_hash"):
            otp_record["attempts"] = attempts + 1
            otps[clean_identifier] = otp_record
            self._write_json(self.otp_path, otps)

            return {
                "success": False,
                "message": "Invalid OTP.",
                "attempts_left": max(0, self.MAX_ATTEMPTS - otp_record["attempts"]),
            }

        users = self._read_json(self.users_path)

        user = users.get(clean_identifier)

        if not user:
            user = {
                "id": self._generate_user_id(),
                "name": str(name or otp_record.get("name") or "Traveller").strip()
                or "Traveller",
                "identifier": clean_identifier,
                "identifier_type": self._identifier_type(clean_identifier),
                "created_at": now,
            }
        else:
            if name:
                user["name"] = str(name).strip() or user.get("name", "Traveller")

        user["last_login_at"] = now
        users[clean_identifier] = user

        token = secrets.token_urlsafe(32)
        token_hash = self._hash_value(token)

        sessions = self._read_json(self.sessions_path)
        sessions[token_hash] = {
            "identifier": clean_identifier,
            "created_at": now,
            "last_seen_at": now,
        }

        otps.pop(clean_identifier, None)

        self._write_json(self.users_path, users)
        self._write_json(self.sessions_path, sessions)
        self._write_json(self.otp_path, otps)

        return {
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": user,
        }

    def get_current_user(self, *, token: str) -> Dict[str, Any]:
        clean_token = str(token or "").strip()

        if not clean_token:
            return {
                "success": False,
                "message": "Token is required.",
            }

        sessions = self._read_json(self.sessions_path)
        token_hash = self._hash_value(clean_token)
        session = sessions.get(token_hash)

        if not session:
            return {
                "success": False,
                "message": "Session not found.",
            }

        users = self._read_json(self.users_path)
        identifier = session.get("identifier")
        user = users.get(identifier)

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }

        session["last_seen_at"] = int(time.time())
        sessions[token_hash] = session
        self._write_json(self.sessions_path, sessions)

        return {
            "success": True,
            "message": "User loaded successfully.",
            "user": user,
        }

    def logout(self, *, token: str) -> Dict[str, Any]:
        clean_token = str(token or "").strip()

        if not clean_token:
            return {
                "success": True,
                "message": "Already logged out.",
            }

        sessions = self._read_json(self.sessions_path)
        token_hash = self._hash_value(clean_token)

        sessions.pop(token_hash, None)
        self._write_json(self.sessions_path, sessions)

        return {
            "success": True,
            "message": "Logged out successfully.",
        }

    def _send_email_otp(self, *, email: str, otp: str, name: str) -> Dict[str, Any]:
        email_enabled = self._get_env("EMAIL_OTP_ENABLED", "false").lower() == "true"

        if not email_enabled:
            return {
                "success": False,
                "message": "Email OTP is not enabled. Set EMAIL_OTP_ENABLED=true in .env.",
            }

        smtp_host = self._get_env("SMTP_HOST")
        smtp_port = int(self._get_env("SMTP_PORT", "587"))
        smtp_user = self._get_env("SMTP_USER")
        smtp_password = self._get_env("SMTP_PASSWORD")
        smtp_from = self._get_env("SMTP_FROM", smtp_user)

        if not smtp_host or not smtp_user or not smtp_password or not smtp_from:
            return {
                "success": False,
                "message": "SMTP is not configured. Check SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM in .env.",
            }

        subject = "Your A2A Trip login OTP"

        html_body = f"""
        <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:32px;">
          <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#020617,#1d4ed8,#06b6d4); color:white; padding:28px;">
              <h1 style="margin:0; font-size:28px;">A2A Trip Login</h1>
              <p style="margin:8px 0 0; color:#dbeafe;">Use this OTP to continue.</p>
            </div>
            <div style="padding:28px;">
              <p style="font-size:16px; color:#334155;">Hi {name},</p>
              <p style="font-size:16px; color:#334155;">Your login OTP is:</p>
              <div style="font-size:40px; letter-spacing:10px; font-weight:900; color:#020617; background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:18px; text-align:center;">
                {otp}
              </div>
              <p style="font-size:14px; color:#64748b; margin-top:22px;">
                This OTP expires in 5 minutes. If you did not request it, ignore this email.
              </p>
            </div>
          </div>
        </div>
        """

        plain_body = (
            f"Hi {name},\n\n"
            f"Your A2A Trip login OTP is: {otp}\n\n"
            f"This OTP expires in 5 minutes."
        )

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = smtp_from
        message["To"] = email
        message.set_content(plain_body)
        message.add_alternative(html_body, subtype="html")

        try:
            context = ssl.create_default_context()

            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.starttls(context=context)
                server.login(smtp_user, smtp_password)
                server.send_message(message)

            return {
                "success": True,
                "message": "OTP email sent successfully.",
            }

        except Exception as exc:
            return {
                "success": False,
                "message": f"Could not send OTP email: {exc}",
            }

    def _get_env(self, key: str, default: str = "") -> str:
        value = os.getenv(key)

        if value:
            return value.strip()

        env_path = self.project_root / ".env"

        if not env_path.exists():
            return default

        try:
            for line in env_path.read_text(encoding="utf-8").splitlines():
                clean_line = line.strip()

                if not clean_line or clean_line.startswith("#") or "=" not in clean_line:
                    continue

                env_key, env_value = clean_line.split("=", 1)

                if env_key.strip() == key:
                    return env_value.strip().strip('"').strip("'")
        except Exception:
            return default

        return default

    def _read_json(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            return {}

        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _write_json(self, path: Path, data: Dict[str, Any]) -> None:
        path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _clean_identifier(self, identifier: str) -> str:
        return str(identifier or "").strip().lower().replace(" ", "")

    def _identifier_type(self, identifier: str) -> str:
        if "@" in identifier:
            return "email"

        return "phone"

    def _mask_identifier(self, identifier: str) -> str:
        if "@" in identifier:
            username, domain = identifier.split("@", 1)

            if len(username) <= 2:
                masked = username[0] + "***"
            else:
                masked = username[:2] + "***" + username[-1]

            return f"{masked}@{domain}"

        if len(identifier) <= 4:
            return "***"

        return f"{identifier[:2]}***{identifier[-3:]}"

    def _generate_otp(self) -> str:
        return str(secrets.randbelow(900000) + 100000)

    def _generate_user_id(self) -> str:
        return f"user_{secrets.token_hex(8)}"

    def _hash_value(self, value: str) -> str:
        return hashlib.sha256(str(value).encode("utf-8")).hexdigest()