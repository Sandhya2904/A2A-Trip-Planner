from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from google import genai
from google.genai import types


class AIChatService:
    """
    Strong Gemini-powered AI Travel Concierge.

    What this version improves:
    - Instant local replies for greetings.
    - Smart routing between fast/smart/pro models.
    - Better trip reasoning prompt.
    - Automatic fallback if the stronger model fails.
    - Better route, budget, itinerary, visa/document, hotel/tour guidance.
    """

    def __init__(self) -> None:
        self.project_root = Path(__file__).resolve().parents[2]

        self.api_key = self._get_env("GEMINI_API_KEY")

        self.fast_model = self._get_env(
            "GEMINI_FAST_MODEL",
            "gemini-2.5-flash-lite",
        )

        self.smart_model = self._get_env(
            "GEMINI_SMART_MODEL",
            "gemini-2.5-flash",
        )

        self.pro_model = self._get_env(
            "GEMINI_PRO_MODEL",
            "gemini-2.5-pro",
        )

    def chat(
        self,
        *,
        message: str,
        trip_context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        clean_message = str(message or "").strip()
        clean_context = trip_context or {}
        clean_history = history or []

        if not clean_message:
            return {
                "success": False,
                "message": "Message is required.",
                "reply": "Please type a question first.",
            }

        instant_reply = self._get_instant_reply(clean_message, clean_context)

        if instant_reply:
            return {
                "success": True,
                "message": "Instant AI assistant response.",
                "provider": "local_fast_reply",
                "model": "instant",
                "reply": instant_reply,
                "complexity": "instant",
            }

        if not self.api_key:
            return {
                "success": False,
                "message": "GEMINI_API_KEY is missing in .env.",
                "reply": (
                    "AI is not configured yet. Add GEMINI_API_KEY in your .env "
                    "file and restart the backend."
                ),
            }

        complexity = self._classify_question(clean_message, clean_context)
        model_plan = self._get_model_plan(complexity)

        prompt = self._build_prompt(
            message=clean_message,
            trip_context=clean_context,
            history=clean_history,
            complexity=complexity,
        )

        client = genai.Client(api_key=self.api_key)
        errors: List[str] = []

        for model_name, max_tokens, temperature in model_plan:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                        temperature=temperature,
                    ),
                )

                reply = str(getattr(response, "text", "") or "").strip()

                if not reply:
                    raise RuntimeError("Gemini returned an empty response.")

                return {
                    "success": True,
                    "message": "AI response generated successfully.",
                    "provider": "gemini",
                    "model": model_name,
                    "complexity": complexity,
                    "reply": reply,
                }

            except Exception as exc:
                errors.append(f"{model_name}: {exc}")

        return {
            "success": False,
            "message": "AI model fallback chain failed.",
            "provider": "gemini",
            "model": "fallback",
            "complexity": complexity,
            "errors": errors[-3:],
            "reply": self._fallback_reply(clean_message, clean_context),
        }

    def _get_model_plan(self, complexity: str) -> List[Tuple[str, int, float]]:
        """
        Model routing.

        instant:
          handled before this function.

        light:
          fast model first.

        normal:
          smart model first, fast fallback.

        complex:
          pro model first, smart fallback, fast fallback.
        """

        if complexity == "complex":
            return [
                (self.pro_model, 1200, 0.65),
                (self.smart_model, 900, 0.65),
                (self.fast_model, 700, 0.6),
            ]

        if complexity == "normal":
            return [
                (self.smart_model, 850, 0.65),
                (self.fast_model, 650, 0.6),
            ]

        return [
            (self.fast_model, 500, 0.55),
            (self.smart_model, 700, 0.6),
        ]

    def _classify_question(
        self,
        message: str,
        trip_context: Dict[str, Any],
    ) -> str:
        lower_message = message.lower().strip()

        if len(lower_message.split()) <= 5:
            simple_patterns = [
                "what is",
                "who is",
                "define",
                "meaning",
                "tell me",
            ]

            if not any(pattern in lower_message for pattern in simple_patterns):
                return "light"

        complex_keywords = [
            "plan",
            "itinerary",
            "day wise",
            "day-wise",
            "optimize",
            "compare",
            "which is better",
            "make it cheaper",
            "reduce cost",
            "budget",
            "route",
            "feasible",
            "realistic",
            "can i travel",
            "train",
            "bus",
            "flight",
            "international",
            "visa",
            "documents",
            "safety",
            "risk",
            "honeymoon",
            "family",
            "solo",
            "business trip",
            "packing",
            "checklist",
            "best time",
            "weather",
            "hotel",
            "tour",
            "activity",
            "things to do",
            "rewrite",
            "improve",
            "explain my trip",
        ]

        if any(keyword in lower_message for keyword in complex_keywords):
            return "complex"

        has_trip_context = bool(
            trip_context.get("source_city")
            or trip_context.get("destination_city")
            or trip_context.get("budget")
            or trip_context.get("itinerary")
            or trip_context.get("summary")
        )

        if has_trip_context and len(lower_message.split()) >= 8:
            return "normal"

        if len(lower_message.split()) >= 18:
            return "normal"

        return "light"

    def _get_instant_reply(
        self,
        message: str,
        trip_context: Dict[str, Any],
    ) -> str:
        normalized = re.sub(r"\s+", " ", message.lower().strip())

        greeting_words = {
            "hi",
            "hii",
            "hello",
            "hey",
            "yo",
            "sup",
            "namaste",
            "hola",
            "bonjour",
            "start",
        }

        if normalized in greeting_words:
            destination = trip_context.get("destination_city") or "your destination"

            return (
                f"Hey! I’m your A2A Travel Copilot. Ask me anything about your trip, "
                f"budget, route, flights, hotels, documents, packing, or things to do in {destination}."
            )

        thanks_words = {
            "thanks",
            "thank you",
            "ty",
            "ok",
            "okay",
            "cool",
            "nice",
        }

        if normalized in thanks_words:
            return "Anytime. Ask me your next trip question and I’ll help you plan it smarter."

        help_words = {
            "help",
            "what can you do",
            "what can u do",
            "features",
        }

        if normalized in help_words:
            return (
                "I can help with route feasibility, cheaper trip options, hotel and tour suggestions, "
                "packing lists, budget explanation, day-wise itinerary ideas, travel safety, documents, "
                "and general questions too."
            )

        return ""

    def _build_prompt(
        self,
        *,
        message: str,
        trip_context: Dict[str, Any],
        history: List[Dict[str, str]],
        complexity: str,
    ) -> str:
        compact_history = history[-8:]

        return f"""
You are A2A Travel Copilot, a premium AI assistant inside a real-world travel planning website.

Your role:
- You can answer general questions.
- Your core specialty is travel planning, trip feasibility, route logic, budgeting, itinerary design, hotel/tour/flight guidance, packing, safety, and documents.
- You are context-aware: use the current trip context when it is relevant.
- You should sound practical, confident, and useful, not robotic.

Important safety and honesty rules:
- Do not claim live booking availability unless the provided context includes it.
- Do not invent live prices, live flight seats, live hotel availability, or official visa rules.
- If legal/visa/immigration/health rules matter, say the user should verify from official sources.
- If route mode is unrealistic, say clearly why.
- For international routes, bus/train should not be recommended unless a realistic cross-border route exists.
- If the budget is too low, say it politely and suggest realistic fixes.
- If the user asks a general non-travel question, answer it normally but keep it concise.

Answer style:
- Use clear sections only when helpful.
- Prefer practical recommendations.
- Avoid huge essays unless the user asks for depth.
- For complex travel questions, include:
  1. Reality check
  2. Best recommendation
  3. Budget / route / safety notes if relevant
  4. Action steps

Detected question complexity:
{complexity}

Current trip context JSON:
{json.dumps(trip_context, indent=2, ensure_ascii=False)}

Recent chat history JSON:
{json.dumps(compact_history, indent=2, ensure_ascii=False)}

User question:
{message}

Reply now as A2A Travel Copilot.
""".strip()

    def _fallback_reply(self, message: str, trip_context: Dict[str, Any]) -> str:
        source = trip_context.get("source_city") or "your source city"
        destination = trip_context.get("destination_city") or "your destination"
        budget = trip_context.get("budget")
        currency = trip_context.get("currency") or "INR"

        lower_message = message.lower()

        if "cheap" in lower_message or "budget" in lower_message:
            return (
                f"To make your {source} to {destination} trip cheaper, start with the biggest cost blocks: "
                f"travel, stay, food, activities, and emergency buffer. "
                f"If your budget is {currency} {budget}, keep hotel spend controlled, avoid too many paid activities, "
                f"compare flexible travel dates, and choose local transport where practical."
            )

        if (
            "train" in lower_message
            or "bus" in lower_message
            or "route" in lower_message
            or "can i travel" in lower_message
        ):
            return (
                f"For {source} to {destination}, first check if the route is domestic or international. "
                f"If it is international, flights are usually the practical option. "
                f"Train or bus should only be shown when a realistic road/rail route exists."
            )

        if "packing" in lower_message or "checklist" in lower_message:
            return (
                "Useful packing checklist: ID/passport, tickets, hotel confirmation, wallet/cards, charger, "
                "power bank, weather-friendly clothes, basic medicines, toiletries, emergency contacts, and "
                "copies of important documents."
            )

        if "visa" in lower_message or "document" in lower_message:
            return (
                f"For {destination}, check passport validity, visa/entry rules, return ticket requirements, "
                f"hotel confirmation, travel insurance, and any health or customs rules. "
                f"Always verify visa rules from an official government or embassy source."
            )

        return (
            "AI is temporarily unavailable, but I can still help with the basics. "
            f"For your {source} to {destination} trip, check route feasibility, budget, stay options, "
            "activities, weather, safety, and required documents before finalizing the plan."
        )

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