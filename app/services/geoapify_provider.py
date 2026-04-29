from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx


GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places"


class GeoapifyProvider:
    """
    Live hotel provider using Geoapify Places API.

    This keeps the API key in the backend only.

    Notes:
    - Geoapify gives reliable live place names, categories, addresses and maps.
    - Hotel photos are not guaranteed from Geoapify, so frontend may still use
      premium fallback hotel images when a provider image is unavailable.
    """

    def __init__(self) -> None:
        self.api_key = self._get_api_key()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def search_hotels(
        self,
        *,
        destination_city: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        clean_destination = destination_city.strip()

        if not clean_destination:
            return {
                "success": False,
                "provider": "geoapify",
                "message": "Destination city is required.",
                "data": [],
            }

        if not self.is_configured():
            return {
                "success": False,
                "provider": "geoapify",
                "message": "GEOAPIFY_API_KEY is not configured.",
                "data": [],
            }

        safe_limit = max(1, min(limit, 20))

        params = {
            "categories": "accommodation.hotel,accommodation.guest_house,accommodation.hostel",
            "filter": f"place:{clean_destination}",
            "limit": safe_limit,
            "apiKey": self.api_key,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(GEOAPIFY_PLACES_URL, params=params)

        if response.status_code >= 400:
            return {
                "success": False,
                "provider": "geoapify",
                "message": "Geoapify Places request failed.",
                "status_code": response.status_code,
                "error": self._safe_json(response),
                "data": [],
            }

        body = response.json()
        features = body.get("features", [])

        cards = [self._feature_to_hotel_card(feature) for feature in features]
        cards = [card for card in cards if card is not None]

        return {
            "success": True,
            "provider": "geoapify",
            "message": f"Live Geoapify hotels found for {clean_destination}.",
            "count": len(cards),
            "location": {
                "name": clean_destination,
            },
            "data": cards,
        }

    def _feature_to_hotel_card(
        self,
        feature: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        properties = feature.get("properties") or {}
        geometry = feature.get("geometry") or {}

        name = properties.get("name")

        if not name:
            return None

        coordinates = geometry.get("coordinates") or []
        longitude = coordinates[0] if len(coordinates) >= 2 else properties.get("lon")
        latitude = coordinates[1] if len(coordinates) >= 2 else properties.get("lat")

        address = self._build_address(properties)
        website = properties.get("website")
        categories = properties.get("categories") or []

        google_maps_url = self._build_google_maps_url(
            name=name,
            address=address,
            latitude=latitude,
            longitude=longitude,
        )

        return {
            "id": properties.get("place_id") or properties.get("osm_id") or name,
            "name": name,
            "location": address,
            "rating": "Live",
            "user_rating_count": None,
            "price_level": None,
            "image": self._extract_image(properties),
            "latitude": latitude,
            "longitude": longitude,
            "google_maps_url": google_maps_url,
            "website_url": website,
            "highlights": self._build_highlights(properties, categories),
            "source": "Geoapify",
        }

    def _build_address(self, properties: Dict[str, Any]) -> str:
        formatted = properties.get("formatted")

        if formatted:
            return formatted

        parts = [
            properties.get("address_line1"),
            properties.get("address_line2"),
            properties.get("city"),
            properties.get("state"),
            properties.get("country"),
        ]

        clean_parts = [part for part in parts if part]

        if clean_parts:
            return ", ".join(clean_parts)

        return "Address available on map"

    def _build_highlights(
        self,
        properties: Dict[str, Any],
        categories: List[str],
    ) -> List[str]:
        highlights: List[str] = []

        if "accommodation.hotel" in categories:
            highlights.append("Hotel")

        if "accommodation.guest_house" in categories:
            highlights.append("Guest house")

        if "accommodation.hostel" in categories:
            highlights.append("Hostel")

        if properties.get("website"):
            highlights.append("Website available")

        if properties.get("phone"):
            highlights.append("Contact available")

        if properties.get("opening_hours"):
            highlights.append("Hours listed")

        if not highlights:
            highlights.append("Live place result")

        return highlights[:3]

    def _extract_image(self, properties: Dict[str, Any]) -> Optional[str]:
        datasource = properties.get("datasource") or {}
        raw = datasource.get("raw") or {}

        image = raw.get("image")

        if image and isinstance(image, str) and image.startswith("http"):
            return image

        wikimedia_commons = raw.get("wikimedia_commons")

        if wikimedia_commons:
            filename = (
                wikimedia_commons.replace("File:", "")
                .strip()
                .replace(" ", "_")
            )
            return f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{filename}"

        return None

    def _build_google_maps_url(
        self,
        *,
        name: str,
        address: str,
        latitude: Any,
        longitude: Any,
    ) -> str:
        if latitude is not None and longitude is not None:
            return (
                "https://www.google.com/maps/search/?api=1&query="
                f"{latitude},{longitude}"
            )

        query = f"{name}, {address}".replace(" ", "+")
        return f"https://www.google.com/maps/search/?api=1&query={query}"

    def _get_api_key(self) -> str:
        existing_key = os.getenv("GEOAPIFY_API_KEY", "").strip()

        if existing_key:
            return self._clean_key(existing_key)

        project_root = Path(__file__).resolve().parents[2]
        env_path = project_root / ".env"

        if not env_path.exists():
            return ""

        for line in env_path.read_text(encoding="utf-8").splitlines():
            clean_line = line.strip()

            if not clean_line or clean_line.startswith("#"):
                continue

            if clean_line.startswith("GEOAPIFY_API_KEY="):
                raw_key = clean_line.split("=", 1)[1]
                return self._clean_key(raw_key)

        return ""

    def _clean_key(self, key: str) -> str:
        return key.strip().strip('"').strip("'").strip()

    def _safe_json(self, response: httpx.Response) -> Dict[str, Any]:
        try:
            return response.json()
        except Exception:
            return {"raw": response.text}