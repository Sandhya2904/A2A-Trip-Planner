from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ApiInfoResponse(BaseModel):
    """
    Root API information response.
    """

    name: str = Field(..., examples=["A2A Trip Planner API"])
    status: str = Field(..., examples=["running"])
    docs: str = Field(..., examples=["/docs"])
    health: str = Field(..., examples=["/api/health"])
    planner_endpoint: str = Field(..., examples=["/api/plan-trip"])


class HealthResponse(BaseModel):
    """
    Health check response.
    """

    status: str = Field(..., examples=["healthy"])
    service: str = Field(..., examples=["a2a-trip-planner-api"])
    version: str = Field(..., examples=["1.0.0"])


class AgentInfo(BaseModel):
    """
    Public metadata for one backend agent.
    """

    name: str = Field(..., examples=["Flight Agent"])
    role: str = Field(..., examples=["flight_agent"])
    responsibility: str = Field(
        ...,
        examples=["Finds and recommends flight options."],
    )


class PlanTripResponse(BaseModel):
    """
    Successful trip planning response.
    """

    success: bool = Field(..., examples=[True])
    message: str = Field(..., examples=["Trip plan generated successfully."])
    data: Dict[str, Any]


class SavedTripPlanResponse(BaseModel):
    """
    Successful saved trip plan retrieval response.
    """

    success: bool = Field(..., examples=[True])
    message: str = Field(..., examples=["Saved trip plan retrieved successfully."])
    data: Dict[str, Any]


class SavedTripPlanSummary(BaseModel):
    """
    Lightweight summary for saved trip plan list views.
    """

    plan_id: str
    saved_at: Optional[str] = None
    source_city: Optional[str] = None
    destination_city: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    travelers: Optional[int] = None
    travel_style: Optional[str] = None
    total_estimated_cost: Optional[float] = None
    remaining_budget: Optional[float] = None
    storage_path: Optional[str] = None


class ListSavedTripPlansResponse(BaseModel):
    """
    Successful saved trip plan listing response.
    """

    success: bool = Field(..., examples=[True])
    message: str = Field(..., examples=["Saved trip plans retrieved successfully."])
    count: int = Field(..., examples=[3])
    data: List[SavedTripPlanSummary]


class DeleteSavedTripPlanResponse(BaseModel):
    """
    Successful saved trip plan deletion response.
    """

    success: bool = Field(..., examples=[True])
    message: str = Field(..., examples=["Saved trip plan deleted successfully."])
    plan_id: str = Field(..., examples=["abc-123"])


class ErrorDetail(BaseModel):
    """
    Standard API error detail.
    """

    success: bool = Field(..., examples=[False])
    message: str = Field(..., examples=["Invalid trip planning request."])
    error: str = Field(..., examples=["End date cannot be earlier than start date."])


class ErrorResponse(BaseModel):
    """
    Standard API error response shape.

    FastAPI returns this object inside the `detail` field when HTTPException is raised.
    """

    detail: ErrorDetail