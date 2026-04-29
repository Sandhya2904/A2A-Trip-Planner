from __future__ import annotations

from typing import Any, Dict, List

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import HotelOption, TravelStyle, TripRequest
from app.tools.providers.base import TravelDataProvider


class HotelAgent(BaseAgent):
    """
    Specialized agent responsible only for hotel search and selection.

    Boundary:
    - It does not handle flights.
    - It does not create the itinerary.
    - It does not calculate full budget.
    - It only returns hotel options and a selected hotel.
    """

    def __init__(self, provider: TravelDataProvider) -> None:
        super().__init__(
            role=AgentRole.HOTEL_AGENT,
            name="Hotel Agent",
            description="Finds and recommends hotel options for a trip.",
        )
        self.provider = provider

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload)

        hotels = await self.provider.search_hotels(trip_request)
        selected_hotel = self._select_best_hotel(hotels, trip_request)

        return {
            "agent": self.name,
            "total_options": len(hotels),
            "selected_hotel": selected_hotel.model_dump(mode="json"),
            "hotel_options": [hotel.model_dump(mode="json") for hotel in hotels],
            "selection_reason": self._selection_reason(selected_hotel, trip_request),
        }

    def _select_best_hotel(
        self,
        hotels: List[HotelOption],
        trip_request: TripRequest,
    ) -> HotelOption:
        if not hotels:
            raise ValueError("No hotel options found.")

        if trip_request.travel_style == TravelStyle.BUDGET:
            return sorted(hotels, key=lambda hotel: hotel.total_price)[0]

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return sorted(
                hotels,
                key=lambda hotel: (hotel.rating, hotel.total_price),
                reverse=True,
            )[0]

        return sorted(
            hotels,
            key=lambda hotel: abs(hotel.rating - 4.4),
        )[0]

    def _selection_reason(
        self,
        selected_hotel: HotelOption,
        trip_request: TripRequest,
    ) -> str:
        if trip_request.travel_style == TravelStyle.BUDGET:
            return (
                f"Selected {selected_hotel.name} because it keeps hotel cost low "
                f"while covering essential amenities."
            )

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return (
                f"Selected {selected_hotel.name} because premium style prioritizes "
                f"rating, comfort, and better amenities."
            )

        return (
            f"Selected {selected_hotel.name} because it balances comfort, rating, "
            f"location, and price."
        )