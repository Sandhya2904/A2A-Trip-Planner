from __future__ import annotations

import asyncio

from app.models.trip import TravelStyle, TripRequest
from app.orchestrator.trip_orchestrator import TripOrchestrator


def test_trip_orchestrator_generates_complete_trip_plan() -> None:
    trip_request = TripRequest(
        source_city="Kolkata",
        destination_city="Goa",
        start_date="2026-05-10",
        end_date="2026-05-14",
        budget=35000,
        currency="INR",
        travelers=2,
        interests=["beaches", "nightlife", "local food"],
        travel_style=TravelStyle.BALANCED,
    )

    orchestrator = TripOrchestrator()
    result = asyncio.run(orchestrator.plan_trip(trip_request))

    final_plan = result["final_trip_plan"]

    assert result["conversation_id"]
    assert result["summary"]
    assert "agent_outputs" in result
    assert "orchestration_logs" in result

    assert final_plan["request"]["source_city"] == "Kolkata"
    assert final_plan["request"]["destination_city"] == "Goa"

    assert final_plan["selected_flight"] is not None
    assert final_plan["selected_hotel"] is not None

    assert len(final_plan["weather"]) == 5
    assert len(final_plan["activities"]) >= 1
    assert len(final_plan["itinerary"]) == 5

    assert final_plan["budget_breakdown"]["total_estimated_cost"] > 0
    assert len(final_plan["booking_links"]) >= 2


def test_budget_plan_can_detect_over_budget_trip() -> None:
    trip_request = TripRequest(
        source_city="Kolkata",
        destination_city="Goa",
        start_date="2026-05-10",
        end_date="2026-05-14",
        budget=10000,
        currency="INR",
        travelers=2,
        interests=["beaches", "nightlife", "local food"],
        travel_style=TravelStyle.BALANCED,
    )

    orchestrator = TripOrchestrator()
    result = asyncio.run(orchestrator.plan_trip(trip_request))

    pricing_output = result["agent_outputs"]["pricing"]
    final_plan = result["final_trip_plan"]

    assert pricing_output["budget_status"] == "over_budget"
    assert final_plan["budget_breakdown"]["remaining_budget"] < 0


def test_premium_trip_selects_premium_style_outputs() -> None:
    trip_request = TripRequest(
        source_city="Delhi",
        destination_city="Dubai",
        start_date="2026-06-01",
        end_date="2026-06-05",
        budget=200000,
        currency="INR",
        travelers=2,
        interests=["culture", "adventure", "local food"],
        travel_style=TravelStyle.PREMIUM,
    )

    orchestrator = TripOrchestrator()
    result = asyncio.run(orchestrator.plan_trip(trip_request))

    final_plan = result["final_trip_plan"]

    assert final_plan["request"]["travel_style"] == "premium"
    assert final_plan["selected_hotel"]["rating"] >= 4.4
    assert final_plan["budget_breakdown"]["total_estimated_cost"] > 0
    assert len(final_plan["itinerary"]) == 5