from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4


class TripPlanStore:
    """
    Local JSON storage for generated trip plans.

    This gives the project a simple persistence layer without needing a database.
    Later, this can be replaced with PostgreSQL, MongoDB, Supabase, Firebase,
    or S3 without changing the API contract.
    """

    def __init__(self, storage_dir: str = "storage/trip_plans") -> None:
        self.storage_path = Path(storage_dir)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def save_trip_plan(self, trip_plan_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a generated trip plan as JSON and return the updated result.

        The returned result includes:
        - plan_id
        - saved_at
        - storage_path
        """

        plan_id = self._resolve_plan_id(trip_plan_result)
        saved_at = datetime.now(timezone.utc).isoformat()

        enriched_result = {
            "plan_id": plan_id,
            "saved_at": saved_at,
            **trip_plan_result,
        }

        file_path = self.storage_path / f"{plan_id}.json"

        with file_path.open("w", encoding="utf-8") as file:
            json.dump(
                enriched_result,
                file,
                indent=2,
                ensure_ascii=False,
                default=str,
            )

        enriched_result["storage_path"] = str(file_path)

        return enriched_result

    def get_trip_plan(self, plan_id: str) -> Dict[str, Any]:
        """
        Retrieve a saved trip plan by plan_id.
        """

        safe_plan_id = self._validate_plan_id(plan_id)
        file_path = self.storage_path / f"{safe_plan_id}.json"

        if not file_path.exists():
            raise FileNotFoundError(f"No saved trip plan found for plan_id '{plan_id}'.")

        with file_path.open("r", encoding="utf-8") as file:
            trip_plan = json.load(file)

        if not isinstance(trip_plan, dict):
            raise ValueError(f"Saved trip plan '{plan_id}' has invalid JSON structure.")

        trip_plan["storage_path"] = str(file_path)

        return trip_plan

    def list_trip_plans(self) -> List[Dict[str, Any]]:
        """
        Return lightweight summaries for all saved trip plans.

        This method is intentionally defensive. If one saved file is corrupted
        or has an old structure, it skips that file instead of crashing the API.
        """

        summaries: List[Dict[str, Any]] = []

        for file_path in self.storage_path.glob("*.json"):
            try:
                with file_path.open("r", encoding="utf-8") as file:
                    trip_plan = json.load(file)

                if not isinstance(trip_plan, dict):
                    continue

                summary = self._build_trip_plan_summary(trip_plan, file_path)
                summaries.append(summary)

            except (json.JSONDecodeError, OSError, TypeError, AttributeError):
                continue

        summaries.sort(
            key=lambda item: item.get("saved_at") or "",
            reverse=True,
        )

        return summaries

    def delete_trip_plan(self, plan_id: str) -> Dict[str, Any]:
        """
        Delete a saved trip plan by plan_id.
        """

        safe_plan_id = self._validate_plan_id(plan_id)
        file_path = self.storage_path / f"{safe_plan_id}.json"

        if not file_path.exists():
            raise FileNotFoundError(f"No saved trip plan found for plan_id '{plan_id}'.")

        file_path.unlink()

        return {
            "plan_id": safe_plan_id,
            "deleted": True,
            "storage_path": str(file_path),
        }

    def _build_trip_plan_summary(
        self,
        trip_plan: Dict[str, Any],
        file_path: Path,
    ) -> Dict[str, Any]:
        """
        Build a lightweight summary from a saved trip plan.
        """

        final_plan = trip_plan.get("final_trip_plan")

        if not isinstance(final_plan, dict):
            final_plan = {}

        request = final_plan.get("request")

        if not isinstance(request, dict):
            request = {}

        budget_breakdown = final_plan.get("budget_breakdown")

        if not isinstance(budget_breakdown, dict):
            budget_breakdown = {}

        return {
            "plan_id": str(trip_plan.get("plan_id") or file_path.stem),
            "saved_at": trip_plan.get("saved_at"),
            "source_city": request.get("source_city"),
            "destination_city": request.get("destination_city"),
            "start_date": request.get("start_date"),
            "end_date": request.get("end_date"),
            "budget": request.get("budget"),
            "currency": request.get("currency"),
            "travelers": request.get("travelers"),
            "travel_style": request.get("travel_style"),
            "total_estimated_cost": budget_breakdown.get("total_estimated_cost"),
            "remaining_budget": budget_breakdown.get("remaining_budget"),
            "storage_path": str(file_path),
        }

    def _resolve_plan_id(self, trip_plan_result: Dict[str, Any]) -> str:
        """
        Prefer the orchestrator conversation_id as the saved plan id.
        Fall back to UUID if missing.
        """

        conversation_id = trip_plan_result.get("conversation_id")

        if conversation_id:
            return self._validate_plan_id(str(conversation_id))

        return str(uuid4())

    def _validate_plan_id(self, plan_id: str) -> str:
        """
        Keep local file access safe by allowing only simple file names.
        """

        cleaned = plan_id.strip()

        if not cleaned:
            raise ValueError("plan_id cannot be empty.")

        blocked_fragments = ["/", "\\", ".."]

        if any(fragment in cleaned for fragment in blocked_fragments):
            raise ValueError("Invalid plan_id format.")

        return cleaned