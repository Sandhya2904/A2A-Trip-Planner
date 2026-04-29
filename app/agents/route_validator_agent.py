from __future__ import annotations

from datetime import date
from typing import List

from app.agents.base_agent import AgentResult, BaseTravelAgent
from app.models.trip import TripRequest, TripType


class RouteValidatorAgent(BaseTravelAgent):
    name = "Route Validator Agent"
    role = "route_validator_agent"
    responsibility = (
        "Validates trip input, route structure, dates, and basic travel feasibility "
        "before expensive planning agents run."
    )

    INDIA_CITIES = {
        "kolkata",
        "calcutta",
        "bengaluru",
        "bangalore",
        "blr",
        "chennai",
        "delhi",
        "new delhi",
        "mumbai",
        "bombay",
        "hyderabad",
        "goa",
        "pune",
        "jaipur",
    }

    INTERNATIONAL_CITIES = {
        "dubai",
        "dxb",
        "bangkok",
        "bkk",
        "singapore",
        "sin",
    }

    def validate(self, trip_request: TripRequest) -> AgentResult:
        warnings: List[str] = []
        errors: List[str] = []

        source = self._city_key(trip_request.source_city)
        destination = self._city_key(trip_request.destination_city)

        if source == destination:
            errors.append("Source city and destination city cannot be the same.")

        if trip_request.end_date < trip_request.start_date:
            errors.append("End date cannot be earlier than start date.")

        if trip_request.start_date < date.today():
            errors.append("Start date cannot be in the past.")

        trip_days = (trip_request.end_date - trip_request.start_date).days + 1

        if trip_days > 30:
            errors.append("Trip duration cannot exceed 30 days.")

        if trip_request.travelers < 1:
            errors.append("At least one traveler is required.")

        if trip_request.budget <= 0:
            errors.append("Budget must be greater than zero.")

        if trip_request.trip_type == TripType.MULTI_CITY:
            self._validate_multi_city(trip_request, errors, warnings)

        is_domestic_india = self.is_domestic_india_trip(trip_request)

        if not is_domestic_india:
            warnings.append(
                "This route is international or partly outside India. "
                "Flights and packages are recommended over trains, buses, or cabs."
            )

        minimum_hint = self.minimum_practical_budget_hint(trip_request)

        if trip_request.budget < minimum_hint:
            warnings.append(
                f"The requested budget may be tight. A more practical minimum estimate "
                f"for this trip is around {trip_request.currency} {minimum_hint:,.0f}."
            )

        if errors:
            return self.failure(
                summary="Trip request failed route validation.",
                warnings=errors + warnings,
                metadata={
                    "is_domestic_india": is_domestic_india,
                    "trip_days": trip_days,
                    "minimum_practical_budget_hint": minimum_hint,
                },
            )

        return self.success(
            summary="Trip request passed route validation.",
            warnings=warnings,
            confidence=0.94 if warnings else 0.99,
            data={
                "is_domestic_india": is_domestic_india,
                "trip_days": trip_days,
                "minimum_practical_budget_hint": minimum_hint,
            },
            metadata={
                "source_city": trip_request.source_city,
                "destination_city": trip_request.destination_city,
                "trip_type": trip_request.trip_type.value,
            },
        )

    def _validate_multi_city(
        self,
        trip_request: TripRequest,
        errors: List[str],
        warnings: List[str],
    ) -> None:
        if len(trip_request.route_legs) < 2:
            errors.append("Multi-city trips must include at least two route legs.")
            return

        seen_cities: List[str] = []

        for index, leg in enumerate(trip_request.route_legs):
            source = self._city_key(leg.source_city)
            destination = self._city_key(leg.destination_city)

            if source == destination:
                errors.append(
                    f"Multi-city leg {index + 1} has the same source and destination."
                )

            if index > 0:
                previous_leg = trip_request.route_legs[index - 1]

                if leg.travel_date < previous_leg.travel_date:
                    errors.append("Multi-city leg dates must be chronological.")

                if self._city_key(previous_leg.destination_city) != source:
                    errors.append(
                        "Multi-city route must connect properly: previous destination "
                        "must match next source."
                    )

            if source not in seen_cities:
                seen_cities.append(source)

            if destination not in seen_cities:
                seen_cities.append(destination)

        if len(seen_cities) < 3:
            warnings.append(
                "Multi-city route has fewer than three unique cities. "
                "Consider using round trip or one-way mode if this is intentional."
            )

    def is_domestic_india_trip(self, trip_request: TripRequest) -> bool:
        route_cities: List[str] = []

        if trip_request.route_legs:
            for leg in trip_request.route_legs:
                route_cities.append(leg.source_city)
                route_cities.append(leg.destination_city)
        else:
            route_cities = [trip_request.source_city, trip_request.destination_city]

        return all(self._city_key(city) in self.INDIA_CITIES for city in route_cities)

    def minimum_practical_budget_hint(self, trip_request: TripRequest) -> float:
        trip_days = max((trip_request.end_date - trip_request.start_date).days + 1, 1)
        travelers = max(trip_request.travelers, 1)
        domestic = self.is_domestic_india_trip(trip_request)

        if domestic:
            base_transport = 4500
            daily_per_person = 1100
            daily_group = 500
        else:
            base_transport = 16000
            daily_per_person = 2500
            daily_group = 1500

        if trip_request.trip_type == TripType.ROUND_TRIP:
            base_transport *= 2
        elif trip_request.trip_type == TripType.MULTI_CITY:
            base_transport *= max(len(trip_request.route_legs), 2)

        return float(
            base_transport * travelers
            + daily_per_person * travelers * trip_days
            + daily_group * trip_days
        )

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