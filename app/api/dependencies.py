from __future__ import annotations

from app.services.trip_planning_service import TripPlanningService
from app.services.trip_streaming_service import TripStreamingService


def get_trip_planning_service() -> TripPlanningService:
    """
    Provide the trip planning service to API routes.
    """

    return TripPlanningService()


def get_trip_streaming_service() -> TripStreamingService:
    """
    Provide the live trip streaming service to API routes.
    """

    return TripStreamingService()