from __future__ import annotations

from typing import Any, Dict, List

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import (
    ActivityOption,
    BudgetBreakdown,
    FlightOption,
    HotelOption,
    TravelStyle,
    TripRequest,
)


class PricingAgent(BaseAgent):
    """
    Specialized agent responsible only for budget calculation.

    Boundary:
    - It does not search flights.
    - It does not search hotels.
    - It does not create the itinerary.
    - It only calculates cost, budget health, and money-related warnings.
    """

    def __init__(self) -> None:
        super().__init__(
            role=AgentRole.PRICING_AGENT,
            name="Pricing Agent",
            description="Calculates detailed budget breakdown for the trip.",
        )

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload["trip_request"])

        selected_flight = FlightOption(**payload["selected_flight"])
        selected_hotel = HotelOption(**payload["selected_hotel"])

        selected_activities = [
            ActivityOption(**activity)
            for activity in payload.get("selected_activities", [])
        ]

        breakdown = self._calculate_budget(
            trip_request=trip_request,
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            selected_activities=selected_activities,
        )

        return {
            "agent": self.name,
            "budget_breakdown": breakdown.model_dump(mode="json"),
            "budget_status": self._budget_status(breakdown),
            "recommendations": self._budget_recommendations(
                trip_request=trip_request,
                breakdown=breakdown,
            ),
        }

    def _calculate_budget(
        self,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        selected_activities: List[ActivityOption],
    ) -> BudgetBreakdown:
        trip_days = max((trip_request.end_date - trip_request.start_date).days + 1, 1)

        flights_cost = selected_flight.price
        hotels_cost = selected_hotel.total_price

        activities_cost = sum(
            activity.estimated_cost for activity in selected_activities
        )

        food_cost = self._estimate_food_cost(
            trip_days=trip_days,
            travelers=trip_request.travelers,
            travel_style=trip_request.travel_style,
        )

        local_transport_cost = self._estimate_local_transport_cost(
            trip_days=trip_days,
            travelers=trip_request.travelers,
            travel_style=trip_request.travel_style,
        )

        subtotal = (
            flights_cost
            + hotels_cost
            + activities_cost
            + food_cost
            + local_transport_cost
        )

        buffer = round(subtotal * 0.10, 2)
        total_estimated_cost = round(subtotal + buffer, 2)
        remaining_budget = round(trip_request.budget - total_estimated_cost, 2)

        return BudgetBreakdown(
            flights=round(flights_cost, 2),
            hotels=round(hotels_cost, 2),
            activities=round(activities_cost, 2),
            food=round(food_cost, 2),
            local_transport=round(local_transport_cost, 2),
            buffer=buffer,
            total_estimated_cost=total_estimated_cost,
            remaining_budget=remaining_budget,
        )

    def _estimate_food_cost(
        self,
        trip_days: int,
        travelers: int,
        travel_style: TravelStyle,
    ) -> float:
        daily_food_per_person = {
            TravelStyle.BUDGET: 700,
            TravelStyle.BALANCED: 1200,
            TravelStyle.PREMIUM: 2500,
        }

        return daily_food_per_person[travel_style] * trip_days * travelers

    def _estimate_local_transport_cost(
        self,
        trip_days: int,
        travelers: int,
        travel_style: TravelStyle,
    ) -> float:
        daily_transport_per_person = {
            TravelStyle.BUDGET: 350,
            TravelStyle.BALANCED: 700,
            TravelStyle.PREMIUM: 1500,
        }

        return daily_transport_per_person[travel_style] * trip_days * travelers

    def _budget_status(self, breakdown: BudgetBreakdown) -> str:
        if breakdown.remaining_budget < 0:
            return "over_budget"

        if breakdown.remaining_budget <= breakdown.total_estimated_cost * 0.10:
            return "tight_budget"

        return "within_budget"

    def _budget_recommendations(
        self,
        trip_request: TripRequest,
        breakdown: BudgetBreakdown,
    ) -> List[str]:
        recommendations: List[str] = []

        if breakdown.remaining_budget < 0:
            recommendations.append(
                "The estimated plan is over budget. Consider reducing hotel category, activities, or travel style."
            )

        elif breakdown.remaining_budget <= trip_request.budget * 0.10:
            recommendations.append(
                "The plan fits the budget, but the remaining margin is tight. Keep extra cash for last-minute changes."
            )

        else:
            recommendations.append(
                "The plan is comfortably within budget with room for upgrades or emergency expenses."
            )

        if breakdown.hotels > breakdown.flights:
            recommendations.append(
                "Hotel cost is one of the largest components. Comparing nearby stays may reduce total cost."
            )

        if breakdown.activities > trip_request.budget * 0.20:
            recommendations.append(
                "Activities are taking a large share of the budget. Prioritize must-do experiences."
            )

        recommendations.append(
            "A 10% buffer has been added for price changes, local transfers, tips, and small unexpected costs."
        )

        return recommendations