from __future__ import annotations

from typing import Any, Dict

from fastapi.testclient import TestClient

from app.api.server import api
from app.services.wikimedia_places_provider import WikimediaPlacesProvider


client = TestClient(api)


def test_unknown_destination_hotels_do_not_create_fake_brand_names() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Hotels",
            "source_city": "Kolkata",
            "destination_city": "Afghanistan",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["provider"] == "backend_catalog"
    assert body["category"] == "Hotels"
    assert body["destination_city"] == "Afghanistan"
    assert body["availability"] == "available"
    assert body["count"] == 10

    names = [item["name"] for item in body["data"]]

    assert "The Grand Afghanistan" not in names
    assert "Royal Orchid Afghanistan" not in names
    assert "Radisson Blu Afghanistan" not in names
    assert "Novotel Afghanistan" not in names

    assert names[0] == "Best hotels in Afghanistan"
    assert all("Afghanistan" in name for name in names)
    assert all(item["action"] == "Search Hotels" for item in body["data"])
    assert all("No fake property" in item["highlights"] for item in body["data"])


def test_curated_destination_hotels_still_show_real_curated_names() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Hotels",
            "source_city": "Kolkata",
            "destination_city": "Goa",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["provider"] == "backend_catalog"
    assert body["category"] == "Hotels"
    assert body["destination_city"] == "Goa"
    assert body["availability"] == "available"
    assert body["count"] == 10

    names = [item["name"] for item in body["data"]]

    assert "Taj Exotica Resort & Spa Goa" in names
    assert "The Leela Goa" in names
    assert "W Goa" in names
    assert all(item["action"] == "View Hotel" for item in body["data"])
    assert all("Curated property" in item["highlights"] for item in body["data"])


def test_international_bus_route_is_unavailable() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Buses",
            "source_city": "Kolkata",
            "destination_city": "Maldives",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["category"] == "Buses"
    assert body["availability"] == "unavailable"
    assert body["suggested_category"] == "Flights"
    assert body["count"] == 0
    assert body["data"] == []
    assert "Use flights" in body["message"]


def test_international_train_route_is_unavailable() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Trains",
            "source_city": "Kolkata",
            "destination_city": "Maldives",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["category"] == "Trains"
    assert body["availability"] == "unavailable"
    assert body["suggested_category"] == "Flights"
    assert body["count"] == 0
    assert body["data"] == []


def test_international_cab_route_is_unavailable() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Cabs",
            "source_city": "Kolkata",
            "destination_city": "Maldives",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["category"] == "Cabs"
    assert body["availability"] == "unavailable"
    assert body["suggested_category"] == "Flights"
    assert body["count"] == 0
    assert body["data"] == []


def test_international_flights_are_available() -> None:
    response = client.get(
        "/api/catalog",
        params={
            "category": "Flights",
            "source_city": "Kolkata",
            "destination_city": "Maldives",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["provider"] == "backend_catalog"
    assert body["category"] == "Flights"
    assert body["availability"] == "available"
    assert body["count"] == 10

    assert all("Kolkata to Maldives" in item["name"] for item in body["data"])
    assert all(item["action"] == "Check Flights" for item in body["data"])


def test_tours_use_wikimedia_when_real_places_are_available(monkeypatch) -> None:
    async def fake_search_tours(
        self: WikimediaPlacesProvider,
        *,
        destination_city: str,
        limit: int = 10,
    ) -> Dict[str, Any]:
        return {
            "success": True,
            "provider": "wikimedia",
            "category": "Tours",
            "destination_city": destination_city,
            "count": 2,
            "message": f"Real Wikipedia/Wikimedia places found for {destination_city}.",
            "data": [
                {
                    "id": "wiki-1",
                    "name": "Band-e Amir National Park",
                    "location": destination_city,
                    "rating": "Real place",
                    "price": "See details",
                    "image": "https://upload.wikimedia.org/example-one.jpg",
                    "summary": "A real attraction returned from Wikimedia.",
                    "highlights": [
                        "Real place",
                        "Wikipedia sourced",
                        "Real image",
                    ],
                    "action": "Read Guide",
                    "url": "https://en.wikipedia.org/wiki/Band-e_Amir_National_Park",
                    "source": "Wikimedia",
                },
                {
                    "id": "wiki-2",
                    "name": "Minaret of Jam",
                    "location": destination_city,
                    "rating": "Real place",
                    "price": "See details",
                    "image": "https://upload.wikimedia.org/example-two.jpg",
                    "summary": "Another real attraction returned from Wikimedia.",
                    "highlights": [
                        "Real place",
                        "Wikipedia sourced",
                        "Real image",
                    ],
                    "action": "Read Guide",
                    "url": "https://en.wikipedia.org/wiki/Minaret_of_Jam",
                    "source": "Wikimedia",
                },
            ],
        }

    monkeypatch.setattr(
        WikimediaPlacesProvider,
        "search_tours",
        fake_search_tours,
    )

    response = client.get(
        "/api/catalog",
        params={
            "category": "Tours",
            "source_city": "Kolkata",
            "destination_city": "Afghanistan",
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["provider"] == "wikimedia"
    assert body["category"] == "Tours"
    assert body["destination_city"] == "Afghanistan"
    assert body["availability"] == "available"
    assert body["count"] == 2

    names = [item["name"] for item in body["data"]]

    assert "Band-e Amir National Park" in names
    assert "Minaret of Jam" in names
    assert "Afghanistan Food Walk" not in names
    assert all(item["source"] == "Wikimedia" for item in body["data"])