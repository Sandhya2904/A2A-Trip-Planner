from __future__ import annotations

from typing import Any, Dict

from app.a2a.messages import AgentRole
from app.agents.base import BaseAgent
from app.models.trip import TripRequest
from app.tools.providers.base import TravelDataProvider


class WeatherAgent(BaseAgent):
    """
    Specialized agent responsible only for weather forecasting.

    Boundary:
    - It does not select hotels.
    - It does not select flights.
    - It does not create the final itinerary.
    - It only returns weather forecasts and travel advice.
    """

    def __init__(self, provider: TravelDataProvider) -> None:
        super().__init__(
            role=AgentRole.WEATHER_AGENT,
            name="Weather Agent",
            description="Checks weather forecasts and travel advisories.",
        )
        self.provider = provider

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trip_request = TripRequest(**payload)

        weather_forecast = await self.provider.get_weather(trip_request)

        return {
            "agent": self.name,
            "total_days": len(weather_forecast),
            "forecast": [
                forecast.model_dump(mode="json") for forecast in weather_forecast
            ],
            "summary": self._create_weather_summary(weather_forecast),
        }

    def _create_weather_summary(self, weather_forecast) -> str:
        if not weather_forecast:
            return "No weather forecast available."

        rainy_days = [
            forecast for forecast in weather_forecast
            if "rain" in forecast.condition.lower()
        ]

        hot_days = [
            forecast for forecast in weather_forecast
            if forecast.temperature_celsius >= 30
        ]

        if rainy_days:
            return (
                "Some light rain is expected during the trip, so the itinerary "
                "should keep outdoor plans flexible."
            )

        if hot_days:
            return (
                "Weather looks mostly clear but warm, so outdoor activities should "
                "be planned in the morning or evening."
            )

        return (
            "Weather looks travel-friendly overall with no major disruptions expected."
        )