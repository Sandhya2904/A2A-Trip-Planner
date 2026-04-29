from __future__ import annotations

import asyncio

from app.models.trip import TravelStyle, TripRequest
from app.orchestrator.trip_orchestrator import TripOrchestrator


async def main() -> None:
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
    result = await orchestrator.plan_trip(trip_request)

    final_plan = result["final_trip_plan"]

    print("Central Orchestrator test successful.")

    print("\nOrchestration Logs:")
    for log in result["orchestration_logs"]:
        print(f"- {log}")

    print("\nTrip Summary:")
    print(result["summary"])

    print("\nSelected Flight:")
    print(final_plan["selected_flight"]["airline"])
    print(final_plan["selected_flight"]["flight_number"])

    print("\nSelected Hotel:")
    print(final_plan["selected_hotel"]["name"])

    print("\nBudget Breakdown:")
    budget = final_plan["budget_breakdown"]
    print(f"Flights: {final_plan['request']['currency']} {budget['flights']}")
    print(f"Hotels: {final_plan['request']['currency']} {budget['hotels']}")
    print(f"Activities: {final_plan['request']['currency']} {budget['activities']}")
    print(f"Food: {final_plan['request']['currency']} {budget['food']}")
    print(
        f"Local Transport: {final_plan['request']['currency']} "
        f"{budget['local_transport']}"
    )
    print(f"Buffer: {final_plan['request']['currency']} {budget['buffer']}")
    print(
        f"Total Estimated Cost: {final_plan['request']['currency']} "
        f"{budget['total_estimated_cost']}"
    )
    print(
        f"Remaining Budget: {final_plan['request']['currency']} "
        f"{budget['remaining_budget']}"
    )

    print("\nDay-by-day Itinerary:")
    for day in final_plan["itinerary"]:
        print(f"\nDay {day['day']} - {day['title']}")
        print(f"Date: {day['date']}")
        print(f"Morning: {day['morning']}")
        print(f"Afternoon: {day['afternoon']}")
        print(f"Evening: {day['evening']}")
        print(f"Estimated Cost: {final_plan['request']['currency']} {day['estimated_cost']}")
        print(f"Weather: {day['weather_note']}")

    print("\nBooking/Search Links:")
    for link in final_plan["booking_links"]:
        print(f"- {link}")


if __name__ == "__main__":
    asyncio.run(main())