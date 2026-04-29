from __future__ import annotations

import asyncio
import json
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class LocationSearchResult:
    """
    Normalized worldwide location result.

    Frontend can use `label` for display and city/country fields for payload.
    """

    id: str
    name: str
    label: str
    country: str
    country_code: str
    admin1: Optional[str]
    latitude: float
    longitude: float
    timezone: Optional[str]
    population: Optional[int]
    continent: str
    source: str = "open_meteo_geocoding"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "label": self.label,
            "country": self.country,
            "country_code": self.country_code,
            "admin1": self.admin1,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timezone": self.timezone,
            "population": self.population,
            "continent": self.continent,
            "source": self.source,
        }


class LocationSearchService:
    """
    Worldwide city/location search service.

    Uses Open-Meteo Geocoding API first.
    If internet/API fails, falls back to a small curated global city list.

    This keeps the frontend from hardcoding cities like:
    Kolkata, Bengaluru, Goa, Dubai only.

    Future upgrade:
    - Add GeoNames offline database
    - Add country/currency metadata
    - Add airport/IATA matching
    """

    OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

    COUNTRY_CONTINENT_MAP = {
        # Asia
        "IN": "Asia",
        "AE": "Asia",
        "TH": "Asia",
        "SG": "Asia",
        "MY": "Asia",
        "ID": "Asia",
        "VN": "Asia",
        "JP": "Asia",
        "KR": "Asia",
        "CN": "Asia",
        "NP": "Asia",
        "LK": "Asia",
        "BD": "Asia",
        "QA": "Asia",
        "SA": "Asia",
        "TR": "Asia",

        # Europe
        "GB": "Europe",
        "FR": "Europe",
        "DE": "Europe",
        "IT": "Europe",
        "ES": "Europe",
        "NL": "Europe",
        "CH": "Europe",
        "AT": "Europe",
        "SE": "Europe",
        "NO": "Europe",
        "DK": "Europe",
        "FI": "Europe",
        "IE": "Europe",
        "PT": "Europe",
        "GR": "Europe",

        # North America
        "US": "North America",
        "CA": "North America",
        "MX": "North America",

        # South America
        "BR": "South America",
        "AR": "South America",
        "CL": "South America",
        "CO": "South America",
        "PE": "South America",

        # Africa
        "ZA": "Africa",
        "EG": "Africa",
        "MA": "Africa",
        "KE": "Africa",
        "NG": "Africa",
        "TZ": "Africa",

        # Oceania
        "AU": "Oceania",
        "NZ": "Oceania",
    }

    FALLBACK_LOCATIONS = [
        {
            "name": "Kolkata",
            "country": "India",
            "country_code": "IN",
            "admin1": "West Bengal",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "timezone": "Asia/Kolkata",
            "population": 14900000,
        },
        {
            "name": "Bengaluru",
            "country": "India",
            "country_code": "IN",
            "admin1": "Karnataka",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "timezone": "Asia/Kolkata",
            "population": 13600000,
        },
        {
            "name": "Mumbai",
            "country": "India",
            "country_code": "IN",
            "admin1": "Maharashtra",
            "latitude": 19.076,
            "longitude": 72.8777,
            "timezone": "Asia/Kolkata",
            "population": 21000000,
        },
        {
            "name": "Delhi",
            "country": "India",
            "country_code": "IN",
            "admin1": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.209,
            "timezone": "Asia/Kolkata",
            "population": 32000000,
        },
        {
            "name": "Goa",
            "country": "India",
            "country_code": "IN",
            "admin1": "Goa",
            "latitude": 15.2993,
            "longitude": 74.124,
            "timezone": "Asia/Kolkata",
            "population": 1500000,
        },
        {
            "name": "Dubai",
            "country": "United Arab Emirates",
            "country_code": "AE",
            "admin1": "Dubai",
            "latitude": 25.2048,
            "longitude": 55.2708,
            "timezone": "Asia/Dubai",
            "population": 3600000,
        },
        {
            "name": "Bangkok",
            "country": "Thailand",
            "country_code": "TH",
            "admin1": "Bangkok",
            "latitude": 13.7563,
            "longitude": 100.5018,
            "timezone": "Asia/Bangkok",
            "population": 10500000,
        },
        {
            "name": "Singapore",
            "country": "Singapore",
            "country_code": "SG",
            "admin1": None,
            "latitude": 1.3521,
            "longitude": 103.8198,
            "timezone": "Asia/Singapore",
            "population": 5900000,
        },
        {
            "name": "London",
            "country": "United Kingdom",
            "country_code": "GB",
            "admin1": "England",
            "latitude": 51.5072,
            "longitude": -0.1276,
            "timezone": "Europe/London",
            "population": 9600000,
        },
        {
            "name": "Paris",
            "country": "France",
            "country_code": "FR",
            "admin1": "Île-de-France",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "timezone": "Europe/Paris",
            "population": 11000000,
        },
        {
            "name": "New York",
            "country": "United States",
            "country_code": "US",
            "admin1": "New York",
            "latitude": 40.7128,
            "longitude": -74.006,
            "timezone": "America/New_York",
            "population": 18800000,
        },
        {
            "name": "Tokyo",
            "country": "Japan",
            "country_code": "JP",
            "admin1": "Tokyo",
            "latitude": 35.6762,
            "longitude": 139.6503,
            "timezone": "Asia/Tokyo",
            "population": 37000000,
        },
        {
            "name": "Sydney",
            "country": "Australia",
            "country_code": "AU",
            "admin1": "New South Wales",
            "latitude": -33.8688,
            "longitude": 151.2093,
            "timezone": "Australia/Sydney",
            "population": 5300000,
        },
    ]

    async def search_locations(
        self,
        query: str,
        *,
        limit: int = 10,
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        clean_query = str(query or "").strip()

        if len(clean_query) < 2:
            return []

        safe_limit = max(1, min(int(limit or 10), 25))

        try:
            results = await asyncio.to_thread(
                self._search_open_meteo,
                clean_query,
                safe_limit,
                language,
            )

            if results:
                return [item.to_dict() for item in results]

        except Exception:
            pass

        return [
            item.to_dict()
            for item in self._search_fallback(clean_query, safe_limit)
        ]

    def _search_open_meteo(
        self,
        query: str,
        limit: int,
        language: str,
    ) -> List[LocationSearchResult]:
        params = urllib.parse.urlencode(
            {
                "name": query,
                "count": limit,
                "language": language,
                "format": "json",
            }
        )

        url = f"{self.OPEN_METEO_GEOCODING_URL}?{params}"

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "A2A-Trip-Planner/1.0",
                "Accept": "application/json",
            },
        )

        with urllib.request.urlopen(request, timeout=8) as response:
            raw_body = response.read().decode("utf-8")

        payload = json.loads(raw_body)
        raw_results = payload.get("results") or []

        normalized: List[LocationSearchResult] = []

        for item in raw_results:
            location = self._normalize_open_meteo_result(item)

            if location:
                normalized.append(location)

        return normalized

    def _normalize_open_meteo_result(
        self,
        item: Dict[str, Any],
    ) -> Optional[LocationSearchResult]:
        name = str(item.get("name") or "").strip()
        country = str(item.get("country") or "").strip()
        country_code = str(item.get("country_code") or "").strip().upper()

        latitude = item.get("latitude")
        longitude = item.get("longitude")

        if not name or not country or not country_code:
            return None

        if latitude is None or longitude is None:
            return None

        admin1 = item.get("admin1")
        timezone = item.get("timezone")
        population = item.get("population")

        label_parts = [name]

        if admin1:
            label_parts.append(str(admin1))

        label_parts.append(country)

        location_id = str(item.get("id") or f"{name}-{country_code}").strip()

        return LocationSearchResult(
            id=location_id,
            name=name,
            label=", ".join(label_parts),
            country=country,
            country_code=country_code,
            admin1=str(admin1) if admin1 else None,
            latitude=float(latitude),
            longitude=float(longitude),
            timezone=str(timezone) if timezone else None,
            population=int(population) if population else None,
            continent=self._continent_for_country(country_code),
        )

    def _search_fallback(
        self,
        query: str,
        limit: int,
    ) -> List[LocationSearchResult]:
        query_key = query.strip().lower()
        matches: List[LocationSearchResult] = []

        for item in self.FALLBACK_LOCATIONS:
            name = item["name"]
            country = item["country"]
            admin1 = item.get("admin1")

            haystack = " ".join(
                [
                    str(name),
                    str(country),
                    str(admin1 or ""),
                    str(item["country_code"]),
                ]
            ).lower()

            if query_key not in haystack:
                continue

            label_parts = [name]

            if admin1:
                label_parts.append(str(admin1))

            label_parts.append(country)

            country_code = str(item["country_code"]).upper()

            matches.append(
                LocationSearchResult(
                    id=f"fallback-{name.lower().replace(' ', '-')}-{country_code}",
                    name=name,
                    label=", ".join(label_parts),
                    country=country,
                    country_code=country_code,
                    admin1=admin1,
                    latitude=float(item["latitude"]),
                    longitude=float(item["longitude"]),
                    timezone=item.get("timezone"),
                    population=item.get("population"),
                    continent=self._continent_for_country(country_code),
                    source="fallback_city_index",
                )
            )

        return matches[:limit]

    def _continent_for_country(self, country_code: str) -> str:
        return self.COUNTRY_CONTINENT_MAP.get(
            str(country_code or "").upper(),
            "Unknown",
        )