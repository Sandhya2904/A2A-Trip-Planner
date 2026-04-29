from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.server import api


client = TestClient(api)


def test_health_endpoint_returns_healthy_status() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "a2a-trip-planner-api"
    assert data["version"] == "1.0.0"


def test_agents_endpoint_returns_registered_agents() -> None:
    response = client.get("/api/agents")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 7

    roles = {agent["role"] for agent in data}

    assert "orchestrator" in roles
    assert "flight_agent" in roles
    assert "hotel_agent" in roles
    assert "weather_agent" in roles
    assert "activity_agent" in roles
    assert "pricing_agent" in roles
    assert "itinerary_agent" in roles


def test_sample_request_endpoint_returns_valid_sample() -> None:
    response = client.get("/api/sample-request")

    assert response.status_code == 200

    data = response.json()

    assert data["source_city"] == "Delhi"
    assert data["destination_city"] == "Bengaluru"
    assert data["currency"] == "INR"
    assert data["travel_style"] == "balanced"


def test_plan_trip_endpoint_returns_success_response_and_saves_plan() -> None:
    payload = {
        "source_city": "Delhi",
        "destination_city": "Bengaluru",
        "start_date": "2026-05-19",
        "end_date": "2026-05-23",
        "budget": 35000,
        "currency": "INR",
        "travelers": 1,
        "interests": ["culture", "local food"],
        "travel_style": "balanced",
    }

    response = client.post("/api/plan-trip", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["message"] == "Trip plan generated successfully."

    data = body["data"]

    assert data["plan_id"]
    assert data["saved_at"]
    assert data["storage_path"]
    assert data["conversation_id"]
    assert data["summary"]
    assert "final_trip_plan" in data
    assert "agent_outputs" in data
    assert "orchestration_logs" in data

    final_plan = data["final_trip_plan"]

    assert final_plan["request"]["source_city"] == "Delhi"
    assert final_plan["request"]["destination_city"] == "Bengaluru"
    assert final_plan["selected_flight"] is not None
    assert final_plan["selected_hotel"] is not None
    assert len(final_plan["itinerary"]) == 5


def test_saved_trip_plan_can_be_retrieved_by_plan_id() -> None:
    payload = {
        "source_city": "Mumbai",
        "destination_city": "Goa",
        "start_date": "2026-07-01",
        "end_date": "2026-07-04",
        "budget": 45000,
        "currency": "INR",
        "travelers": 2,
        "interests": ["beaches", "local food"],
        "travel_style": "balanced",
    }

    create_response = client.post("/api/plan-trip", json=payload)

    assert create_response.status_code == 200

    created_body = create_response.json()
    plan_id = created_body["data"]["plan_id"]

    get_response = client.get(f"/api/trip-plans/{plan_id}")

    assert get_response.status_code == 200

    body = get_response.json()

    assert body["success"] is True
    assert body["message"] == "Saved trip plan retrieved successfully."

    saved_plan = body["data"]

    assert saved_plan["plan_id"] == plan_id
    assert saved_plan["final_trip_plan"]["request"]["source_city"] == "Mumbai"
    assert saved_plan["final_trip_plan"]["request"]["destination_city"] == "Goa"


def test_saved_trip_plans_can_be_listed() -> None:
    response = client.get("/api/trip-plans")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["message"] == "Saved trip plans retrieved successfully."
    assert isinstance(body["count"], int)
    assert isinstance(body["data"], list)

    if body["data"]:
        first_plan = body["data"][0]

        assert "plan_id" in first_plan
        assert "saved_at" in first_plan
        assert "source_city" in first_plan
        assert "destination_city" in first_plan
        assert "start_date" in first_plan
        assert "end_date" in first_plan
        assert "currency" in first_plan


def test_saved_trip_plans_limit_filter_works() -> None:
    response = client.get("/api/trip-plans?limit=1")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["count"] <= 1
    assert len(body["data"]) <= 1


def test_saved_trip_plans_destination_city_filter_works() -> None:
    payload = {
        "source_city": "Kolkata",
        "destination_city": "Goa",
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "budget": 60000,
        "currency": "INR",
        "travelers": 2,
        "interests": ["beaches", "local food"],
        "travel_style": "balanced",
    }

    create_response = client.post("/api/plan-trip", json=payload)

    assert create_response.status_code == 200

    response = client.get("/api/trip-plans?destination_city=Goa")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["count"] >= 1

    for saved_plan in body["data"]:
        assert saved_plan["destination_city"] == "Goa"


def test_saved_trip_plans_source_city_filter_works() -> None:
    payload = {
        "source_city": "Pune",
        "destination_city": "Dubai",
        "start_date": "2026-10-01",
        "end_date": "2026-10-05",
        "budget": 150000,
        "currency": "INR",
        "travelers": 2,
        "interests": ["culture", "adventure"],
        "travel_style": "premium",
    }

    create_response = client.post("/api/plan-trip", json=payload)

    assert create_response.status_code == 200

    response = client.get("/api/trip-plans?source_city=Pune")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["count"] >= 1

    for saved_plan in body["data"]:
        assert saved_plan["source_city"] == "Pune"


def test_saved_trip_plans_rejects_invalid_limit() -> None:
    response = client.get("/api/trip-plans?limit=0")

    assert response.status_code == 422

    body = response.json()

    assert body["detail"]["success"] is False
    assert body["detail"]["message"] == "Request validation failed."


def test_saved_trip_plan_can_be_deleted() -> None:
    payload = {
        "source_city": "Chennai",
        "destination_city": "Goa",
        "start_date": "2026-08-01",
        "end_date": "2026-08-05",
        "budget": 50000,
        "currency": "INR",
        "travelers": 2,
        "interests": ["beaches", "local food"],
        "travel_style": "balanced",
    }

    create_response = client.post("/api/plan-trip", json=payload)

    assert create_response.status_code == 200

    created_body = create_response.json()
    plan_id = created_body["data"]["plan_id"]

    delete_response = client.delete(f"/api/trip-plans/{plan_id}")

    assert delete_response.status_code == 200

    delete_body = delete_response.json()

    assert delete_body["success"] is True
    assert delete_body["message"] == "Saved trip plan deleted successfully."
    assert delete_body["plan_id"] == plan_id

    get_response = client.get(f"/api/trip-plans/{plan_id}")

    assert get_response.status_code == 404


def test_saved_trip_plan_returns_404_for_unknown_plan_id() -> None:
    response = client.get("/api/trip-plans/unknown-plan-id")

    assert response.status_code == 404

    body = response.json()

    assert body["detail"]["success"] is False
    assert body["detail"]["message"] == "Saved trip plan was not found."


def test_delete_saved_trip_plan_returns_404_for_unknown_plan_id() -> None:
    response = client.delete("/api/trip-plans/unknown-plan-id")

    assert response.status_code == 404

    body = response.json()

    assert body["detail"]["success"] is False
    assert body["detail"]["message"] == "Saved trip plan was not found."


def test_plan_trip_endpoint_rejects_same_source_and_destination() -> None:
    payload = {
        "source_city": "Delhi",
        "destination_city": "Delhi",
        "start_date": "2026-05-19",
        "end_date": "2026-05-23",
        "budget": 35000,
        "currency": "INR",
        "travelers": 1,
        "interests": ["culture", "local food"],
        "travel_style": "balanced",
    }

    response = client.post("/api/plan-trip", json=payload)

    assert response.status_code == 422