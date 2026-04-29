from __future__ import annotations

from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

import httpx


NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

USER_AGENT = "A2A-Trip-Planner/1.0 (student-project; local-development)"


class WikimediaPlacesProvider:
    """
    Free worldwide provider for real places / things to do.

    Flow:
    1. Geocode destination using Nominatim.
    2. Ask Wikipedia for nearby pages and search-based attraction pages.
    3. Return clean tour cards:
       - real place/article names
       - real Wikipedia image thumbnail when available
       - real article URL
       - destination-specific cards instead of fake generated cards

    No API key.
    No billing.
    No signup.
    """

    async def search_tours(
        self,
        *,
        destination_city: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        destination = self._normalize_destination(destination_city)
        safe_limit = max(1, min(int(limit or 10), 20))

        if not destination:
            return {
                "success": False,
                "provider": "wikimedia",
                "message": "Destination is required.",
                "count": 0,
                "data": [],
            }

        cards: List[Dict[str, Any]] = []

        location = await self._geocode_destination(destination)

        if location:
            nearby_cards = await self._search_nearby_pages(
                destination=destination,
                latitude=location["lat"],
                longitude=location["lon"],
                limit=safe_limit,
            )
            cards = self._merge_unique_cards(cards, nearby_cards, safe_limit)

        for query in self._build_search_queries(destination):
            if len(cards) >= safe_limit:
                break

            search_cards = await self._search_pages_by_query(
                destination=destination,
                query=query,
                limit=safe_limit,
            )

            cards = self._merge_unique_cards(cards, search_cards, safe_limit)

        cards = self._prefer_cards_with_images(cards, safe_limit)

        return {
            "success": True,
            "provider": "wikimedia",
            "category": "Tours",
            "destination_city": destination,
            "count": len(cards),
            "location": location,
            "message": (
                f"Real Wikipedia/Wikimedia places found for {destination}."
                if cards
                else f"No Wikimedia places found for {destination}."
            ),
            "data": cards,
        }

    async def _geocode_destination(
        self,
        destination: str,
    ) -> Optional[Dict[str, Any]]:
        params = {
            "q": destination,
            "format": "jsonv2",
            "limit": 1,
            "addressdetails": 1,
        }

        headers = {
            "User-Agent": USER_AGENT,
        }

        async with httpx.AsyncClient(timeout=18.0) as client:
            response = await client.get(
                NOMINATIM_SEARCH_URL,
                params=params,
                headers=headers,
            )

        if response.status_code >= 400:
            return None

        results = response.json()

        if not results:
            return None

        first = results[0]

        try:
            return {
                "name": first.get("display_name", destination),
                "lat": float(first["lat"]),
                "lon": float(first["lon"]),
            }
        except Exception:
            return None

    async def _search_nearby_pages(
        self,
        *,
        destination: str,
        latitude: float,
        longitude: float,
        limit: int,
    ) -> List[Dict[str, Any]]:
        params = {
            "action": "query",
            "generator": "geosearch",
            "prop": "coordinates|pageimages|extracts|info",
            "ggscoord": f"{latitude}|{longitude}",
            "ggsradius": 10000,
            "ggslimit": min(limit * 3, 50),
            "piprop": "thumbnail|original",
            "pithumbsize": 900,
            "exintro": 1,
            "explaintext": 1,
            "inprop": "url",
            "format": "json",
            "formatversion": 2,
            "origin": "*",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                WIKIPEDIA_API_URL,
                params=params,
                headers={"User-Agent": USER_AGENT},
            )

        if response.status_code >= 400:
            return []

        body = response.json()
        pages = body.get("query", {}).get("pages", [])

        return self._pages_to_tour_cards(
            pages=pages,
            destination=destination,
            source_label="Wikipedia nearby place",
            limit=limit,
        )

    async def _search_pages_by_query(
        self,
        *,
        destination: str,
        query: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        params = {
            "action": "query",
            "generator": "search",
            "prop": "pageimages|extracts|info",
            "gsrsearch": query,
            "gsrnamespace": 0,
            "gsrlimit": min(limit * 3, 50),
            "piprop": "thumbnail|original",
            "pithumbsize": 900,
            "exintro": 1,
            "explaintext": 1,
            "inprop": "url",
            "format": "json",
            "formatversion": 2,
            "origin": "*",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                WIKIPEDIA_API_URL,
                params=params,
                headers={"User-Agent": USER_AGENT},
            )

        if response.status_code >= 400:
            return []

        body = response.json()
        pages = body.get("query", {}).get("pages", [])

        return self._pages_to_tour_cards(
            pages=pages,
            destination=destination,
            source_label="Wikipedia attraction search",
            limit=limit,
        )

    def _pages_to_tour_cards(
        self,
        *,
        pages: List[Dict[str, Any]],
        destination: str,
        source_label: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        cards: List[Dict[str, Any]] = []

        sorted_pages = sorted(
            pages,
            key=lambda page: (
                0 if self._get_image(page) else 1,
                len(page.get("title", "")),
            ),
        )

        for page in sorted_pages:
            if len(cards) >= limit:
                break

            title = str(page.get("title") or "").strip()

            if not title:
                continue

            if self._should_skip_title(title=title, destination=destination):
                continue

            image = self._get_image(page)
            extract = self._clean_extract(page.get("extract"))

            card = {
                "id": f"wiki-{page.get('pageid')}",
                "name": title,
                "location": destination,
                "rating": "Real place",
                "price": "See details",
                "image": image or self._fallback_image(destination),
                "summary": extract,
                "highlights": self._build_highlights(
                    image=image,
                    extract=extract,
                    source_label=source_label,
                ),
                "action": "Read Guide",
                "url": page.get("fullurl")
                or f"https://en.wikipedia.org/wiki/{quote_plus(title.replace(' ', '_'))}",
                "source": "Wikimedia",
            }

            cards.append(card)

        return cards

    def _build_search_queries(self, destination: str) -> List[str]:
        destination_type = self._destination_type(destination)

        base_queries = [
            f"{destination} tourist attractions",
            f"{destination} landmarks",
            f"{destination} places to visit",
            f"tourism in {destination}",
        ]

        if destination_type == "island_beach":
            base_queries.extend(
                [
                    f"{destination} beaches",
                    f"{destination} islands",
                    f"{destination} diving snorkeling",
                    f"{destination} resorts lagoons",
                ]
            )

        elif destination_type == "mountain_nature":
            base_queries.extend(
                [
                    f"{destination} mountains",
                    f"{destination} national parks",
                    f"{destination} monasteries",
                    f"{destination} trekking",
                ]
            )

        elif destination_type == "heritage_culture":
            base_queries.extend(
                [
                    f"{destination} monuments",
                    f"{destination} museums",
                    f"{destination} heritage sites",
                    f"{destination} historic places",
                ]
            )

        elif destination_type == "urban_global":
            base_queries.extend(
                [
                    f"{destination} skyline",
                    f"{destination} museums",
                    f"{destination} parks",
                    f"{destination} shopping streets",
                ]
            )

        return base_queries

    def _build_highlights(
        self,
        *,
        image: Optional[str],
        extract: str,
        source_label: str,
    ) -> List[str]:
        highlights = ["Real place", "Wikipedia sourced"]

        if image:
            highlights.append("Real image")

        elif extract:
            highlights.append("Article available")

        else:
            highlights.append(source_label)

        return highlights[:3]

    def _merge_unique_cards(
        self,
        first: List[Dict[str, Any]],
        second: List[Dict[str, Any]],
        limit: int,
    ) -> List[Dict[str, Any]]:
        seen = set()
        merged: List[Dict[str, Any]] = []

        for card in [*first, *second]:
            title_key = str(card.get("name") or "").lower().strip()

            if not title_key:
                continue

            normalized_key = (
                title_key.replace("the ", "")
                .replace(" list of ", "")
                .replace("tourism in ", "")
                .strip()
            )

            if normalized_key in seen:
                continue

            seen.add(normalized_key)
            merged.append(card)

            if len(merged) >= limit:
                break

        return merged

    def _prefer_cards_with_images(
        self,
        cards: List[Dict[str, Any]],
        limit: int,
    ) -> List[Dict[str, Any]]:
        with_real_images = [
            card
            for card in cards
            if card.get("image")
            and "images.unsplash.com" not in str(card.get("image"))
        ]

        without_real_images = [
            card
            for card in cards
            if card not in with_real_images
        ]

        ordered = [*with_real_images, *without_real_images]

        return ordered[:limit]

    def _get_image(self, page: Dict[str, Any]) -> Optional[str]:
        thumbnail = page.get("thumbnail") or {}
        original = page.get("original") or {}

        image = thumbnail.get("source") or original.get("source")

        if image and isinstance(image, str) and image.startswith("http"):
            return image

        return None

    def _clean_extract(self, extract: Any) -> str:
        if not extract or not isinstance(extract, str):
            return ""

        clean = " ".join(extract.split())

        if len(clean) <= 180:
            return clean

        return clean[:177].rstrip() + "..."

    def _should_skip_title(self, *, title: str, destination: str) -> bool:
        lower_title = title.lower().strip()
        lower_destination = destination.lower().strip()

        blocked_starts = [
            "list of",
            "outline of",
            "index of",
            "bibliography of",
            "timeline of",
            "history of",
            "geography of",
            "economy of",
            "politics of",
            "demographics of",
        ]

        if any(lower_title.startswith(prefix) for prefix in blocked_starts):
            return True

        exact_blocked = {
            lower_destination,
            f"tourism in {lower_destination}",
            f"{lower_destination} tourism",
        }

        if lower_title in exact_blocked:
            return True

        blocked_contains = [
            "disambiguation",
            "category:",
            "template:",
            "portal:",
            "wikipedia:",
        ]

        if any(value in lower_title for value in blocked_contains):
            return True

        return False

    def _normalize_destination(self, destination: str) -> str:
        value = str(destination or "").strip()

        if not value:
            return ""

        lower = value.lower()

        aliases = {
            "bangalore": "Bengaluru",
            "bengaluru": "Bengaluru",
            "blr": "Bengaluru",
            "calcutta": "Kolkata",
            "kolkata": "Kolkata",
            "bombay": "Mumbai",
            "mumbai": "Mumbai",
            "new delhi": "Delhi",
            "delhi": "Delhi",
            "male": "Maldives",
            "malé": "Maldives",
            "maldives": "Maldives",
            "afghanistan": "Afghanistan",
            "goa": "Goa",
            "dubai": "Dubai",
            "singapore": "Singapore",
            "bali": "Bali",
            "phuket": "Phuket",
            "paris": "Paris",
            "london": "London",
            "tokyo": "Tokyo",
            "nepal": "Nepal",
            "bhutan": "Bhutan",
        }

        return aliases.get(lower, value.title())

    def _destination_type(self, destination: str) -> str:
        value = destination.strip()

        island_beach = {
            "Maldives",
            "Goa",
            "Bali",
            "Phuket",
            "Krabi",
            "Mauritius",
            "Seychelles",
        }

        mountain_nature = {
            "Nepal",
            "Kathmandu",
            "Bhutan",
            "Thimphu",
            "Afghanistan",
            "Switzerland",
            "Iceland",
        }

        heritage_culture = {
            "Delhi",
            "Kolkata",
            "Jaipur",
            "Agra",
            "Rome",
            "Paris",
            "London",
            "Istanbul",
            "Cairo",
            "Athens",
        }

        urban_global = {
            "Dubai",
            "Singapore",
            "Tokyo",
            "New York",
            "Los Angeles",
            "Sydney",
            "Melbourne",
        }

        if value in island_beach:
            return "island_beach"

        if value in mountain_nature:
            return "mountain_nature"

        if value in heritage_culture:
            return "heritage_culture"

        if value in urban_global:
            return "urban_global"

        return "global_travel"

    def _fallback_image(self, destination: str) -> str:
        destination_type = self._destination_type(destination)

        fallback_images = {
            "island_beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
            "mountain_nature": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=90",
            "heritage_culture": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
            "urban_global": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=90",
            "global_travel": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
        }

        return fallback_images[destination_type]