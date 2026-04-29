from __future__ import annotations

from typing import Any, Dict, List

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import FlightOption, TravelStyle, TripRequest
from app.tools.providers.base import TravelDataProvider


class FlightAgent(BaseAgent):
    """
    Specialized agent responsible only for flight search and selection.

    Boundary:
    - It does not handle hotels.
    - It does not create itinerary.
    - It does not calculate full trip budget.
    - It only returns flight options and a selected flight.
    """

    def __init__(self, provider: TravelDataProvider) -> None:
        super().__init__(
            role=AgentRole.FLIGHT_AGENT,
            name="Flight Agent",
            description="Finds and recommends flight options for a trip.",
        )
        self.provider = provider

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload)

        flights = await self.provider.search_flights(trip_request)
        selected_flight = self._select_best_flight(flights, trip_request)

        return {
            "agent": self.name,
            "total_options": len(flights),
            "selected_flight": selected_flight.model_dump(mode="json"),
            "flight_options": [flight.model_dump(mode="json") for flight in flights],
            "selection_reason": self._selection_reason(selected_flight, trip_request),
        }

    def _select_best_flight(
        self,
        flights: List[FlightOption],
        trip_request: TripRequest,
    ) -> FlightOption:
        if not flights:
            raise ValueError("No flight options found.")

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return sorted(flights, key=lambda flight: flight.price, reverse=True)[0]

        return sorted(flights, key=lambda flight: flight.price)[0]

    def _selection_reason(
        self,
        selected_flight: FlightOption,
        trip_request: TripRequest,
    ) -> str:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return (
                f"Selected {selected_flight.airline} because premium style prioritizes "
                f"comfort and higher-quality travel options."
            )

        return (
            f"Selected {selected_flight.airline} because it gives the best value "
            f"for the requested {trip_request.travel_style.value} travel style."
        )