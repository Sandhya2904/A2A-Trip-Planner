from __future__ import annotations

from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class TravelStyle(str, Enum):
    BUDGET = "budget"
    BALANCED = "balanced"
    PREMIUM = "premium"


class TripType(str, Enum):
    ONE_WAY = "one_way"
    ROUND_TRIP = "round_trip"
    MULTI_CITY = "multi_city"


def _clean_city_text(value: str) -> str:
    cleaned = " ".join(value.strip().split())

    if not cleaned:
        raise ValueError("City name cannot be empty.")

    if any(char.isdigit() for char in cleaned):
        raise ValueError("City name cannot contain numbers.")

    return cleaned.title()


class RouteLeg(BaseModel):
    source_city: str = Field(..., min_length=2, max_length=80)
    destination_city: str = Field(..., min_length=2, max_length=80)
    travel_date: date

    @field_validator("source_city", "destination_city")
    @classmethod
    def clean_city_name(cls, value: str) -> str:
        return _clean_city_text(value)

    @model_validator(mode="after")
    def validate_leg(self) -> "RouteLeg":
        if self.source_city.lower() == self.destination_city.lower():
            raise ValueError("Each route leg must have different source and destination cities.")
        return self


class TripRequest(BaseModel):
    source_city: str = Field(..., min_length=2, max_length=80)
    destination_city: str = Field(..., min_length=2, max_length=80)
    start_date: date
    end_date: date
    budget: float = Field(..., gt=0, le=10_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    travelers: int = Field(default=1, ge=1, le=20)
    interests: List[str] = Field(default_factory=list, max_length=12)
    travel_style: TravelStyle = TravelStyle.BALANCED
    travel_class: str = Field(default="Economy / Premium Economy", max_length=40)
    trip_type: TripType = TripType.ONE_WAY
    route_legs: List[RouteLeg] = Field(default_factory=list, max_length=6)

    @field_validator("source_city", "destination_city")
    @classmethod
    def clean_city_name(cls, value: str) -> str:
        return _clean_city_text(value)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        cleaned = value.strip().upper()

        allowed_currencies = {"INR", "USD", "EUR", "GBP"}

        if cleaned not in allowed_currencies:
            raise ValueError(
                f"Unsupported currency '{cleaned}'. "
                f"Allowed values are: {', '.join(sorted(allowed_currencies))}."
            )

        return cleaned

    @field_validator("interests")
    @classmethod
    def normalize_interests(cls, values: List[str]) -> List[str]:
        allowed_interests = {
            "beaches",
            "nightlife",
            "local food",
            "culture",
            "adventure",
        }

        cleaned_interests: List[str] = []

        for interest in values:
            cleaned = " ".join(interest.strip().lower().split())

            if not cleaned:
                continue

            if cleaned not in allowed_interests:
                raise ValueError(
                    f"Unsupported interest '{cleaned}'. "
                    f"Allowed values are: {', '.join(sorted(allowed_interests))}."
                )

            if cleaned not in cleaned_interests:
                cleaned_interests.append(cleaned)

        return cleaned_interests

    @model_validator(mode="after")
    def validate_trip_dates_and_route(self) -> "TripRequest":
        if self.trip_type == TripType.MULTI_CITY:
            if len(self.route_legs) < 2:
                raise ValueError("Multi-city trips must include at least 2 route legs.")

            for index, leg in enumerate(self.route_legs):
                if index > 0:
                    previous_leg = self.route_legs[index - 1]

                    if leg.travel_date < previous_leg.travel_date:
                        raise ValueError("Multi-city leg dates must be in chronological order.")

                    if previous_leg.destination_city.lower() != leg.source_city.lower():
                        raise ValueError(
                            "Multi-city legs must connect properly: "
                            "previous destination must match next source."
                        )

            self.source_city = self.route_legs[0].source_city
            self.destination_city = self.route_legs[-1].destination_city
            self.start_date = self.route_legs[0].travel_date
            self.end_date = self.route_legs[-1].travel_date

        elif self.trip_type == TripType.ROUND_TRIP:
            if self.source_city.lower() == self.destination_city.lower():
                raise ValueError("Source city and destination city cannot be the same.")

            if not self.route_legs:
                self.route_legs = [
                    RouteLeg(
                        source_city=self.source_city,
                        destination_city=self.destination_city,
                        travel_date=self.start_date,
                    ),
                    RouteLeg(
                        source_city=self.destination_city,
                        destination_city=self.source_city,
                        travel_date=self.end_date,
                    ),
                ]

        else:
            if self.source_city.lower() == self.destination_city.lower():
                raise ValueError("Source city and destination city cannot be the same.")

            if not self.route_legs:
                self.route_legs = [
                    RouteLeg(
                        source_city=self.source_city,
                        destination_city=self.destination_city,
                        travel_date=self.start_date,
                    )
                ]

        if self.end_date < self.start_date:
            raise ValueError("End date cannot be earlier than start date.")

        trip_days = (self.end_date - self.start_date).days + 1

        if trip_days > 30:
            raise ValueError("Trip duration cannot exceed 30 days.")

        return self


class FlightOption(BaseModel):
    airline: str
    flight_number: str
    source_city: str
    destination_city: str
    departure_time: str
    arrival_time: str
    duration: str
    price: float
    booking_link: str


class HotelOption(BaseModel):
    name: str
    location: str
    rating: float
    nights: int
    price_per_night: float
    total_price: float
    amenities: List[str]
    booking_link: str


class WeatherForecast(BaseModel):
    date: date
    condition: str
    temperature_celsius: float
    travel_advice: str


class ActivityOption(BaseModel):
    name: str
    category: str
    location: str
    estimated_cost: float
    duration_hours: float
    description: str
    booking_link: Optional[str] = None


class BudgetBreakdown(BaseModel):
    flights: float = 0
    hotels: float = 0
    activities: float = 0
    food: float = 0
    local_transport: float = 0
    buffer: float = 0
    total_estimated_cost: float = 0
    remaining_budget: float = 0


class ItineraryDay(BaseModel):
    day: int
    date: date
    title: str
    morning: str
    afternoon: str
    evening: str
    estimated_cost: float
    weather_note: Optional[str] = None


class TripPlan(BaseModel):
    request: TripRequest
    selected_flight: Optional[FlightOption] = None
    selected_hotel: Optional[HotelOption] = None
    weather: List[WeatherForecast] = Field(default_factory=list)
    activities: List[ActivityOption] = Field(default_factory=list)
    itinerary: List[ItineraryDay] = Field(default_factory=list)
    budget_breakdown: Optional[BudgetBreakdown] = None
    summary: str = ""
    booking_links: List[str] = Field(default_factory=list)