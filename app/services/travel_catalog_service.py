from __future__ import annotations

from typing import Any, Dict, List
from urllib.parse import quote_plus

from app.services.wikimedia_places_provider import WikimediaPlacesProvider


class TravelCatalogService:
    """
    Backend-powered travel catalog.

    Important design:
    - Tours use Wikimedia first for real worldwide places.
    - Hotels only use exact hotel names for curated known destinations.
    - Unknown/global hotel destinations show honest hotel-search/stay-area cards.
    - Trains/Buses/Cabs are unavailable for international routes.
    """

    INDIAN_CITIES = {
        "Agra",
        "Ahmedabad",
        "Bengaluru",
        "Bangalore",
        "Chennai",
        "Delhi",
        "Goa",
        "Hyderabad",
        "Jaipur",
        "Kochi",
        "Kolkata",
        "Mumbai",
        "New Delhi",
        "Pune",
        "Udaipur",
        "Varanasi",
    }

    COUNTRY_BY_DESTINATION = {
        "Agra": "India",
        "Ahmedabad": "India",
        "Bengaluru": "India",
        "Bangalore": "India",
        "Chennai": "India",
        "Delhi": "India",
        "Goa": "India",
        "Hyderabad": "India",
        "Jaipur": "India",
        "Kochi": "India",
        "Kolkata": "India",
        "Mumbai": "India",
        "New Delhi": "India",
        "Pune": "India",
        "Udaipur": "India",
        "Varanasi": "India",
        "Maldives": "Maldives",
        "Male": "Maldives",
        "Afghanistan": "Afghanistan",
        "Kabul": "Afghanistan",
        "Bali": "Indonesia",
        "Jakarta": "Indonesia",
        "Singapore": "Singapore",
        "Dubai": "United Arab Emirates",
        "Abu Dhabi": "United Arab Emirates",
        "Bangkok": "Thailand",
        "Phuket": "Thailand",
        "Krabi": "Thailand",
        "Paris": "France",
        "London": "United Kingdom",
        "Rome": "Italy",
        "Venice": "Italy",
        "Tokyo": "Japan",
        "Kyoto": "Japan",
        "New York": "United States",
        "Los Angeles": "United States",
        "Sydney": "Australia",
        "Melbourne": "Australia",
        "Mauritius": "Mauritius",
        "Seychelles": "Seychelles",
        "Nepal": "Nepal",
        "Kathmandu": "Nepal",
        "Bhutan": "Bhutan",
        "Thimphu": "Bhutan",
    }

    CURATED_HOTELS = {
        "Bengaluru": [
            "The Leela Palace Bengaluru",
            "The Oberoi Bengaluru",
            "Taj MG Road Bengaluru",
            "ITC Gardenia Bengaluru",
            "JW Marriott Hotel Bengaluru",
            "Conrad Bengaluru",
            "Sheraton Grand Bengaluru Whitefield",
            "Radisson Blu Atria Bengaluru",
            "Hyatt Centric MG Road Bengaluru",
            "Hilton Bengaluru Embassy Manyata",
        ],
        "Goa": [
            "Taj Exotica Resort & Spa Goa",
            "The Leela Goa",
            "W Goa",
            "Grand Hyatt Goa",
            "ITC Grand Goa",
            "Alila Diwa Goa",
            "Novotel Goa Resort & Spa",
            "Radisson Blu Resort Goa",
            "Cidade de Goa",
            "Hard Rock Hotel Goa",
        ],
        "Maldives": [
            "Soneva Jani Maldives",
            "Baros Maldives",
            "Conrad Maldives Rangali Island",
            "Anantara Veli Maldives Resort",
            "Taj Exotica Resort Maldives",
            "Hurawalhi Island Resort",
            "JOALI Maldives",
            "Velassaru Maldives",
            "Kandima Maldives",
            "Sun Siyam Iru Fushi",
        ],
        "Dubai": [
            "Atlantis The Palm Dubai",
            "Burj Al Arab Jumeirah",
            "Armani Hotel Dubai",
            "Jumeirah Beach Hotel",
            "Palace Downtown Dubai",
            "Address Sky View Dubai",
            "JW Marriott Marquis Dubai",
            "Rove Downtown Dubai",
            "Sofitel Dubai The Palm",
            "One&Only Royal Mirage Dubai",
        ],
        "Kolkata": [
            "The Oberoi Grand Kolkata",
            "Taj Bengal Kolkata",
            "ITC Royal Bengal Kolkata",
            "JW Marriott Hotel Kolkata",
            "The Westin Kolkata Rajarhat",
            "Hyatt Regency Kolkata",
            "Novotel Kolkata Hotel and Residences",
            "The Park Kolkata",
            "Fairfield by Marriott Kolkata",
            "Radisson Kolkata Ballygunge",
        ],
        "Mumbai": [
            "The Taj Mahal Palace Mumbai",
            "The Oberoi Mumbai",
            "Trident Nariman Point Mumbai",
            "JW Marriott Mumbai Juhu",
            "ITC Maratha Mumbai",
            "Sofitel Mumbai BKC",
            "The Leela Mumbai",
            "Grand Hyatt Mumbai",
            "Taj Lands End Mumbai",
            "St. Regis Mumbai",
        ],
        "Delhi": [
            "The Leela Palace New Delhi",
            "The Imperial New Delhi",
            "Taj Palace New Delhi",
            "ITC Maurya New Delhi",
            "The Oberoi New Delhi",
            "JW Marriott New Delhi Aerocity",
            "Roseate House New Delhi",
            "Hyatt Regency Delhi",
            "Shangri-La Eros New Delhi",
            "Pullman New Delhi Aerocity",
        ],
        "Jaipur": [
            "Rambagh Palace Jaipur",
            "Fairmont Jaipur",
            "ITC Rajputana Jaipur",
            "Jai Mahal Palace Jaipur",
            "Hilton Jaipur",
            "Trident Jaipur",
            "The Lalit Jaipur",
            "Hyatt Place Jaipur Malviya Nagar",
            "Radisson Blu Jaipur",
            "Holiday Inn Jaipur City Centre",
        ],
        "Paris": [
            "Le Bristol Paris",
            "The Ritz Paris",
            "Four Seasons Hotel George V Paris",
            "Hôtel Plaza Athénée Paris",
            "Shangri-La Paris",
            "Mandarin Oriental Paris",
            "Hotel Lutetia Paris",
            "The Hoxton Paris",
            "Pullman Paris Tour Eiffel",
            "Novotel Paris Centre Tour Eiffel",
        ],
        "London": [
            "The Savoy London",
            "The Ritz London",
            "Claridge's London",
            "The Langham London",
            "Shangri-La The Shard London",
            "The Connaught London",
            "Sea Containers London",
            "The Hoxton Shoreditch",
            "CitizenM Tower of London",
            "Park Plaza Westminster Bridge London",
        ],
        "Singapore": [
            "Marina Bay Sands Singapore",
            "Raffles Singapore",
            "The Fullerton Hotel Singapore",
            "Mandarin Oriental Singapore",
            "Pan Pacific Singapore",
            "PARKROYAL COLLECTION Pickering",
            "Andaz Singapore",
            "Hotel G Singapore",
            "Oasia Hotel Downtown Singapore",
            "Capri by Fraser Singapore",
        ],
        "Tokyo": [
            "Park Hotel Tokyo",
            "The Peninsula Tokyo",
            "Imperial Hotel Tokyo",
            "Shangri-La Tokyo",
            "The Tokyo Station Hotel",
            "Hotel New Otani Tokyo",
            "Mandarin Oriental Tokyo",
            "Cerulean Tower Tokyu Hotel",
            "Nohga Hotel Ueno Tokyo",
            "Hotel Metropolitan Tokyo Marunouchi",
        ],
    }

    async def get_catalog_async(
        self,
        *,
        category: str,
        source_city: str,
        destination_city: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        clean_category = self._normalize_category(category)
        source = self._normalize_city(source_city)
        destination = self._normalize_city(destination_city)
        safe_limit = max(1, min(int(limit or 10), 20))

        if self._is_transport_unavailable(
            category=clean_category,
            source=source,
            destination=destination,
        ):
            return self._unavailable_response(
                category=clean_category,
                source=source,
                destination=destination,
            )

        if clean_category == "Tours":
            wikimedia_result = await WikimediaPlacesProvider().search_tours(
                destination_city=destination,
                limit=safe_limit,
            )

            wikimedia_cards = wikimedia_result.get("data") or []

            if wikimedia_result.get("success") and wikimedia_cards:
                return {
                    "success": True,
                    "provider": "wikimedia",
                    "category": "Tours",
                    "source_city": source,
                    "destination_city": destination,
                    "availability": "available",
                    "count": len(wikimedia_cards[:safe_limit]),
                    "message": f"Real places and things to do found for {destination}.",
                    "data": wikimedia_cards[:safe_limit],
                }

        return self.get_catalog(
            category=clean_category,
            source_city=source,
            destination_city=destination,
            limit=safe_limit,
        )

    def get_catalog(
        self,
        *,
        category: str,
        source_city: str,
        destination_city: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        clean_category = self._normalize_category(category)
        source = self._normalize_city(source_city)
        destination = self._normalize_city(destination_city)
        safe_limit = max(1, min(int(limit or 10), 20))

        if self._is_transport_unavailable(
            category=clean_category,
            source=source,
            destination=destination,
        ):
            return self._unavailable_response(
                category=clean_category,
                source=source,
                destination=destination,
            )

        builders = {
            "Flights": self._build_flights,
            "Hotels": self._build_hotels,
            "Homes": self._build_homes,
            "Packages": self._build_packages,
            "Trains": self._build_trains,
            "Buses": self._build_buses,
            "Cabs": self._build_cabs,
            "Tours": self._build_tours,
            "Insurance": self._build_insurance,
        }

        builder = builders.get(clean_category, self._build_hotels)
        items = builder(source=source, destination=destination)

        return {
            "success": True,
            "provider": "backend_catalog",
            "category": clean_category,
            "source_city": source,
            "destination_city": destination,
            "availability": "available",
            "count": min(len(items), safe_limit),
            "message": self._build_message(
                category=clean_category,
                source=source,
                destination=destination,
            ),
            "data": items[:safe_limit],
        }

    def _unavailable_response(
        self,
        *,
        category: str,
        source: str,
        destination: str,
    ) -> Dict[str, Any]:
        return {
            "success": True,
            "provider": "backend_catalog",
            "category": category,
            "source_city": source,
            "destination_city": destination,
            "availability": "unavailable",
            "suggested_category": "Flights",
            "count": 0,
            "message": (
                f"No practical {category.lower()} routes are available "
                f"from {source} to {destination}. Use flights for this international trip."
            ),
            "data": [],
        }

    def _normalize_category(self, category: str) -> str:
        value = str(category or "Hotels").strip().lower()

        category_map = {
            "flight": "Flights",
            "flights": "Flights",
            "hotel": "Hotels",
            "hotels": "Hotels",
            "home": "Homes",
            "homes": "Homes",
            "package": "Packages",
            "packages": "Packages",
            "train": "Trains",
            "trains": "Trains",
            "bus": "Buses",
            "buses": "Buses",
            "cab": "Cabs",
            "cabs": "Cabs",
            "tour": "Tours",
            "tours": "Tours",
            "insurance": "Insurance",
        }

        return category_map.get(value, "Hotels")

    def _normalize_city(self, city: str) -> str:
        value = str(city or "").strip()

        if not value:
            return "Bengaluru"

        lower = value.lower()

        city_aliases = {
            "bangalore": "Bengaluru",
            "bengaluru": "Bengaluru",
            "blr": "Bengaluru",
            "calcutta": "Kolkata",
            "kolkata": "Kolkata",
            "bombay": "Mumbai",
            "mumbai": "Mumbai",
            "new delhi": "Delhi",
            "delhi": "Delhi",
            "goa": "Goa",
            "maldives": "Maldives",
            "male": "Maldives",
            "malé": "Maldives",
            "afghanistan": "Afghanistan",
            "kabul": "Kabul",
            "bali": "Bali",
            "dubai": "Dubai",
            "singapore": "Singapore",
            "bangkok": "Bangkok",
            "phuket": "Phuket",
            "krabi": "Krabi",
            "paris": "Paris",
            "london": "London",
            "rome": "Rome",
            "venice": "Venice",
            "tokyo": "Tokyo",
            "kyoto": "Kyoto",
            "new york": "New York",
            "los angeles": "Los Angeles",
            "sydney": "Sydney",
            "melbourne": "Melbourne",
            "mauritius": "Mauritius",
            "seychelles": "Seychelles",
            "nepal": "Nepal",
            "kathmandu": "Kathmandu",
            "bhutan": "Bhutan",
            "thimphu": "Thimphu",
            "switzerland": "Switzerland",
            "iceland": "Iceland",
            "egypt": "Egypt",
            "cairo": "Cairo",
            "turkey": "Turkey",
            "istanbul": "Istanbul",
            "greece": "Greece",
            "athens": "Athens",
        }

        return city_aliases.get(lower, value.title())

    def _get_country(self, city: str) -> str:
        if city in self.COUNTRY_BY_DESTINATION:
            return self.COUNTRY_BY_DESTINATION[city]

        if city in self.INDIAN_CITIES:
            return "India"

        return "International"

    def _is_international_trip(self, *, source: str, destination: str) -> bool:
        return self._get_country(source) != self._get_country(destination)

    def _is_transport_unavailable(
        self,
        *,
        category: str,
        source: str,
        destination: str,
    ) -> bool:
        if category not in {"Trains", "Buses", "Cabs"}:
            return False

        return self._is_international_trip(source=source, destination=destination)

    def _build_message(self, *, category: str, source: str, destination: str) -> str:
        if category in {"Hotels", "Homes", "Tours"}:
            return f"{category} catalog generated for {destination}."

        return f"{category} catalog generated for {source} to {destination}."

    def _google_maps_search(self, query: str) -> str:
        return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"

    def _google_search(self, query: str) -> str:
        return f"https://www.google.com/search?q={quote_plus(query)}"

    def _google_maps_route(self, source: str, destination: str) -> str:
        return f"https://www.google.com/maps/dir/{quote_plus(source)}/{quote_plus(destination)}"

    def _destination_type(self, destination: str) -> str:
        island_beach = {
            "Maldives",
            "Male",
            "Bali",
            "Phuket",
            "Krabi",
            "Goa",
            "Mauritius",
            "Seychelles",
        }

        desert_luxury = {"Dubai", "Abu Dhabi"}
        europe_culture = {"Paris", "London", "Rome", "Venice", "Athens", "Istanbul"}
        japan_culture = {"Tokyo", "Kyoto"}
        urban_global = {"Singapore", "New York", "Los Angeles", "Sydney", "Melbourne"}
        mountain_nature = {
            "Nepal",
            "Kathmandu",
            "Bhutan",
            "Thimphu",
            "Afghanistan",
            "Kabul",
            "Switzerland",
            "Iceland",
        }
        heritage_culture = {
            "Delhi",
            "Kolkata",
            "Jaipur",
            "Agra",
            "Egypt",
            "Cairo",
            "Turkey",
        }

        if destination in island_beach:
            return "island_beach"

        if destination in desert_luxury:
            return "desert_luxury"

        if destination in europe_culture:
            return "europe_culture"

        if destination in japan_culture:
            return "japan_culture"

        if destination in urban_global:
            return "urban_global"

        if destination in mountain_nature:
            return "mountain_nature"

        if destination in heritage_culture:
            return "heritage_culture"

        return "global_travel"

    def _destination_images(self, destination: str) -> List[str]:
        destination_type = self._destination_type(destination)

        image_sets = {
            "island_beach": [
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1400&q=90",
            ],
            "desert_luxury": [
                "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1526495124232-a04e1849168c?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90",
            ],
            "europe_culture": [
                "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1529154036614-a60975f5c760?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1473959383416-33a87f4a5e7a?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90",
            ],
            "japan_culture": [
                "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90",
            ],
            "urban_global": [
                "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=90",
            ],
            "mountain_nature": [
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=90",
            ],
            "heritage_culture": [
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=90",
            ],
            "global_travel": [
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=90",
            ],
        }

        return image_sets[destination_type]

    def _standard_hotel_images(self) -> List[str]:
        return [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=90",
        ]

    def _hotel_images(self, destination: str, has_curated_hotels: bool) -> List[str]:
        if not has_curated_hotels:
            return self._destination_images(destination)

        destination_type = self._destination_type(destination)

        if destination_type in {
            "island_beach",
            "desert_luxury",
            "mountain_nature",
            "heritage_culture",
        }:
            return self._destination_images(destination)

        return self._standard_hotel_images()

    def _home_images(self, destination: str) -> List[str]:
        destination_type = self._destination_type(destination)

        if destination_type in {
            "island_beach",
            "mountain_nature",
            "desert_luxury",
            "heritage_culture",
        }:
            return self._destination_images(destination)

        return [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1400&q=90",
        ]

    def _transport_images(self) -> Dict[str, List[str]]:
        return {
            "Flights": [
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1400&q=90",
            ],
            "Trains": [
                "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1527295110-5145f6b148d0?auto=format&fit=crop&w=1400&q=90",
            ],
            "Buses": [
                "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=1400&q=90",
            ],
            "Cabs": [
                "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1400&q=90",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
            ],
        }

    def _build_hotels(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        curated_hotels = self.CURATED_HOTELS.get(destination)

        if curated_hotels:
            return self._build_curated_hotels(destination=destination, names=curated_hotels)

        return self._build_hotel_search_cards(destination=destination)

    def _build_curated_hotels(
        self,
        *,
        destination: str,
        names: List[str],
    ) -> List[Dict[str, Any]]:
        images = self._hotel_images(destination, has_curated_hotels=True)

        return [
            {
                "id": f"hotel-{destination.lower()}-{index + 1}",
                "name": name,
                "location": destination,
                "rating": round(4.2 + (index % 6) * 0.1, 1),
                "price": f"₹{(4200 + index * 850):,} / night",
                "image": images[index % len(images)],
                "highlights": [
                    "Curated property",
                    "Destination stay",
                    "Map search available",
                ],
                "action": "View Hotel",
                "url": self._google_maps_search(f"{name} {destination}"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_hotel_search_cards(self, *, destination: str) -> List[Dict[str, Any]]:
        images = self._hotel_images(destination, has_curated_hotels=False)

        search_cards = [
            {
                "name": f"Best hotels in {destination}",
                "query": f"best hotels in {destination}",
                "note": "Live hotel search",
            },
            {
                "name": f"Top-rated stays in {destination}",
                "query": f"top rated hotels in {destination}",
                "note": "Review-based search",
            },
            {
                "name": f"Budget hotels in {destination}",
                "query": f"budget hotels in {destination}",
                "note": "Budget stay search",
            },
            {
                "name": f"Luxury hotels in {destination}",
                "query": f"luxury hotels in {destination}",
                "note": "Premium stay search",
            },
            {
                "name": f"Family-friendly hotels in {destination}",
                "query": f"family friendly hotels in {destination}",
                "note": "Family stay search",
            },
            {
                "name": f"Central stay areas in {destination}",
                "query": f"central hotels in {destination}",
                "note": "Location search",
            },
            {
                "name": f"Guesthouses in {destination}",
                "query": f"guesthouses in {destination}",
                "note": "Local stay search",
            },
            {
                "name": f"Business hotels in {destination}",
                "query": f"business hotels in {destination}",
                "note": "Business stay search",
            },
            {
                "name": f"Resorts and retreats in {destination}",
                "query": f"resorts retreats in {destination}",
                "note": "Relaxed stay search",
            },
            {
                "name": f"Hotels near attractions in {destination}",
                "query": f"hotels near tourist attractions in {destination}",
                "note": "Attraction-side search",
            },
        ]

        return [
            {
                "id": f"hotel-search-{destination.lower()}-{index + 1}",
                "name": card["name"],
                "location": destination,
                "rating": "Search",
                "price": "Check live rates",
                "image": images[index % len(images)],
                "highlights": [
                    "Real search link",
                    "No fake property",
                    card["note"],
                ],
                "action": "Search Hotels",
                "url": self._google_maps_search(card["query"]),
                "source": "Backend Catalog",
            }
            for index, card in enumerate(search_cards)
        ]

    def _build_homes(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._home_images(destination)
        destination_type = self._destination_type(destination)

        if destination_type == "island_beach":
            names = [
                "Private Beach Villa",
                "Lagoon View Stay",
                "Oceanfront Residence",
                "Water Villa Retreat",
                "Island Homestay",
                "Beachside Family Stay",
                "Sunset Villa",
                "Coral View Cottage",
                "Palm Garden Stay",
                "Luxury Island Residence",
            ]
        elif destination_type == "mountain_nature":
            names = [
                "Mountain View Stay",
                "Scenic Guesthouse",
                "Heritage Homestay",
                "Valley View Lodge",
                "Cultural Family Stay",
                "Quiet Hillside Home",
                "Nature Retreat",
                "Traditional Guest Stay",
                "Local Neighborhood Stay",
                "Calm View Residence",
            ]
        else:
            names = [
                "Skyline Serviced Apartment",
                "Garden View Homestay",
                "Premium City Villa",
                "Executive Studio Stay",
                "Family Comfort Apartment",
                "Urban Nest Residence",
                "Terrace House Stay",
                "Long Stay Business Home",
                "Boutique Private Villa",
                "Calm Corner Homestay",
            ]

        return [
            {
                "id": f"home-{destination.lower()}-{index + 1}",
                "name": f"{name}, {destination}",
                "location": destination,
                "rating": round(4.1 + (index % 7) * 0.1, 1),
                "price": "Check live rates" if destination not in self.CURATED_HOTELS else f"₹{(3200 + index * 700):,} / night",
                "image": images[index % len(images)],
                "highlights": [
                    "Destination based",
                    "Stay search",
                    "Map search available",
                ],
                "action": "Search Stay",
                "url": self._google_maps_search(f"{destination} {name} stay"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_flights(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._transport_images()["Flights"]
        route = f"{source} to {destination}"

        names = [
            "Morning Saver",
            "Evening Direct",
            "Business Flex",
            "Weekend Fare",
            "Premium Comfort",
            "Early Bird",
            "Smart Economy",
            "Fastest Route",
            "Flexible Return",
            "Value Fare",
        ]

        return [
            {
                "id": f"flight-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{route} {name}",
                "location": route,
                "rating": "Direct" if index % 2 == 0 else "Flexible",
                "price": f"From ₹{(5400 + index * 900):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Exact route",
                    "Flight option",
                    "Trip ready",
                ],
                "action": "Check Flights",
                "url": f"https://www.google.com/travel/flights?q={quote_plus(route)}",
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_trains(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._transport_images()["Trains"]
        route = f"{source} to {destination}"

        names = [
            "Express Route",
            "Overnight Rail",
            "AC Chair Car",
            "Sleeper Option",
            "Premium Rail",
            "Budget Rail",
            "Fast Connection",
            "Flexible Timing",
            "City Station Route",
            "Return Friendly",
        ]

        return [
            {
                "id": f"train-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{route} {name}",
                "location": route,
                "rating": "Rail route" if index % 2 == 0 else "Budget",
                "price": f"From ₹{(650 + index * 220):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Exact route",
                    "Station transfer",
                    "Rail-friendly plan",
                ],
                "action": "Check Trains",
                "url": self._google_search(f"{route} train schedule booking"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_buses(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._transport_images()["Buses"]
        route = f"{source} to {destination}"

        names = [
            "Volvo Sleeper",
            "AC Seater",
            "Premium Sleeper",
            "Night Coach",
            "Budget Bus",
            "Semi Sleeper",
            "Weekend Coach",
            "Flexible Boarding",
            "Business Class Bus",
            "Value Bus",
        ]

        return [
            {
                "id": f"bus-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{route} {name}",
                "location": route,
                "rating": "Sleeper" if index % 2 == 0 else "Value",
                "price": f"From ₹{(900 + index * 260):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Exact route",
                    "Road travel",
                    "Boarding options",
                ],
                "action": "Check Buses",
                "url": self._google_search(f"{route} bus tickets"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_cabs(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._transport_images()["Cabs"]
        route = f"{source} to {destination}"

        names = [
            "Private Sedan",
            "SUV Road Trip",
            "Premium Cab",
            "Family Cab",
            "Airport Transfer",
            "One-way Cab",
            "Round Trip Cab",
            "Driver Included",
            "Comfort Ride",
            "Flexible Stops",
        ]

        return [
            {
                "id": f"cab-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{route} {name}",
                "location": route,
                "rating": "Private" if index % 2 == 0 else "Flexible",
                "price": f"From ₹{(5200 + index * 850):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Exact route",
                    "Door pickup",
                    "Private travel",
                ],
                "action": "View Route",
                "url": self._google_maps_route(source, destination),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _tour_names(self, destination: str) -> List[str]:
        destination_type = self._destination_type(destination)

        exact_tours = {
            "Maldives": [
                "Maldives Island Hopping Tour",
                "Maldives Sunset Cruise",
                "Maldives Snorkeling Experience",
                "Maldives Dolphin Watching Trip",
                "Maldives Sandbank Picnic",
                "Maldives Overwater Villa Experience",
                "Maldives Coral Reef Discovery",
                "Maldives Local Island Walk",
                "Maldives Spa and Lagoon Day",
                "Maldives Romantic Dinner Cruise",
            ],
            "Goa": [
                "Baga Beach Sunset Tour",
                "Fort Aguada Heritage Walk",
                "Old Goa Churches Trail",
                "Dudhsagar Falls Day Trip",
                "Panjim Latin Quarter Walk",
                "Goa Spice Plantation Tour",
                "Anjuna Flea Market Walk",
                "Candolim Beach Evening Experience",
                "Goan Food and Culture Trail",
                "South Goa Coastal Tour",
            ],
            "Dubai": [
                "Burj Khalifa Skyline Visit",
                "Dubai Marina Evening Walk",
                "Desert Safari Experience",
                "Dubai Mall and Fountain Show",
                "Old Dubai Creek Tour",
                "Palm Jumeirah Photo Route",
                "Jumeirah Beach Experience",
                "Gold Souk Market Walk",
                "Museum of the Future Visit",
                "Premium City Night Tour",
            ],
        }

        if destination in exact_tours:
            return exact_tours[destination]

        if destination_type == "island_beach":
            return [
                f"{destination} Island Hopping Tour",
                f"{destination} Sunset Cruise",
                f"{destination} Snorkeling Experience",
                f"{destination} Beach Club Day",
                f"{destination} Local Island Walk",
                f"{destination} Water Sports Experience",
                f"{destination} Lagoon Photo Route",
                f"{destination} Seafood Trail",
                f"{destination} Spa and Resort Day",
                f"{destination} Romantic Beach Dinner",
            ]

        if destination_type == "mountain_nature":
            return [
                f"{destination} Mountain View Trail",
                f"{destination} Heritage Walk",
                f"{destination} Local Market Tour",
                f"{destination} Scenic Viewpoint Trip",
                f"{destination} Cultural Village Walk",
                f"{destination} Nature Photography Route",
                f"{destination} Food and Tea Trail",
                f"{destination} Historic Circuit",
                f"{destination} Scenic Day Trip",
                f"{destination} Calm Retreat Experience",
            ]

        return [
            f"{destination} City Highlights Tour",
            f"{destination} Food Walk",
            f"{destination} Heritage Circuit",
            f"{destination} Evening Experience",
            f"{destination} Local Market Walk",
            f"{destination} Nature Trail",
            f"{destination} Photography Route",
            f"{destination} Cultural Tour",
            f"{destination} Family Activity",
            f"{destination} Premium Day Tour",
        ]

    def _build_tours(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._destination_images(destination)
        names = self._tour_names(destination)

        return [
            {
                "id": f"tour-{destination.lower()}-{index + 1}",
                "name": name,
                "location": destination,
                "rating": round(4.3 + (index % 6) * 0.1, 1),
                "price": f"₹{(900 + index * 350):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Destination activity",
                    "Local experience",
                    "Itinerary friendly",
                ],
                "action": "View Tour",
                "url": self._google_search(f"{name} {destination}"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_packages(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        images = self._destination_images(destination)
        route = f"{source} to {destination}"

        names = [
            "Weekend City Break",
            "Premium Stay Package",
            "Food and Culture Package",
            "Family Holiday Bundle",
            "Workation Package",
            "Luxury Escape",
            "Budget Smart Package",
            "Adventure Add-on Package",
            "Couple Friendly Package",
            "All-in-One Holiday",
        ]

        return [
            {
                "id": f"package-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{destination} {name}",
                "location": route,
                "rating": "Best value" if index % 2 == 0 else "Popular",
                "price": f"From ₹{(18500 + index * 4200):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Destination package",
                    "Route based",
                    "Activities included",
                ],
                "action": "Explore Package",
                "url": self._google_search(f"{route} {destination} holiday package"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]

    def _build_insurance(self, *, source: str, destination: str) -> List[Dict[str, Any]]:
        route = f"{source} to {destination}"

        images = [
            "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=90",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
        ]

        names = [
            "Domestic Travel Shield",
            "Trip Delay Cover",
            "Medical Emergency Cover",
            "Lost Baggage Cover",
            "Family Travel Cover",
            "Premium Trip Protection",
            "Budget Safety Cover",
            "Weather Risk Cover",
            "Cancellation Protection",
            "Emergency Support Plan",
        ]

        return [
            {
                "id": f"insurance-{source.lower()}-{destination.lower()}-{index + 1}",
                "name": f"{name} for {destination}",
                "location": route,
                "rating": "Essential" if index % 2 == 0 else "Premium",
                "price": f"From ₹{(399 + index * 180):,}",
                "image": images[index % len(images)],
                "highlights": [
                    "Trip safety",
                    "Route based",
                    "Travel support",
                ],
                "action": "Explore Cover",
                "url": self._google_search(f"{destination} travel insurance {route}"),
                "source": "Backend Catalog",
            }
            for index, name in enumerate(names)
        ]