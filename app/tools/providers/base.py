from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from app.models.trip import (
    ActivityOption,
    FlightOption,
    HotelOption,
    TripRequest,
    WeatherForecast,
)


class TravelDataProvider(ABC):
    """
    Abstract provider interface.

    Agents depend on this interface, not on a specific API.

    Current implementation:
    - MockTravelProvider

    Future implementations can be:
    - AmadeusFlightProvider
    - BookingHotelProvider
    - OpenMeteoWeatherProvider
    - GooglePlacesActivityProvider
    """

    @abstractmethod
    async def search_flights(self, request: TripRequest) -> List[FlightOption]:
        raise NotImplementedError

    @abstractmethod
    async def search_hotels(self, request: TripRequest) -> List[HotelOption]:
        raise NotImplementedError

    @abstractmethod
    async def get_weather(self, request: TripRequest) -> List[WeatherForecast]:
        raise NotImplementedError

    @abstractmethod
    async def search_activities(self, request: TripRequest) -> List[ActivityOption]:
        raise NotImplementedError