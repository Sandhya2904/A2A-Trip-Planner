from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai_chat_service import AIChatService


router = APIRouter(prefix="/api/ai", tags=["AI Travel Concierge"])

ai_chat_service = AIChatService()


class AIChatHistoryItem(BaseModel):
    role: str = Field(default="user", description="Message role: user or assistant")
    content: str = Field(default="", description="Message content")


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question")
    trip_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Current trip form/result context from frontend",
    )
    history: Optional[List[AIChatHistoryItem]] = Field(
        default=None,
        description="Recent chat messages",
    )


@router.post("/chat")
async def chat_with_ai(request: AIChatRequest):
    """
    Chat with A2A AI Travel Concierge.

    This endpoint supports:
    - travel planning questions
    - general questions
    - route feasibility
    - budget advice
    - itinerary suggestions
    - packing checklist
    - safety/document guidance
    """

    history = [
        {
            "role": item.role,
            "content": item.content,
        }
        for item in request.history or []
    ]

    return ai_chat_service.chat(
        message=request.message,
        trip_context=request.trip_context or {},
        history=history,
    )


@router.get("/health")
async def ai_health():
    """
    Lightweight AI route health check.
    """

    return {
        "success": True,
        "message": "AI Travel Concierge route is running.",
        "endpoint": "/api/ai/chat",
    }