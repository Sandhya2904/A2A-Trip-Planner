from __future__ import annotations

from typing import Any, Dict, List

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import ActivityOption, TravelStyle, TripRequest
from app.tools.providers.base import TravelDataProvider


class ActivityAgent(BaseAgent):
    """
    Specialized agent responsible only for finding trip activities.

    Boundary:
    - It does not book hotels.
    - It does not search flights.
    - It does not calculate full trip budget.
    - It only recommends destination activities based on interests.
    """

    def __init__(self, provider: TravelDataProvider) -> None:
        super().__init__(
            role=AgentRole.ACTIVITY_AGENT,
            name="Activity Agent",
            description="Finds destination activities based on user interests.",
        )
        self.provider = provider

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload)

        activities = await self.provider.search_activities(trip_request)
        selected_activities = self._select_activities(activities, trip_request)

        return {
            "agent": self.name,
            "total_options": len(activities),
            "selected_activities": [
                activity.model_dump(mode="json") for activity in selected_activities
            ],
            "activity_options": [
                activity.model_dump(mode="json") for activity in activities
            ],
            "selection_reason": self._selection_reason(
                selected_activities,
                trip_request,
            ),
        }

    def _select_activities(
        self,
        activities: List[ActivityOption],
        trip_request: TripRequest,
    ) -> List[ActivityOption]:
        if not activities:
            raise ValueError("No activities found.")

        if trip_request.travel_style == TravelStyle.BUDGET:
            return sorted(
                activities,
                key=lambda activity: activity.estimated_cost,
            )[:3]

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return sorted(
                activities,
                key=lambda activity: activity.estimated_cost,
                reverse=True,
            )[:4]

        return activities[:4]

    def _selection_reason(
        self,
        selected_activities: List[ActivityOption],
        trip_request: TripRequest,
    ) -> str:
        activity_names = ", ".join(activity.name for activity in selected_activities)

        if trip_request.travel_style == TravelStyle.BUDGET:
            return (
                f"Selected cost-friendly activities: {activity_names}. "
                f"This keeps the trip inside the requested budget."
            )

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return (
                f"Selected richer experience-based activities: {activity_names}. "
                f"This matches the premium travel style."
            )

        return (
            f"Selected balanced activities: {activity_names}. "
            f"This matches the user's interests while controlling cost."
        )