from __future__ import annotations

from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class RegisteredAgent:
    """
    Public metadata about one agent in the travel planning system.
    """

    name: str
    role: str
    responsibility: str


AGENT_REGISTRY: List[RegisteredAgent] = [
    RegisteredAgent(
        name="Trip Orchestrator",
        role="orchestrator",
        responsibility=(
            "Coordinates the full A2A trip planning workflow, manages shared state, "
            "dispatches agent tasks, validates outputs, and assembles the final trip plan."
        ),
    ),
    RegisteredAgent(
        name="Route Validator Agent",
        role="route_validator_agent",
        responsibility=(
            "Validates trip inputs before planning, including city rules, route legs, "
            "trip dates, domestic/international restrictions, and basic feasibility."
        ),
    ),
    RegisteredAgent(
        name="Flight Agent",
        role="flight_agent",
        responsibility=(
            "Builds route-aware flight options, estimates realistic offline fares, "
            "and ranks options by budget, comfort, timing, and trip type."
        ),
    ),
    RegisteredAgent(
        name="Hotel Agent",
        role="hotel_agent",
        responsibility=(
            "Creates destination-specific stay options, evaluates price, rating, "
            "amenities, nights, room needs, and travel style."
        ),
    ),
    RegisteredAgent(
        name="Weather Agent",
        role="weather_agent",
        responsibility=(
            "Generates destination weather forecasts and travel advice for each day "
            "of the trip."
        ),
    ),
    RegisteredAgent(
        name="Activity Agent",
        role="activity_agent",
        responsibility=(
            "Recommends destination activities based on interests, trip duration, "
            "travel style, and budget feasibility."
        ),
    ),
    RegisteredAgent(
        name="Pricing Agent",
        role="pricing_agent",
        responsibility=(
            "Calculates itemized costs for flights, hotels, activities, food, local "
            "transport, buffer, total estimated cost, and remaining budget."
        ),
    ),
    RegisteredAgent(
        name="Budget Optimizer Agent",
        role="budget_optimizer_agent",
        responsibility=(
            "Optimizes plan cost against the user's requested budget by selecting "
            "value flights, smarter stays, practical activities, and realistic buffers."
        ),
    ),
    RegisteredAgent(
        name="Itinerary Agent",
        role="itinerary_agent",
        responsibility=(
            "Combines selected flight, stay, weather, activities, and pricing into "
            "a structured day-by-day itinerary."
        ),
    ),
    RegisteredAgent(
        name="Quality Gate Agent",
        role="quality_gate_agent",
        responsibility=(
            "Reviews the final plan before response, detects missing fields or invalid "
            "costs, adds warnings, and ensures frontend-safe output."
        ),
    ),
        RegisteredAgent(
        name="Gemini Summary Agent",
        role="gemini_summary_agent",
        responsibility=(
            "Uses Gemini as an optional AI reasoning layer to generate polished, "
            "user-friendly trip summaries while keeping backend fallback logic safe."
        ),
    ),
]


def get_agent_registry() -> List[RegisteredAgent]:
    """
    Return all registered agents.
    """

    return AGENT_REGISTRY.copy()