from __future__ import annotations

from datetime import timedelta
from typing import Any, Dict, List, Optional

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import (
    ActivityOption,
    BudgetBreakdown,
    FlightOption,
    HotelOption,
    ItineraryDay,
    TravelStyle,
    TripPlan,
    TripRequest,
    WeatherForecast,
)


class ItineraryAgent(BaseAgent):
    """
    Specialized agent responsible for creating the final day-by-day itinerary.

    Boundary:
    - It does not search flights.
    - It does not search hotels.
    - It does not calculate pricing.
    - It only assembles all agent outputs into a structured travel plan.
    """

    def __init__(self) -> None:
        super().__init__(
            role=AgentRole.ITINERARY_AGENT,
            name="Itinerary Agent",
            description="Creates a structured day-by-day travel itinerary.",
        )

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload["trip_request"])

        selected_flight = FlightOption(**payload["selected_flight"])
        selected_hotel = HotelOption(**payload["selected_hotel"])

        weather = [
            WeatherForecast(**forecast)
            for forecast in payload.get("weather", [])
        ]

        selected_activities = [
            ActivityOption(**activity)
            for activity in payload.get("selected_activities", [])
        ]

        budget_breakdown = BudgetBreakdown(**payload["budget_breakdown"])

        itinerary = self._build_itinerary(
            trip_request=trip_request,
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            weather=weather,
            activities=selected_activities,
            budget_breakdown=budget_breakdown,
        )

        booking_links = self._collect_booking_links(
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            activities=selected_activities,
        )

        summary = self._create_summary(
            trip_request=trip_request,
            selected_hotel=selected_hotel,
            budget_breakdown=budget_breakdown,
            itinerary=itinerary,
        )

        trip_plan = TripPlan(
            request=trip_request,
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            weather=weather,
            activities=selected_activities,
            itinerary=itinerary,
            budget_breakdown=budget_breakdown,
            summary=summary,
            booking_links=booking_links,
        )

        return {
            "agent": self.name,
            "summary": summary,
            "itinerary": [day.model_dump(mode="json") for day in itinerary],
            "booking_links": booking_links,
            "final_trip_plan": trip_plan.model_dump(mode="json"),
        }

    def _build_itinerary(
        self,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        weather: List[WeatherForecast],
        activities: List[ActivityOption],
        budget_breakdown: BudgetBreakdown,
    ) -> List[ItineraryDay]:
        total_days = max((trip_request.end_date - trip_request.start_date).days + 1, 1)
        itinerary: List[ItineraryDay] = []

        daily_base_cost = self._daily_base_cost(
            total_days=total_days,
            budget_breakdown=budget_breakdown,
        )

        for index in range(total_days):
            current_date = trip_request.start_date + timedelta(days=index)
            day_number = index + 1
            weather_note = self._weather_note_for_date(current_date, weather)
            activity = self._activity_for_day(index, activities)

            if day_number == 1:
                day = self._arrival_day(
                    day_number=day_number,
                    current_date=current_date,
                    trip_request=trip_request,
                    selected_flight=selected_flight,
                    selected_hotel=selected_hotel,
                    activity=activity,
                    weather_note=weather_note,
                    daily_base_cost=daily_base_cost,
                )

            elif day_number == total_days:
                day = self._departure_day(
                    day_number=day_number,
                    current_date=current_date,
                    trip_request=trip_request,
                    selected_hotel=selected_hotel,
                    activity=activity,
                    weather_note=weather_note,
                    daily_base_cost=daily_base_cost,
                )

            else:
                day = self._regular_day(
                    day_number=day_number,
                    current_date=current_date,
                    trip_request=trip_request,
                    activity=activity,
                    weather_note=weather_note,
                    daily_base_cost=daily_base_cost,
                )

            itinerary.append(day)

        return itinerary

    def _arrival_day(
        self,
        day_number: int,
        current_date,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activity: Optional[ActivityOption],
        weather_note: Optional[str],
        daily_base_cost: float,
    ) -> ItineraryDay:
        evening_plan = (
            f"Ease into {trip_request.destination_city} with {activity.name}."
            if activity
            else f"Explore nearby areas around {selected_hotel.location}."
        )

        activity_cost = activity.estimated_cost if activity else 0

        return ItineraryDay(
            day=day_number,
            date=current_date,
            title=f"Arrival in {trip_request.destination_city}",
            morning=(
                f"Take {selected_flight.airline} flight {selected_flight.flight_number} "
                f"from {trip_request.source_city} at {selected_flight.departure_time}."
            ),
            afternoon=(
                f"Arrive by {selected_flight.arrival_time}, transfer to "
                f"{selected_hotel.name}, and complete check-in."
            ),
            evening=evening_plan,
            estimated_cost=round(daily_base_cost + activity_cost, 2),
            weather_note=weather_note,
        )

    def _regular_day(
        self,
        day_number: int,
        current_date,
        trip_request: TripRequest,
        activity: Optional[ActivityOption],
        weather_note: Optional[str],
        daily_base_cost: float,
    ) -> ItineraryDay:
        if activity:
            title = activity.name
            morning = f"Start with a relaxed breakfast and head toward {activity.location}."
            afternoon = f"Enjoy {activity.name}: {activity.description}"
            evening = self._evening_plan(trip_request)
            activity_cost = activity.estimated_cost
        else:
            title = f"{trip_request.destination_city} Exploration Day"
            morning = f"Visit popular local neighborhoods in {trip_request.destination_city}."
            afternoon = "Keep the afternoon flexible for sightseeing, cafes, or shopping."
            evening = self._evening_plan(trip_request)
            activity_cost = 0

        return ItineraryDay(
            day=day_number,
            date=current_date,
            title=title,
            morning=morning,
            afternoon=afternoon,
            evening=evening,
            estimated_cost=round(daily_base_cost + activity_cost, 2),
            weather_note=weather_note,
        )

    def _departure_day(
        self,
        day_number: int,
        current_date,
        trip_request: TripRequest,
        selected_hotel: HotelOption,
        activity: Optional[ActivityOption],
        weather_note: Optional[str],
        daily_base_cost: float,
    ) -> ItineraryDay:
        morning_plan = (
            f"Do a light final activity: {activity.name}."
            if activity
            else "Take a slow breakfast and pack comfortably."
        )

        activity_cost = activity.estimated_cost if activity else 0

        return ItineraryDay(
            day=day_number,
            date=current_date,
            title=f"Final Day in {trip_request.destination_city}",
            morning=morning_plan,
            afternoon=(
                f"Check out from {selected_hotel.name}, keep luggage ready, "
                "and leave buffer time for local transport."
            ),
            evening=(
                f"Wrap up the trip with a final meal in {trip_request.destination_city} "
                "before departure."
            ),
            estimated_cost=round(daily_base_cost + activity_cost, 2),
            weather_note=weather_note,
        )

    def _activity_for_day(
        self,
        day_index: int,
        activities: List[ActivityOption],
    ) -> Optional[ActivityOption]:
        if not activities:
            return None

        return activities[day_index % len(activities)]

    def _weather_note_for_date(
        self,
        current_date,
        weather: List[WeatherForecast],
    ) -> Optional[str]:
        for forecast in weather:
            if forecast.date == current_date:
                return (
                    f"{forecast.condition}, {forecast.temperature_celsius}°C. "
                    f"{forecast.travel_advice}"
                )

        return None

    def _daily_base_cost(
        self,
        total_days: int,
        budget_breakdown: BudgetBreakdown,
    ) -> float:
        daily_cost_pool = (
            budget_breakdown.food
            + budget_breakdown.local_transport
        )

        return round(daily_cost_pool / total_days, 2)

    def _evening_plan(self, trip_request: TripRequest) -> str:
        if "nightlife" in [interest.lower() for interest in trip_request.interests]:
            return "Explore a safe nightlife area, live music spot, or night market."

        if "local food" in [interest.lower() for interest in trip_request.interests]:
            return "Try a recommended local dinner spot and regional dessert."

        return "Keep the evening relaxed with dinner and a short local walk."

    def _collect_booking_links(
        self,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activities: List[ActivityOption],
    ) -> List[str]:
        links = [
            selected_flight.booking_link,
            selected_hotel.booking_link,
        ]

        for activity in activities:
            if activity.booking_link:
                links.append(activity.booking_link)

        return list(dict.fromkeys(links))

    def _create_summary(
        self,
        trip_request: TripRequest,
        selected_hotel: HotelOption,
        budget_breakdown: BudgetBreakdown,
        itinerary: List[ItineraryDay],
    ) -> str:
        budget_message = (
            "within the requested budget"
            if budget_breakdown.remaining_budget >= 0
            else "above the requested budget"
        )

        style_label = {
            TravelStyle.BUDGET: "cost-efficient",
            TravelStyle.BALANCED: "balanced",
            TravelStyle.PREMIUM: "premium",
        }[trip_request.travel_style]

        return (
            f"{len(itinerary)}-day {style_label} trip from "
            f"{trip_request.source_city} to {trip_request.destination_city} for "
            f"{trip_request.travelers} traveler(s). Stay is planned at "
            f"{selected_hotel.name}. Estimated total cost is "
            f"{trip_request.currency} {budget_breakdown.total_estimated_cost:,.0f}, "
            f"which is {budget_message}."
        )