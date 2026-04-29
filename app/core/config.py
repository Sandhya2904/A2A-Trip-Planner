from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class ApiSettings:
    """
    Central API configuration.

    Keeping settings here makes the backend easier to maintain and safer to
    extend when adding deployment, authentication, logging, real providers,
    environment-specific configuration, or database storage later.
    """

    app_name: str = "A2A Trip Planner API"
    app_version: str = "1.0.0"
    service_name: str = "a2a-trip-planner-api"

    description: str = (
        "Production-style backend API for an offline-first multi-agent travel "
        "planner. It coordinates specialized agents for flights, hotels, weather, "
        "activities, pricing, and itinerary generation through a central "
        "orchestrator."
    )

    docs_url: str = "/docs"
    health_endpoint: str = "/api/health"
    planner_endpoint: str = "/api/plan-trip"

    trip_plan_storage_dir: str = os.getenv(
        "TRIP_PLAN_STORAGE_DIR",
        "storage/trip_plans",
    )

    allowed_origins: List[str] = field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )


settings = ApiSettings()