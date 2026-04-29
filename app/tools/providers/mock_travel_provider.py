from __future__ import annotations

import asyncio
from datetime import timedelta
from typing import List
from urllib.parse import quote_plus

from app.models.trip import (
    ActivityOption,
    FlightOption,
    HotelOption,
    TravelStyle,
    TripRequest,
    WeatherForecast,
)
from app.tools.providers.base import TravelDataProvider


class MockTravelProvider(TravelDataProvider):
    """
    Free local provider.

    This simulates real flight, hotel, weather, and activity APIs.
    No paid APIs. No cards. No key headache.

    The structure is intentionally API-like so we can replace this provider later
    without rewriting all agents.
    """

    async def search_flights(self, request: TripRequest) -> List[FlightOption]:
        await asyncio.sleep(0.2)

        base_price = self._flight_base_price(request)

        return [
            FlightOption(
                airline="IndiSky Airways",
                flight_number="IS-204",
                source_city=request.source_city,
                destination_city=request.destination_city,
                departure_time="07:30",
                arrival_time="10:05",
                duration="2h 35m",
                price=base_price,
                booking_link=self._booking_link("flights", request),
            ),
            FlightOption(
                airline="AeroVista",
                flight_number="AV-618",
                source_city=request.source_city,
                destination_city=request.destination_city,
                departure_time="13:15",
                arrival_time="15:55",
                duration="2h 40m",
                price=base_price + 1800,
                booking_link=self._booking_link("flights", request),
            ),
            FlightOption(
                airline="CloudJet",
                flight_number="CJ-902",
                source_city=request.source_city,
                destination_city=request.destination_city,
                departure_time="20:10",
                arrival_time="22:50",
                duration="2h 40m",
                price=max(base_price - 1200, 2500),
                booking_link=self._booking_link("flights", request),
            ),
        ]

    async def search_hotels(self, request: TripRequest) -> List[HotelOption]:
        await asyncio.sleep(0.2)

        nights = self._trip_nights(request)

        if request.travel_style == TravelStyle.BUDGET:
            hotel_prices = [1800, 2400, 3200]
        elif request.travel_style == TravelStyle.PREMIUM:
            hotel_prices = [6500, 8500, 12000]
        else:
            hotel_prices = [3200, 4500, 5800]

        return [
            HotelOption(
                name=f"{request.destination_city} Urban Stay",
                location=f"Central {request.destination_city}",
                rating=4.1,
                nights=nights,
                price_per_night=hotel_prices[0],
                total_price=hotel_prices[0] * nights,
                amenities=["WiFi", "Breakfast", "AC", "Workspace"],
                booking_link=self._booking_link("hotels", request),
            ),
            HotelOption(
                name=f"The Horizon {request.destination_city}",
                location=f"Near main attractions, {request.destination_city}",
                rating=4.4,
                nights=nights,
                price_per_night=hotel_prices[1],
                total_price=hotel_prices[1] * nights,
                amenities=["WiFi", "Pool", "Breakfast", "Airport Pickup"],
                booking_link=self._booking_link("hotels", request),
            ),
            HotelOption(
                name=f"Azure Grand {request.destination_city}",
                location=f"Premium district, {request.destination_city}",
                rating=4.7,
                nights=nights,
                price_per_night=hotel_prices[2],
                total_price=hotel_prices[2] * nights,
                amenities=["WiFi", "Spa", "Pool", "Fine Dining", "Concierge"],
                booking_link=self._booking_link("hotels", request),
            ),
        ]

    async def get_weather(self, request: TripRequest) -> List[WeatherForecast]:
        await asyncio.sleep(0.15)

        days = self._trip_days(request)
        conditions = ["Sunny", "Partly Cloudy", "Humid", "Light Rain", "Clear"]

        forecast: List[WeatherForecast] = []

        for index in range(days):
            current_date = request.start_date + timedelta(days=index)
            condition = conditions[index % len(conditions)]
            temperature = 27 + (index % 5)

            forecast.append(
                WeatherForecast(
                    date=current_date,
                    condition=condition,
                    temperature_celsius=temperature,
                    travel_advice=self._weather_advice(condition),
                )
            )

        return forecast

    async def search_activities(self, request: TripRequest) -> List[ActivityOption]:
        await asyncio.sleep(0.2)

        activities: List[ActivityOption] = []

        interest_map = {
            "beaches": [
                ActivityOption(
                    name="Sunset Beach Walk",
                    category="beaches",
                    location=request.destination_city,
                    estimated_cost=500,
                    duration_hours=2,
                    description="Relaxed beach walk with sunset views and local snacks.",
                    booking_link=self._booking_link("activities", request),
                ),
                ActivityOption(
                    name="Water Sports Session",
                    category="beaches",
                    location=request.destination_city,
                    estimated_cost=2500,
                    duration_hours=3,
                    description="Jet ski, banana boat, and beginner-friendly water activities.",
                    booking_link=self._booking_link("activities", request),
                ),
            ],
            "nightlife": [
                ActivityOption(
                    name="Night Market Experience",
                    category="nightlife",
                    location=request.destination_city,
                    estimated_cost=1200,
                    duration_hours=3,
                    description="Explore music, food stalls, shopping, and local nightlife.",
                    booking_link=self._booking_link("activities", request),
                )
            ],
            "local food": [
                ActivityOption(
                    name="Local Food Trail",
                    category="local food",
                    location=request.destination_city,
                    estimated_cost=1500,
                    duration_hours=3,
                    description="Guided tasting of regional dishes, street food, and desserts.",
                    booking_link=self._booking_link("activities", request),
                )
            ],
            "culture": [
                ActivityOption(
                    name="Heritage City Walk",
                    category="culture",
                    location=request.destination_city,
                    estimated_cost=1000,
                    duration_hours=2.5,
                    description="Explore historical spots, local architecture, and stories.",
                    booking_link=self._booking_link("activities", request),
                )
            ],
            "adventure": [
                ActivityOption(
                    name="Adventure Day Package",
                    category="adventure",
                    location=request.destination_city,
                    estimated_cost=3000,
                    duration_hours=5,
                    description="Outdoor adventure experience tailored for active travelers.",
                    booking_link=self._booking_link("activities", request),
                )
            ],
        }

        for interest in request.interests:
            normalized_interest = interest.strip().lower()
            activities.extend(interest_map.get(normalized_interest, []))

        if not activities:
            activities.append(
                ActivityOption(
                    name=f"{request.destination_city} Highlights Tour",
                    category="general",
                    location=request.destination_city,
                    estimated_cost=1800,
                    duration_hours=4,
                    description="A balanced city experience covering top attractions.",
                    booking_link=self._booking_link("activities", request),
                )
            )

        return activities

    def _trip_nights(self, request: TripRequest) -> int:
        return max((request.end_date - request.start_date).days, 1)

    def _trip_days(self, request: TripRequest) -> int:
        return self._trip_nights(request) + 1

    def _flight_base_price(self, request: TripRequest) -> float:
        style_multiplier = {
            TravelStyle.BUDGET: 0.85,
            TravelStyle.BALANCED: 1.0,
            TravelStyle.PREMIUM: 1.35,
        }

        base = 5500 * request.travelers
        return round(base * style_multiplier[request.travel_style], 2)

    def _weather_advice(self, condition: str) -> str:
        if condition.lower() == "light rain":
            return "Carry an umbrella and keep outdoor activities flexible."
        if condition.lower() == "humid":
            return "Stay hydrated and plan indoor breaks during afternoon."
        if condition.lower() == "sunny":
            return "Use sunscreen and schedule outdoor activities early or late."
        return "Good travel conditions overall."

    def _booking_link(self, category: str, request: TripRequest) -> str:
        query = quote_plus(
            f"{category} {request.source_city} to {request.destination_city} "
            f"{request.start_date} {request.end_date}"
        )
        return f"https://www.google.com/search?q={query}"