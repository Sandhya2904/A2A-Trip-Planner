from __future__ import annotations

from typing import List

from app.agents.base_agent import AgentResult, BaseTravelAgent
from app.models.trip import TripPlan


class QualityGateAgent(BaseTravelAgent):
    name = "Quality Gate Agent"
    role = "quality_gate_agent"
    responsibility = (
        "Reviews the final trip plan before API response, checks missing fields, "
        "budget logic, itinerary completeness, and frontend-safe output."
    )

    def review(self, trip_plan: TripPlan) -> AgentResult:
        warnings: List[str] = []
        errors: List[str] = []

        if not trip_plan.request:
            errors.append("Trip request is missing from final plan.")

        if not trip_plan.selected_flight:
            errors.append("Selected flight is missing from final plan.")

        if not trip_plan.selected_hotel:
            errors.append("Selected hotel is missing from final plan.")

        if not trip_plan.budget_breakdown:
            errors.append("Budget breakdown is missing from final plan.")

        if not trip_plan.itinerary:
            errors.append("Itinerary is missing from final plan.")

        if trip_plan.request and trip_plan.itinerary:
            expected_days = (
                trip_plan.request.end_date - trip_plan.request.start_date
            ).days + 1

            if len(trip_plan.itinerary) != expected_days:
                warnings.append(
                    f"Itinerary has {len(trip_plan.itinerary)} day(s), "
                    f"but request expects {expected_days} day(s)."
                )

        if trip_plan.budget_breakdown:
            budget = trip_plan.budget_breakdown

            if budget.total_estimated_cost <= 0:
                errors.append("Total estimated cost must be greater than zero.")

            if trip_plan.request:
                expected_remaining = round(
                    trip_plan.request.budget - budget.total_estimated_cost,
                    2,
                )

                if abs(expected_remaining - budget.remaining_budget) > 2:
                    warnings.append(
                        "Remaining budget does not exactly match requested budget "
                        "minus total estimated cost."
                    )

                if budget.remaining_budget < 0:
                    warnings.append(
                        "Trip is above the requested budget. Frontend should show an over-budget warning."
                    )

        if not trip_plan.booking_links:
            warnings.append("No booking/search links were attached to the plan.")

        if not trip_plan.summary:
            warnings.append("Final trip summary is empty.")

        if errors:
            return self.failure(
                summary="Quality gate found blocking issues in final trip plan.",
                warnings=errors + warnings,
                metadata={
                    "error_count": len(errors),
                    "warning_count": len(warnings),
                },
            )

        return self.success(
            summary="Quality gate passed final trip plan.",
            warnings=warnings,
            confidence=0.95 if warnings else 0.99,
            data={
                "passed": True,
                "warning_count": len(warnings),
                "warnings": warnings,
            },
            metadata={
                "itinerary_days": len(trip_plan.itinerary),
                "booking_links": len(trip_plan.booking_links),
            },
        )