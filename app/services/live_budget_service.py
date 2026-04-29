from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.models.trip import TravelStyle, TripRequest


@dataclass
class PriceResult:
    amount_inr: float
    source: str
    confidence: str
    label: str
    raw: Dict[str, Any]


class LiveBudgetService:
    """
    SerpApi-backed real-world travel budget service.

    It checks:
    - Google Flights through SerpApi
    - Google Hotels through SerpApi

    If live data fails, it uses honest fallback estimates and marks them clearly.
    """

    SERPAPI_SEARCH_URL = "https://serpapi.com/search.json"

    CITY_IATA = {
        "kolkata": "CCU",
        "calcutta": "CCU",
        "bengaluru": "BLR",
        "bangalore": "BLR",
        "delhi": "DEL",
        "new delhi": "DEL",
        "mumbai": "BOM",
        "bombay": "BOM",
        "chennai": "MAA",
        "hyderabad": "HYD",
        "goa": "GOI",
        "pune": "PNQ",
        "jaipur": "JAI",
        "kanpur": "KNU",
        "dubai": "DXB",
        "abu dhabi": "AUH",
        "sharjah": "SHJ",
        "london": "LON",
        "paris": "PAR",
        "tokyo": "TYO",
        "singapore": "SIN",
        "bangkok": "BKK",
        "kuala lumpur": "KUL",
        "malaysia": "KUL",
        "new york": "NYC",
    }

    def __init__(self) -> None:
        self.api_key = os.getenv("SERPAPI_API_KEY", "").strip()
        self.timeout = httpx.Timeout(35.0, connect=12.0)

    async def estimate_budget(
        self,
        trip_request: TripRequest,
        existing_plan: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        trip_days = self._trip_days(trip_request)
        nights = max(trip_days - 1, 1)
        travelers = max(int(trip_request.travelers or 1), 1)

        source_city = trip_request.source_city
        destination_city = self._planning_destination(trip_request)

        flight_result = await self._estimate_flights(
            trip_request=trip_request,
            source_city=source_city,
            destination_city=destination_city,
            travelers=travelers,
        )

        hotel_result = await self._estimate_hotels(
            trip_request=trip_request,
            destination_city=destination_city,
            nights=nights,
            travelers=travelers,
        )

        food_cost = self._estimate_food_cost(
            trip_request=trip_request,
            trip_days=trip_days,
            travelers=travelers,
        )

        local_transport_cost = self._estimate_local_transport_cost(
            trip_request=trip_request,
            trip_days=trip_days,
            travelers=travelers,
        )

        activities_cost = self._estimate_activity_cost(
            trip_request=trip_request,
            trip_days=trip_days,
            travelers=travelers,
        )

        subtotal = (
            flight_result.amount_inr
            + hotel_result.amount_inr
            + food_cost
            + local_transport_cost
            + activities_cost
        )

        buffer_rate = 0.12 if self._is_international(trip_request) else 0.08
        buffer = round(subtotal * buffer_rate, 2)
        total = round(subtotal + buffer, 2)
        remaining = round(float(trip_request.budget or 0) - total, 2)

        live_count = len(
            [
                item
                for item in [flight_result, hotel_result]
                if item.source == "live_api"
            ]
        )

        if live_count == 2:
            price_source = "live_api"
            confidence = "high"
        elif live_count == 1:
            price_source = "mixed_live_and_fallback"
            confidence = "medium"
        else:
            price_source = "fallback_estimate"
            confidence = "low"

        budget_status = self._budget_status(remaining, total)

        budget_breakdown = {
            "flights": round(flight_result.amount_inr, 2),
            "hotels": round(hotel_result.amount_inr, 2),
            "activities": round(activities_cost, 2),
            "food": round(food_cost, 2),
            "local_transport": round(local_transport_cost, 2),
            "buffer": buffer,
            "total_estimated_cost": total,
            "remaining_budget": remaining,
        }

        warnings: List[str] = []

        if flight_result.source != "live_api":
            warnings.append(flight_result.label)

        if hotel_result.source != "live_api":
            warnings.append(hotel_result.label)

        pricing_metadata = {
            "price_source": price_source,
            "confidence": confidence,
            "live_pricing_enabled": bool(self.api_key),
            "provider": "SerpApi Google Flights + Google Hotels",
            "source_city": source_city,
            "destination_city": destination_city,
            "source_iata": self._known_iata(source_city),
            "destination_iata": self._known_iata(destination_city),
            "trip_days": trip_days,
            "nights": nights,
            "travelers": travelers,
            "travel_class": getattr(trip_request, "travel_class", "Economy / Premium Economy"),
            "google_flights_travel_class": self._google_flights_travel_class(
    getattr(trip_request, "travel_class", None)
),
"currency": "INR",
"budget_status": budget_status,
            "warnings": warnings,
            "flight_pricing": {
                "source": flight_result.source,
                "confidence": flight_result.confidence,
                "label": flight_result.label,
                "raw": flight_result.raw,
            },
            "hotel_pricing": {
                "source": hotel_result.source,
                "confidence": hotel_result.confidence,
                "label": hotel_result.label,
                "raw": hotel_result.raw,
            },
        }

        return {
            "budget_breakdown": budget_breakdown,
            "budget_status": budget_status,
            "pricing_metadata": pricing_metadata,
            "summary": self._build_summary(
                trip_request=trip_request,
                destination_city=destination_city,
                total=total,
                remaining=remaining,
                price_source=price_source,
                confidence=confidence,
            ),
            "selected_flight_patch": self._build_flight_patch(
                trip_request=trip_request,
                source_city=source_city,
                destination_city=destination_city,
                flight_result=flight_result,
            ),
            "selected_hotel_patch": self._build_hotel_patch(
                destination_city=destination_city,
                hotel_result=hotel_result,
                nights=nights,
            ),
        }
    def _google_flights_travel_class(self, travel_class: str | None) -> int:
        """
        SerpApi Google Flights travel_class:
        1 = Economy
        2 = Premium economy
        3 = Business
        4 = First
        """

        clean_class = str(travel_class or "").strip().lower()

        if "first" in clean_class:
            return 4

        if "business" in clean_class:
            return 3

        if "premium" in clean_class:
            return 2

        return 1
    async def _estimate_flights(
        self,
        *,
        trip_request: TripRequest,
        source_city: str,
        destination_city: str,
        travelers: int,
    ) -> PriceResult:
        source_iata = self._known_iata(source_city)
        destination_iata = self._known_iata(destination_city)

        if not self.api_key:
            return self._fallback_flight_price(
                trip_request=trip_request,
                source_city=source_city,
                destination_city=destination_city,
                reason="SERPAPI_API_KEY is missing, so live flight pricing was skipped.",
            )

        if not source_iata or not destination_iata:
            return self._fallback_flight_price(
                trip_request=trip_request,
                source_city=source_city,
                destination_city=destination_city,
                reason="IATA code missing for source or destination, so live flight pricing was skipped.",
            )

        trip_type = self._trip_type_value(trip_request)

        params: Dict[str, Any] = {
    "engine": "google_flights",
    "departure_id": source_iata,
    "arrival_id": destination_iata,
    "outbound_date": trip_request.start_date.isoformat(),
    "adults": travelers,
    "currency": "INR",
    "hl": "en",
    "gl": "in",
    "travel_class": self._google_flights_travel_class(
        getattr(trip_request, "travel_class", None)
    ),
    "api_key": self.api_key,
}

        if trip_type == "round_trip":
            params["type"] = "1"
            params["return_date"] = trip_request.end_date.isoformat()
        else:
            params["type"] = "2"

        try:
            payload = await self._serpapi_get(params)
            priced_options = self._extract_flight_prices(payload)

            if not priced_options:
                return self._fallback_flight_price(
                    trip_request=trip_request,
                    source_city=source_city,
                    destination_city=destination_city,
                    reason="SerpApi Google Flights returned no priced flight options.",
                )

            cheapest_price, cheapest_item = sorted(
                priced_options,
                key=lambda item: item[0],
            )[0]

            return PriceResult(
                amount_inr=round(cheapest_price, 2),
                source="live_api",
                confidence="high",
                label=(
                    f"Live SerpApi Google Flights price used for "
                    f"{source_iata} → {destination_iata}."
                ),
                raw={
                    "source_iata": source_iata,
                    "destination_iata": destination_iata,
                    "trip_type": trip_type,
                    "price": cheapest_price,
                    "options_checked": len(priced_options),
                    "sample": cheapest_item,
                },
            )

        except Exception as exc:
            return self._fallback_flight_price(
                trip_request=trip_request,
                source_city=source_city,
                destination_city=destination_city,
                reason=f"SerpApi Google Flights failed: {exc}",
            )

    async def _estimate_hotels(
        self,
        *,
        trip_request: TripRequest,
        destination_city: str,
        nights: int,
        travelers: int,
    ) -> PriceResult:
        if not self.api_key:
            return self._fallback_hotel_price(
                trip_request=trip_request,
                destination_city=destination_city,
                nights=nights,
                reason="SERPAPI_API_KEY is missing, so live hotel pricing was skipped.",
            )

        check_in = trip_request.start_date
        check_out = trip_request.start_date + timedelta(days=nights)

        params: Dict[str, Any] = {
            "engine": "google_hotels",
            "q": f"hotels in {destination_city}",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "adults": travelers,
            "currency": "INR",
            "hl": "en",
            "gl": "in",
            "api_key": self.api_key,
        }

        try:
            payload = await self._serpapi_get(params)
            priced_hotels = self._extract_hotel_prices(payload, nights=nights)

            if not priced_hotels:
                return self._fallback_hotel_price(
                    trip_request=trip_request,
                    destination_city=destination_city,
                    nights=nights,
                    reason="SerpApi Google Hotels returned no priced hotel results.",
                )

            cheapest_total, cheapest_hotel = sorted(
                priced_hotels,
                key=lambda item: item[0],
            )[0]

            hotel_name = cheapest_hotel.get("name") or f"Live hotel in {destination_city}"

            return PriceResult(
                amount_inr=round(cheapest_total, 2),
                source="live_api",
                confidence="high",
                label=f"Live SerpApi Google Hotels price used for {destination_city}.",
                raw={
                    "destination_city": destination_city,
                    "hotel_name": hotel_name,
                    "price": cheapest_total,
                    "nights": nights,
                    "hotels_checked": len(priced_hotels),
                    "sample": cheapest_hotel,
                },
            )

        except Exception as exc:
            return self._fallback_hotel_price(
                trip_request=trip_request,
                destination_city=destination_city,
                nights=nights,
                reason=f"SerpApi Google Hotels failed: {exc}",
            )

    async def _serpapi_get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(self.SERPAPI_SEARCH_URL, params=params)
            response.raise_for_status()
            payload = response.json()

            if payload.get("error"):
                raise RuntimeError(str(payload["error"]))

            return payload

    def _extract_flight_prices(
        self,
        payload: Dict[str, Any],
    ) -> List[Tuple[float, Dict[str, Any]]]:
        results: List[Tuple[float, Dict[str, Any]]] = []

        for section_name in ["best_flights", "other_flights"]:
            for item in payload.get(section_name, []) or []:
                price = self._money_to_float(item.get("price"))

                if price > 0:
                    results.append((price, item))

        return results

    def _extract_hotel_prices(
        self,
        payload: Dict[str, Any],
        *,
        nights: int,
    ) -> List[Tuple[float, Dict[str, Any]]]:
        results: List[Tuple[float, Dict[str, Any]]] = []

        for item in payload.get("properties", []) or []:
            total = self._extract_hotel_total(item, nights=nights)

            if total > 0:
                results.append((total, item))

        for item in payload.get("ads", []) or []:
            total = self._extract_hotel_total(item, nights=nights)

            if total > 0:
                results.append((total, item))

        return results

    def _extract_hotel_total(self, item: Dict[str, Any], *, nights: int) -> float:
        total_rate = item.get("total_rate")
        rate_per_night = item.get("rate_per_night")

        total_rate_amount = self._money_to_float(total_rate)

        if total_rate_amount > 0:
            return total_rate_amount

        if isinstance(total_rate, dict):
            for key in ["extracted_lowest", "extracted_price", "lowest", "amount"]:
                amount = self._money_to_float(total_rate.get(key))

                if amount > 0:
                    return amount

        nightly_amount = self._money_to_float(rate_per_night)

        if nightly_amount > 0:
            return nightly_amount * max(nights, 1)

        if isinstance(rate_per_night, dict):
            for key in ["extracted_lowest", "extracted_price", "lowest", "amount"]:
                amount = self._money_to_float(rate_per_night.get(key))

                if amount > 0:
                    return amount * max(nights, 1)

        for value in [
            item.get("price"),
            item.get("lowest_price"),
            item.get("extracted_price"),
        ]:
            amount = self._money_to_float(value)

            if amount > 0:
                return amount

        return 0.0

    def _fallback_flight_price(
        self,
        *,
        trip_request: TripRequest,
        source_city: str,
        destination_city: str,
        reason: str,
    ) -> PriceResult:
        travelers = max(int(trip_request.travelers or 1), 1)
        trip_type = self._trip_type_value(trip_request)
        style = trip_request.travel_style
        international = self._country_bucket(source_city) != self._country_bucket(
            destination_city
        )

        if international:
            base_one_way = {
                TravelStyle.BUDGET: 30000,
                TravelStyle.BALANCED: 48000,
                TravelStyle.PREMIUM: 90000,
            }[style]
        else:
            base_one_way = {
                TravelStyle.BUDGET: 4500,
                TravelStyle.BALANCED: 8000,
                TravelStyle.PREMIUM: 20000,
            }[style]

        multiplier = 1.85 if trip_type == "round_trip" else 1.0
        total = base_one_way * multiplier * travelers

        return PriceResult(
            amount_inr=round(total, 2),
            source="fallback_estimate",
            confidence="low",
            label=reason,
            raw={
                "source_city": source_city,
                "destination_city": destination_city,
                "international": international,
                "trip_type": trip_type,
                "base_one_way": base_one_way,
                "travelers": travelers,
            },
        )

    def _fallback_hotel_price(
        self,
        *,
        trip_request: TripRequest,
        destination_city: str,
        nights: int,
        reason: str,
    ) -> PriceResult:
        style = trip_request.travel_style
        travelers = max(int(trip_request.travelers or 1), 1)
        international = self._country_bucket(destination_city) != "india"

        if international:
            per_night = {
                TravelStyle.BUDGET: 5500,
                TravelStyle.BALANCED: 9500,
                TravelStyle.PREMIUM: 19000,
            }[style]
        else:
            per_night = {
                TravelStyle.BUDGET: 1800,
                TravelStyle.BALANCED: 3800,
                TravelStyle.PREMIUM: 9000,
            }[style]

        rooms = max(1, round((travelers + 1) / 2))
        total = per_night * nights * rooms

        return PriceResult(
            amount_inr=round(total, 2),
            source="fallback_estimate",
            confidence="low",
            label=reason,
            raw={
                "destination_city": destination_city,
                "international": international,
                "per_night": per_night,
                "nights": nights,
                "rooms": rooms,
            },
        )

    def _estimate_food_cost(
        self,
        *,
        trip_request: TripRequest,
        trip_days: int,
        travelers: int,
    ) -> float:
        style = trip_request.travel_style
        international = self._is_international(trip_request)

        if international:
            daily = {
                TravelStyle.BUDGET: 1800,
                TravelStyle.BALANCED: 3200,
                TravelStyle.PREMIUM: 7000,
            }[style]
        else:
            daily = {
                TravelStyle.BUDGET: 700,
                TravelStyle.BALANCED: 1200,
                TravelStyle.PREMIUM: 2800,
            }[style]

        return float(daily * trip_days * travelers)

    def _estimate_local_transport_cost(
        self,
        *,
        trip_request: TripRequest,
        trip_days: int,
        travelers: int,
    ) -> float:
        style = trip_request.travel_style
        international = self._is_international(trip_request)

        if international:
            daily = {
                TravelStyle.BUDGET: 1200,
                TravelStyle.BALANCED: 2500,
                TravelStyle.PREMIUM: 6000,
            }[style]
        else:
            daily = {
                TravelStyle.BUDGET: 400,
                TravelStyle.BALANCED: 850,
                TravelStyle.PREMIUM: 2000,
            }[style]

        return float(daily * trip_days * travelers)

    def _estimate_activity_cost(
        self,
        *,
        trip_request: TripRequest,
        trip_days: int,
        travelers: int,
    ) -> float:
        style = trip_request.travel_style
        international = self._is_international(trip_request)
        selected_interest_count = max(len(trip_request.interests or []), 1)
        active_days = max(min(trip_days - 1, selected_interest_count + 1), 1)

        if international:
            per_activity = {
                TravelStyle.BUDGET: 1800,
                TravelStyle.BALANCED: 3500,
                TravelStyle.PREMIUM: 8500,
            }[style]
        else:
            per_activity = {
                TravelStyle.BUDGET: 900,
                TravelStyle.BALANCED: 1800,
                TravelStyle.PREMIUM: 4500,
            }[style]

        return float(per_activity * active_days * travelers)

    def _build_summary(
        self,
        *,
        trip_request: TripRequest,
        destination_city: str,
        total: float,
        remaining: float,
        price_source: str,
        confidence: str,
    ) -> str:
        budget_sentence = (
            "within the requested budget"
            if remaining >= 0
            else "above the requested budget"
        )

        return (
            f"{self._trip_days(trip_request)}-day {trip_request.travel_style.value} "
            f"trip from {trip_request.source_city} to {destination_city}. "
            f"Estimated total is INR {total:,.0f}, which is {budget_sentence}. "
            f"Pricing source: {price_source}; confidence: {confidence}."
        )

    def _build_flight_patch(
        self,
        *,
        trip_request: TripRequest,
        source_city: str,
        destination_city: str,
        flight_result: PriceResult,
    ) -> Dict[str, Any]:
        return {
            "airline": "Live Google Flights option"
            if flight_result.source == "live_api"
            else "Estimated flight option",
            "flight_number": "SERPAPI-LIVE"
            if flight_result.source == "live_api"
            else "EST-001",
            "source_city": source_city,
            "destination_city": destination_city,
            "departure_time": "Based on selected travel date",
            "arrival_time": "See booking provider",
            "duration": "Live offer"
            if flight_result.source == "live_api"
            else "Estimated",
            "price": round(flight_result.amount_inr, 2),
            "booking_link": self._build_flight_search_link(trip_request),
        }

    def _build_hotel_patch(
        self,
        *,
        destination_city: str,
        hotel_result: PriceResult,
        nights: int,
    ) -> Dict[str, Any]:
        hotel_name = (
            hotel_result.raw.get("hotel_name")
            or hotel_result.raw.get("name")
            or (
                f"Live priced stay in {destination_city}"
                if hotel_result.source == "live_api"
                else f"Estimated stay in {destination_city}"
            )
        )

        price_per_night = hotel_result.amount_inr / max(nights, 1)

        return {
            "name": hotel_name,
            "location": destination_city,
            "rating": 4.2 if hotel_result.source == "live_api" else 3.8,
            "nights": nights,
            "price_per_night": round(price_per_night, 2),
            "total_price": round(hotel_result.amount_inr, 2),
            "amenities": ["Stay estimate", "Location based", "Budget checked"],
            "booking_link": self._build_hotel_search_link(destination_city),
        }

    def _budget_status(self, remaining: float, total: float) -> str:
        if remaining < 0:
            return "over_budget"

        if total > 0 and remaining <= total * 0.10:
            return "tight_budget"

        return "within_budget"

    def _trip_days(self, trip_request: TripRequest) -> int:
        return max((trip_request.end_date - trip_request.start_date).days + 1, 1)

    def _planning_destination(self, trip_request: TripRequest) -> str:
        trip_type = self._trip_type_value(trip_request)

        if trip_type == "multi_city" and trip_request.route_legs:
            return trip_request.route_legs[-1].destination_city

        return trip_request.destination_city

    def _is_international(self, trip_request: TripRequest) -> bool:
        return self._country_bucket(trip_request.source_city) != self._country_bucket(
            self._planning_destination(trip_request)
        )

    def _country_bucket(self, city: str) -> str:
        key = self._clean_city(city).lower()

        india = {
            "india",
            "kolkata",
            "calcutta",
            "bengaluru",
            "bangalore",
            "delhi",
            "new delhi",
            "mumbai",
            "bombay",
            "chennai",
            "hyderabad",
            "goa",
            "pune",
            "jaipur",
            "kanpur",
        }

        malaysia = {"malaysia", "kuala lumpur", "kul", "penang", "langkawi"}
        uae = {"uae", "united arab emirates", "dubai", "abu dhabi", "sharjah"}
        uk = {"uk", "united kingdom", "london", "manchester"}
        singapore = {"singapore"}
        thailand = {"thailand", "bangkok", "phuket"}
        france = {"france", "paris"}
        japan = {"japan", "tokyo", "osaka"}
        usa = {
            "usa",
            "us",
            "united states",
            "new york",
            "los angeles",
            "san francisco",
        }

        if key in india:
            return "india"
        if key in malaysia:
            return "malaysia"
        if key in uae:
            return "uae"
        if key in uk:
            return "uk"
        if key in singapore:
            return "singapore"
        if key in thailand:
            return "thailand"
        if key in france:
            return "france"
        if key in japan:
            return "japan"
        if key in usa:
            return "usa"

        return key or "unknown"

    def _known_iata(self, city: str) -> Optional[str]:
        return self.CITY_IATA.get(self._clean_city(city).lower())

    def _trip_type_value(self, trip_request: TripRequest) -> str:
        return getattr(trip_request.trip_type, "value", str(trip_request.trip_type))

    def _clean_city(self, value: str) -> str:
        return str(value or "").strip()

    def _money_to_float(self, value: Any) -> float:
        if value is None:
            return 0.0

        if isinstance(value, (int, float)):
            return float(value)

        if isinstance(value, dict):
            for key in [
                "extracted_price",
                "extracted_lowest",
                "amount",
                "price",
                "total",
                "lowest",
            ]:
                amount = self._money_to_float(value.get(key))

                if amount > 0:
                    return amount

            return 0.0

        clean = (
            str(value)
            .replace("₹", "")
            .replace("INR", "")
            .replace(",", "")
            .strip()
        )

        digits = "".join(ch for ch in clean if ch.isdigit() or ch == ".")

        try:
            return float(digits)
        except ValueError:
            return 0.0

    def _build_flight_search_link(self, trip_request: TripRequest) -> str:
        route_text = (
            f"{trip_request.source_city} to {self._planning_destination(trip_request)}"
        )

        return (
            "https://www.google.com/travel/flights?q="
            f"{route_text.replace(' ', '%20')}"
        )

    def _build_hotel_search_link(self, destination_city: str) -> str:
        return (
            "https://www.google.com/travel/hotels?q="
            f"hotels%20in%20{destination_city.replace(' ', '%20')}"
        )