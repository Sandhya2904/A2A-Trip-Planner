from __future__ import annotations

import os
from typing import Any, Dict, List, Optional


class GeminiAIService:
    """
    Optional Gemini AI service.

    This service is intentionally safe:
    - If GEMINI_API_KEY is missing, it returns fallback text.
    - If Gemini fails or quota is exceeded, backend still works.
    - We use it only for user-friendly summaries, not core pricing math.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
        self._client = None

    @property
    def is_enabled(self) -> bool:
        return bool(self.api_key)

    def _get_client(self):
        if not self.is_enabled:
            return None

        if self._client is not None:
            return self._client

        try:
            from google import genai

            self._client = genai.Client(api_key=self.api_key)
            return self._client
        except Exception:
            return None

    async def generate_trip_summary(
        self,
        *,
        route_label: str,
        trip_days: int,
        travel_style: str,
        travelers: int,
        currency: str,
        total_estimated_cost: float,
        remaining_budget: float,
        hotel_name: str,
        interests: List[str],
        warnings: Optional[List[str]] = None,
    ) -> str:
        fallback = self._fallback_trip_summary(
            route_label=route_label,
            trip_days=trip_days,
            travel_style=travel_style,
            travelers=travelers,
            currency=currency,
            total_estimated_cost=total_estimated_cost,
            remaining_budget=remaining_budget,
            hotel_name=hotel_name,
        )

        client = self._get_client()

        if client is None:
            return fallback

        prompt = self._build_trip_summary_prompt(
            route_label=route_label,
            trip_days=trip_days,
            travel_style=travel_style,
            travelers=travelers,
            currency=currency,
            total_estimated_cost=total_estimated_cost,
            remaining_budget=remaining_budget,
            hotel_name=hotel_name,
            interests=interests,
            warnings=warnings or [],
        )

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            text = getattr(response, "text", "") or ""
            cleaned = " ".join(text.strip().split())

            if not cleaned:
                return fallback

            return cleaned[:900]

        except Exception:
            return fallback

    async def polish_itinerary_day(
        self,
        *,
        day_title: str,
        morning: str,
        afternoon: str,
        evening: str,
        weather_note: str,
    ) -> Dict[str, str]:
        fallback = {
            "morning": morning,
            "afternoon": afternoon,
            "evening": evening,
            "weather_note": weather_note,
        }

        client = self._get_client()

        if client is None:
            return fallback

        prompt = f"""
Rewrite this travel itinerary day in a polished but concise way.
Do not invent new places, prices, or timings.
Return only JSON with keys: morning, afternoon, evening, weather_note.

Title: {day_title}
Morning: {morning}
Afternoon: {afternoon}
Evening: {evening}
Weather note: {weather_note}
"""

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            text = getattr(response, "text", "") or ""

            parsed = self._extract_json_like_fields(text)

            return {
                "morning": parsed.get("morning") or morning,
                "afternoon": parsed.get("afternoon") or afternoon,
                "evening": parsed.get("evening") or evening,
                "weather_note": parsed.get("weather_note") or weather_note,
            }

        except Exception:
            return fallback

    def build_ai_status(self) -> Dict[str, Any]:
        return {
            "enabled": self.is_enabled,
            "provider": "gemini",
            "model": self.model_name,
            "purpose": "summary_polish_and_itinerary_language",
            "fallback_enabled": True,
        }

    def _build_trip_summary_prompt(
        self,
        *,
        route_label: str,
        trip_days: int,
        travel_style: str,
        travelers: int,
        currency: str,
        total_estimated_cost: float,
        remaining_budget: float,
        hotel_name: str,
        interests: List[str],
        warnings: List[str],
    ) -> str:
        interests_text = ", ".join(interests) if interests else "general sightseeing"
        warnings_text = "; ".join(warnings) if warnings else "No major warnings."

        return f"""
You are a travel planning assistant inside a backend multi-agent trip planner.

Write a polished final trip summary for the user.
Keep it practical, trustworthy, and concise.
Do not mention that you are Gemini.
Do not invent prices, booking confirmations, or live availability.
Use the exact cost values provided.

Trip:
- Route: {route_label}
- Duration: {trip_days} days
- Style: {travel_style}
- Travelers: {travelers}
- Stay: {hotel_name}
- Interests: {interests_text}
- Estimated total cost: {currency} {total_estimated_cost:,.0f}
- Remaining budget: {currency} {remaining_budget:,.0f}
- Backend warnings: {warnings_text}

Write 2 to 3 sentences only.
"""

    def _fallback_trip_summary(
        self,
        *,
        route_label: str,
        trip_days: int,
        travel_style: str,
        travelers: int,
        currency: str,
        total_estimated_cost: float,
        remaining_budget: float,
        hotel_name: str,
    ) -> str:
        budget_sentence = (
            "within the requested budget"
            if remaining_budget >= 0
            else "above the requested budget"
        )

        return (
            f"{trip_days}-day {travel_style} trip across {route_label} for "
            f"{travelers} traveler(s). Stay is planned at {hotel_name}. "
            f"Estimated total cost is {currency} {total_estimated_cost:,.0f}, "
            f"which is {budget_sentence}."
        )

    def _extract_json_like_fields(self, text: str) -> Dict[str, str]:
        """
        Lightweight fallback parser.

        We avoid hard dependency on Gemini returning perfect JSON.
        If parsing fails, caller keeps original itinerary text.
        """

        import json
        import re

        cleaned = text.strip()

        cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"^```", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

        try:
            parsed = json.loads(cleaned)

            if isinstance(parsed, dict):
                return {
                    key: str(value)
                    for key, value in parsed.items()
                    if isinstance(value, (str, int, float))
                }

        except Exception:
            return {}

        return {}