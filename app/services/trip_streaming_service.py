from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List

from app.models.trip import TripRequest
from app.services.trip_planning_service import TripPlanningService


class TripStreamingService:
    """
    Fast streaming service for live trip planning.

    Real planning starts immediately.
    Every started agent is always completed before final_result is sent.
    """

    def __init__(self) -> None:
        self.trip_planning_service = TripPlanningService()

    async def stream_trip_plan(
        self,
        trip_request: TripRequest,
    ) -> AsyncGenerator[str, None]:
        try:
            planning_task = asyncio.create_task(
                self.trip_planning_service.generate_trip_plan(trip_request)
            )

            yield self._format_sse(
                event="start",
                data={
                    "status": "started",
                    "title": "Planning started",
                    "description": (
                        f"Planning {trip_request.source_city} to "
                        f"{trip_request.destination_city} with live pricing."
                    ),
                    "progress_percent": 5,
                    "route": {
                        "source_city": trip_request.source_city,
                        "destination_city": trip_request.destination_city,
                        "trip_type": trip_request.trip_type.value,
                        "travel_style": trip_request.travel_style.value,
                        "budget": trip_request.budget,
                        "currency": trip_request.currency,
                        "travelers": trip_request.travelers,
                    },
                },
            )

            checkpoints: List[Dict[str, Any]] = [
                {
                    "agent": "route_validator_agent",
                    "title": "Route Validator Agent",
                    "description": "Checking route, dates, travelers, and trip rules.",
                    "progress_percent": 15,
                },
                {
                    "agent": "live_pricing_agent",
                    "title": "Live Pricing Agent",
                    "description": "Checking real flight and hotel prices from live providers.",
                    "progress_percent": 40,
                },
                {
                    "agent": "budget_optimizer_agent",
                    "title": "Budget Optimizer Agent",
                    "description": "Calculating total cost, remaining budget, and budget health.",
                    "progress_percent": 60,
                },
                {
                    "agent": "itinerary_agent",
                    "title": "Itinerary Agent",
                    "description": "Building day-wise itinerary from the final route.",
                    "progress_percent": 80,
                },
                {
                    "agent": "quality_gate_agent",
                    "title": "Quality Gate Agent",
                    "description": "Checking final plan quality before showing result.",
                    "progress_percent": 92,
                },
            ]

            last_started_step = 0

            for index, checkpoint in enumerate(checkpoints, start=1):
                if planning_task.done():
                    break

                last_started_step = index

                yield self._format_sse(
                    event="agent_started",
                    data={
                        "step": index,
                        "total_steps": len(checkpoints),
                        "agent": checkpoint["agent"],
                        "title": checkpoint["title"],
                        "description": checkpoint["description"],
                        "status": "running",
                        "progress_percent": checkpoint["progress_percent"],
                    },
                )

                task_finished_during_step = False

                try:
                    await asyncio.wait_for(
                        asyncio.shield(planning_task),
                        timeout=0.9,
                    )
                    task_finished_during_step = True
                except asyncio.TimeoutError:
                    task_finished_during_step = False

                # IMPORTANT:
                # Always complete the started agent before sending final_result.
                yield self._format_sse(
                    event="agent_completed",
                    data={
                        "step": index,
                        "total_steps": len(checkpoints),
                        "agent": checkpoint["agent"],
                        "title": checkpoint["title"],
                        "description": f"{checkpoint['title']} completed.",
                        "status": "completed",
                        "progress_percent": min(
                            checkpoint["progress_percent"] + 5,
                            98,
                        ),
                    },
                )

                if task_finished_during_step:
                    break

            heartbeat_count = 0

            while not planning_task.done():
                heartbeat_count += 1

                yield self._format_sse(
                    event="progress",
                    data={
                        "status": "running",
                        "title": "Live pricing still running",
                        "description": (
                            "Waiting for real flight/hotel provider response. "
                            "This can take a few seconds for live prices."
                        ),
                        "progress_percent": min(93 + heartbeat_count, 98),
                    },
                )

                await asyncio.sleep(1.0)

            final_result = await planning_task

            final_plan = final_result.get("final_trip_plan", {})
            budget_breakdown = final_plan.get("budget_breakdown", {})
            pricing_metadata = (
                final_result.get("live_pricing")
                or final_plan.get("pricing_metadata")
                or {}
            )

            yield self._format_sse(
                event="final_result",
                data={
                    "status": "completed",
                    "title": "Trip plan generated",
                    "description": "Final trip plan is ready.",
                    "progress_percent": 100,
                    "plan_id": final_result.get("plan_id"),
                    "conversation_id": final_result.get("conversation_id"),
                    "total_estimated_cost": budget_breakdown.get(
                        "total_estimated_cost"
                    ),
                    "remaining_budget": budget_breakdown.get("remaining_budget"),
                    "price_source": pricing_metadata.get("price_source"),
                    "pricing_confidence": pricing_metadata.get("confidence"),
                    "result": final_result,
                },
            )

            yield self._format_sse(
                event="completed",
                data={
                    "status": "completed",
                    "title": "Workflow completed",
                    "description": "Live backend planning finished successfully.",
                    "progress_percent": 100,
                    "plan_id": final_result.get("plan_id"),
                    "conversation_id": final_result.get("conversation_id"),
                },
            )

        except Exception as exc:
            yield self._format_sse(
                event="error",
                data={
                    "status": "failed",
                    "title": "Trip planning failed",
                    "description": str(exc),
                    "progress_percent": 0,
                },
            )

    def _format_sse(self, *, event: str, data: Dict[str, Any]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"