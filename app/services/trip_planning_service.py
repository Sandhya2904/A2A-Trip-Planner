from __future__ import annotations

from typing import Any, Dict, List

from app.core.config import settings
from app.models.trip import TripRequest
from app.orchestrator.trip_orchestrator import TripOrchestrator
from app.services.live_budget_service import LiveBudgetService
from app.storage.trip_plan_store import TripPlanStore


class TripPlanningService:
    """
    Application service for trip planning.

    This service:
    1. Runs the A2A trip orchestrator.
    2. Recalculates the final budget using SerpApi live pricing if available.
    3. Falls back honestly when live pricing fails.
    4. Saves the final corrected plan.
    """

    def __init__(self) -> None:
        self.orchestrator = TripOrchestrator()
        self.live_budget_service = LiveBudgetService()
        self.trip_plan_store = TripPlanStore(
            storage_dir=settings.trip_plan_storage_dir,
        )

    async def generate_trip_plan(self, trip_request: TripRequest) -> Dict[str, Any]:
        """
        Generate a full trip plan using the orchestrator,
        then replace demo/fake pricing with real-world pricing.
        """

        result = await self.orchestrator.plan_trip(trip_request)

        result = await self._apply_real_world_budget(
            trip_request=trip_request,
            result=result,
        )

        saved_result = self.trip_plan_store.save_trip_plan(result)

        return saved_result

    async def _apply_real_world_budget(
        self,
        *,
        trip_request: TripRequest,
        result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Post-process the orchestrator result with live/fallback budget pricing.

        This avoids rewriting all agents immediately while still making the final
        plan financially realistic.
        """

        live_budget = await self.live_budget_service.estimate_budget(
            trip_request=trip_request,
            existing_plan=result,
        )

        budget_breakdown = live_budget["budget_breakdown"]
        budget_status = live_budget["budget_status"]
        pricing_metadata = live_budget["pricing_metadata"]
        selected_flight_patch = live_budget["selected_flight_patch"]
        selected_hotel_patch = live_budget["selected_hotel_patch"]
        summary = live_budget["summary"]

        final_trip_plan = result.setdefault("final_trip_plan", {})

        final_trip_plan["summary"] = summary
        final_trip_plan["budget_breakdown"] = budget_breakdown
        final_trip_plan["budget_status"] = budget_status
        final_trip_plan["pricing_metadata"] = pricing_metadata

        existing_flight = final_trip_plan.get("selected_flight")

        if isinstance(existing_flight, dict):
            existing_flight.update(selected_flight_patch)
            final_trip_plan["selected_flight"] = existing_flight
        else:
            final_trip_plan["selected_flight"] = selected_flight_patch

        existing_hotel = final_trip_plan.get("selected_hotel")

        if isinstance(existing_hotel, dict):
            existing_hotel.update(selected_hotel_patch)
            final_trip_plan["selected_hotel"] = existing_hotel
        else:
            final_trip_plan["selected_hotel"] = selected_hotel_patch

        result["summary"] = summary
        result["live_pricing"] = pricing_metadata

        agent_outputs = result.setdefault("agent_outputs", {})
        agent_outputs["pricing"] = {
            "agent": "Live Pricing Agent",
            "budget_breakdown": budget_breakdown,
            "budget_status": budget_status,
            "pricing_metadata": pricing_metadata,
            "recommendations": self._build_budget_recommendations(
                budget_breakdown=budget_breakdown,
                pricing_metadata=pricing_metadata,
            ),
        }

        agent_trace = result.setdefault("agent_trace", [])

        agent_trace.append(
            {
                "agent": "Live Pricing Agent",
                "status": "completed",
                "message": (
                    "Recalculated final trip budget using "
                    f"{pricing_metadata.get('price_source')} pricing "
                    f"with {pricing_metadata.get('confidence')} confidence."
                ),
            }
        )

        orchestration_logs = result.setdefault("orchestration_logs", [])

        orchestration_logs.append(
            "Live Pricing Agent recalculated final budget using "
            f"{pricing_metadata.get('price_source')} with "
            f"{pricing_metadata.get('confidence')} confidence."
        )

        for warning in pricing_metadata.get("warnings", []):
            orchestration_logs.append(f"Live Pricing warning: {warning}")

        return result

    def _build_budget_recommendations(
        self,
        *,
        budget_breakdown: Dict[str, Any],
        pricing_metadata: Dict[str, Any],
    ) -> List[str]:
        recommendations: List[str] = []

        remaining_budget = float(budget_breakdown.get("remaining_budget") or 0)
        total = float(budget_breakdown.get("total_estimated_cost") or 0)
        price_source = pricing_metadata.get("price_source")

        if price_source == "live_api":
            recommendations.append(
                "Flight and hotel prices were checked with live pricing before final budget calculation."
            )
        elif price_source == "mixed_live_and_fallback":
            recommendations.append(
                "Some prices came from live APIs and some used fallback estimates because not every provider returned data."
            )
        else:
            recommendations.append(
                "Live pricing was unavailable, so the system used fallback real-world estimates instead of pretending fake prices were live."
            )

        if remaining_budget < 0:
            recommendations.append(
                "This trip is over budget. Increase budget or reduce travel style, hotel level, activities, or number of nights."
            )
        elif total > 0 and remaining_budget <= total * 0.10:
            recommendations.append(
                "This plan is close to the budget limit. Keep extra money for fare changes, taxes, meals, and local movement."
            )
        else:
            recommendations.append(
                "This plan has a comfortable budget margin based on the current estimate."
            )

        recommendations.append(
            "A buffer is included for price changes, transfers, taxes, meals, and unexpected local costs."
        )

        return recommendations

    def get_saved_trip_plan(self, plan_id: str) -> Dict[str, Any]:
        """
        Retrieve a previously generated trip plan.
        """

        return self.trip_plan_store.get_trip_plan(plan_id)

    def list_saved_trip_plans(self) -> List[Dict[str, Any]]:
        """
        List summaries of all previously generated trip plans.
        """

        return self.trip_plan_store.list_trip_plans()

    def delete_saved_trip_plan(self, plan_id: str) -> Dict[str, Any]:
        """
        Delete a previously generated trip plan.
        """

        return self.trip_plan_store.delete_trip_plan(plan_id)