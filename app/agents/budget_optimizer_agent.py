from __future__ import annotations

from typing import Any, Dict, List, Tuple

from app.agents.base_agent import AgentResult, BaseTravelAgent
from app.models.trip import ActivityOption, FlightOption, HotelOption, TravelStyle, TripRequest, TripType


class BudgetOptimizerAgent(BaseTravelAgent):
    name = "Budget Optimizer Agent"
    role = "budget_optimizer_agent"
    responsibility = (
        "Optimizes selected flight, stay, and activity choices against the user's "
        "budget while keeping estimates realistic."
    )

    def optimize(
        self,
        *,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activities: List[ActivityOption],
    ) -> AgentResult:
        if trip_request.budget <= 0:
            return self.success(
                summary="No budget optimization needed because budget is not set.",
                data={
                    "selected_flight": selected_flight,
                    "selected_hotel": selected_hotel,
                    "activities": activities,
                },
                confidence=0.75,
            )

        trip_days = self._trip_days(trip_request)
        travelers = max(trip_request.travelers, 1)
        route_leg_count = max(len(trip_request.route_legs or []), 1)

        buffer_rate = 0.07 if self._is_domestic_india_trip(trip_request) else 0.1
        target_subtotal = float(trip_request.budget) / (1 + buffer_rate)
        allocation = self._budget_allocation(trip_request)

        current_flights = selected_flight.price * travelers * route_leg_count
        current_hotels = selected_hotel.total_price
        current_activities = sum(activity.estimated_cost for activity in activities)

        optimized_flight = selected_flight
        optimized_hotel = selected_hotel
        optimized_activities = activities

        warnings: List[str] = []
        changed_parts: List[str] = []

        allowed_flight_total = target_subtotal * allocation["flights"]
        min_flight_price = self._minimum_flight_price_per_leg(trip_request)
        allowed_price_per_leg = allowed_flight_total / (travelers * route_leg_count)
        next_flight_price = round(max(min_flight_price, allowed_price_per_leg), 2)

        if next_flight_price < selected_flight.price:
            optimized_flight = self._copy_model(
                selected_flight,
                {
                    "airline": self._budget_airline_name(trip_request),
                    "price": next_flight_price,
                },
            )
            changed_parts.append("flight")

        nights = max((trip_request.end_date - trip_request.start_date).days, 1)
        allowed_hotel_total = target_subtotal * allocation["hotels"]
        min_hotel_price = self._minimum_hotel_price_per_night(trip_request)
        allowed_hotel_per_night = allowed_hotel_total / nights
        next_hotel_price = round(max(min_hotel_price, allowed_hotel_per_night), 2)

        if next_hotel_price < selected_hotel.price_per_night:
            destination = self._planning_destination(trip_request)

            optimized_hotel = self._copy_model(
                selected_hotel,
                {
                    "name": self._budget_hotel_name(trip_request, destination),
                    "rating": self._budget_hotel_rating(trip_request),
                    "price_per_night": next_hotel_price,
                    "total_price": round(next_hotel_price * nights, 2),
                    "amenities": self._budget_amenities(trip_request),
                },
            )
            changed_parts.append("hotel")

        allowed_activity_total = target_subtotal * allocation["activities"]

        if current_activities > allowed_activity_total and current_activities > 0:
            min_activity_total = self._minimum_activity_total(
                trip_request=trip_request,
                activity_count=len(activities),
            )
            activity_target = max(min_activity_total, allowed_activity_total)
            activity_scale = min(activity_target / current_activities, 1)

            next_activities: List[ActivityOption] = []

            for activity in activities:
                minimum_single = self._minimum_single_activity_cost(trip_request)
                next_cost = round(
                    max(minimum_single, activity.estimated_cost * activity_scale),
                    2,
                )

                next_name = activity.name
                if activity_scale < 0.94 and not next_name.startswith("Value "):
                    next_name = f"Value {next_name}"

                next_activities.append(
                    self._copy_model(
                        activity,
                        {
                            "name": next_name,
                            "estimated_cost": next_cost,
                        },
                    )
                )

            optimized_activities = next_activities
            changed_parts.append("activities")

        estimated_minimum = self._minimum_possible_total(
            trip_request=trip_request,
            route_leg_count=route_leg_count,
            travelers=travelers,
            trip_days=trip_days,
            buffer_rate=buffer_rate,
            activity_count=max(len(activities), 1),
        )

        if trip_request.budget < estimated_minimum:
            warnings.append(
                f"Requested budget is very tight. Minimum realistic estimate is around "
                f"{trip_request.currency} {estimated_minimum:,.0f}."
            )

        if changed_parts:
            summary = "Budget optimizer adjusted " + ", ".join(changed_parts) + "."
            confidence = 0.9
        else:
            summary = "Budget optimizer found the selected options already reasonable."
            confidence = 0.86

        return self.success(
            summary=summary,
            warnings=warnings,
            confidence=confidence,
            data={
                "selected_flight": optimized_flight,
                "selected_hotel": optimized_hotel,
                "activities": optimized_activities,
                "changed_parts": changed_parts,
                "minimum_realistic_estimate": estimated_minimum,
            },
            metadata={
                "target_subtotal": target_subtotal,
                "buffer_rate": buffer_rate,
                "allocation": allocation,
            },
        )

    def _trip_days(self, trip_request: TripRequest) -> int:
        return max((trip_request.end_date - trip_request.start_date).days + 1, 1)

    def _planning_destination(self, trip_request: TripRequest) -> str:
        if trip_request.trip_type == TripType.MULTI_CITY and trip_request.route_legs:
            return trip_request.route_legs[-1].destination_city
        return trip_request.destination_city

    def _budget_allocation(self, trip_request: TripRequest) -> Dict[str, float]:
        if trip_request.trip_type == TripType.MULTI_CITY:
            return {
                "flights": 0.38,
                "hotels": 0.29,
                "activities": 0.09,
                "food": 0.14,
                "local_transport": 0.10,
            }

        if trip_request.trip_type == TripType.ROUND_TRIP:
            return {
                "flights": 0.31,
                "hotels": 0.34,
                "activities": 0.08,
                "food": 0.15,
                "local_transport": 0.12,
            }

        return {
            "flights": 0.23,
            "hotels": 0.39,
            "activities": 0.10,
            "food": 0.17,
            "local_transport": 0.11,
        }

    def _minimum_flight_price_per_leg(self, trip_request: TripRequest) -> float:
        if not self._is_domestic_india_trip(trip_request):
            return {
                TravelStyle.BUDGET: 9500,
                TravelStyle.BALANCED: 11500,
                TravelStyle.PREMIUM: 17500,
            }[trip_request.travel_style]

        return {
            TravelStyle.BUDGET: 3000,
            TravelStyle.BALANCED: 3800,
            TravelStyle.PREMIUM: 5500,
        }[trip_request.travel_style]

    def _minimum_hotel_price_per_night(self, trip_request: TripRequest) -> float:
        if not self._is_domestic_india_trip(trip_request):
            return {
                TravelStyle.BUDGET: 3800,
                TravelStyle.BALANCED: 5500,
                TravelStyle.PREMIUM: 9500,
            }[trip_request.travel_style]

        return {
            TravelStyle.BUDGET: 1400,
            TravelStyle.BALANCED: 2100,
            TravelStyle.PREMIUM: 4200,
        }[trip_request.travel_style]

    def _minimum_single_activity_cost(self, trip_request: TripRequest) -> float:
        if self._is_domestic_india_trip(trip_request):
            return float(300 * max(trip_request.travelers, 1))

        return float(800 * max(trip_request.travelers, 1))

    def _minimum_activity_total(
        self,
        *,
        trip_request: TripRequest,
        activity_count: int,
    ) -> float:
        return self._minimum_single_activity_cost(trip_request) * max(activity_count, 1)

    def _minimum_food_cost(self, trip_request: TripRequest, trip_days: int) -> float:
        if self._is_domestic_india_trip(trip_request):
            daily_per_person = {
                TravelStyle.BUDGET: 400,
                TravelStyle.BALANCED: 550,
                TravelStyle.PREMIUM: 1000,
            }[trip_request.travel_style]
        else:
            daily_per_person = {
                TravelStyle.BUDGET: 900,
                TravelStyle.BALANCED: 1300,
                TravelStyle.PREMIUM: 2200,
            }[trip_request.travel_style]

        return float(daily_per_person * trip_request.travelers * trip_days)

    def _minimum_local_transport_cost(
        self,
        trip_request: TripRequest,
        trip_days: int,
    ) -> float:
        if self._is_domestic_india_trip(trip_request):
            daily_per_group = {
                TravelStyle.BUDGET: 300,
                TravelStyle.BALANCED: 450,
                TravelStyle.PREMIUM: 1000,
            }[trip_request.travel_style]
        else:
            daily_per_group = {
                TravelStyle.BUDGET: 900,
                TravelStyle.BALANCED: 1300,
                TravelStyle.PREMIUM: 2800,
            }[trip_request.travel_style]

        return float(daily_per_group * trip_days)

    def _minimum_possible_total(
        self,
        *,
        trip_request: TripRequest,
        route_leg_count: int,
        travelers: int,
        trip_days: int,
        buffer_rate: float,
        activity_count: int,
    ) -> float:
        subtotal = (
            self._minimum_flight_price_per_leg(trip_request) * travelers * route_leg_count
            + self._minimum_hotel_price_per_night(trip_request)
            * max((trip_request.end_date - trip_request.start_date).days, 1)
            + self._minimum_activity_total(
                trip_request=trip_request,
                activity_count=activity_count,
            )
            + self._minimum_food_cost(trip_request, trip_days)
            + self._minimum_local_transport_cost(trip_request, trip_days)
        )

        return round(subtotal * (1 + buffer_rate), 2)

    def _budget_airline_name(self, trip_request: TripRequest) -> str:
        if not self._is_domestic_india_trip(trip_request):
            return "Value International Fare"

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return "Vistara Value"

        return "IndiGo Saver"

    def _budget_hotel_name(self, trip_request: TripRequest, destination_city: str) -> str:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return f"Premium Value Stay {destination_city}"

        if trip_request.travel_style == TravelStyle.BUDGET:
            return f"Urban Nest {destination_city}"

        return f"Smart Value Stay {destination_city}"

    def _budget_hotel_rating(self, trip_request: TripRequest) -> float:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return 4.4

        if trip_request.travel_style == TravelStyle.BUDGET:
            return 4.0

        return 4.2

    def _budget_amenities(self, trip_request: TripRequest) -> List[str]:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return ["WiFi", "Breakfast", "Airport Access", "Premium Room"]

        if trip_request.travel_style == TravelStyle.BUDGET:
            return ["WiFi", "Breakfast", "24x7 Desk"]

        return ["WiFi", "Breakfast", "Airport Access"]

    def _is_domestic_india_trip(self, trip_request: TripRequest) -> bool:
        route_cities: List[str] = []

        if trip_request.route_legs:
            for leg in trip_request.route_legs:
                route_cities.append(leg.source_city)
                route_cities.append(leg.destination_city)
        else:
            route_cities = [trip_request.source_city, trip_request.destination_city]

        return all(self._is_india_city(city) for city in route_cities)

    def _is_india_city(self, city: str) -> bool:
        return self._city_key(city) in {
            "kolkata",
            "bengaluru",
            "chennai",
            "delhi",
            "mumbai",
            "hyderabad",
            "goa",
            "pune",
            "jaipur",
        }

    def _city_key(self, city: str) -> str:
        value = str(city or "").strip().lower()

        aliases = {
            "bangalore": "bengaluru",
            "blr": "bengaluru",
            "calcutta": "kolkata",
            "ccu": "kolkata",
            "bombay": "mumbai",
            "bom": "mumbai",
            "new delhi": "delhi",
            "dxb": "dubai",
            "bkk": "bangkok",
            "sin": "singapore",
        }

        return aliases.get(value, value)

    def _copy_model(self, model: Any, updates: Dict[str, Any]) -> Any:
        data = model.model_dump()
        data.update(updates)
        return model.__class__(**data)