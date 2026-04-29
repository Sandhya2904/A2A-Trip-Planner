from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.trip import TripRequest


class TripPlanningState(BaseModel):
    """
    Runtime state for one trip planning conversation.

    The orchestrator updates this object as each agent completes its task.
    This is important because real multi-agent systems need shared state,
    not random variables floating everywhere.
    """

    conversation_id: str
    trip_request: TripRequest
    trip_payload: Dict[str, Any]

    flight_result: Optional[Dict[str, Any]] = None
    hotel_result: Optional[Dict[str, Any]] = None
    weather_result: Optional[Dict[str, Any]] = None
    activity_result: Optional[Dict[str, Any]] = None
    pricing_result: Optional[Dict[str, Any]] = None
    itinerary_result: Optional[Dict[str, Any]] = None

    orchestration_logs: List[str] = Field(default_factory=list)

    def add_log(self, message: str) -> None:
        self.orchestration_logs.append(message)