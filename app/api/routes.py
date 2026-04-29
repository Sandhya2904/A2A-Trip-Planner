from __future__ import annotations
from datetime import datetime, timezone
from uuid import uuid4
from typing import Any, Dict, List
from app.services.location_search_service import LocationSearchService
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse

from app.agents.registry import get_agent_registry
from app.api.dependencies import (
    get_trip_planning_service,
    get_trip_streaming_service,
)
from app.api.schemas import (
    AgentInfo,
    ApiInfoResponse,
    DeleteSavedTripPlanResponse,
    HealthResponse,
    ListSavedTripPlansResponse,
    PlanTripResponse,
    SavedTripPlanResponse,
)
from app.core.config import settings
from app.models.trip import TravelStyle, TripRequest
from app.services.travel_catalog_service import TravelCatalogService
from app.services.trip_planning_service import TripPlanningService
from app.services.trip_streaming_service import TripStreamingService


router = APIRouter()
location_search_service = LocationSearchService()

@router.get(
    "/",
    response_model=ApiInfoResponse,
    tags=["System"],
    summary="Get API information",
)
async def root() -> ApiInfoResponse:
    return ApiInfoResponse(
        name=settings.app_name,
        status="running",
        docs=settings.docs_url,
        health=settings.health_endpoint,
        planner_endpoint=settings.planner_endpoint,
    )
@router.get(
    "/api/locations/search",
    tags=["Locations"],
    summary="Search worldwide cities and locations",
)
async def search_locations(
    q: str = Query(..., min_length=2, description="City/location search text"),
    limit: int = Query(10, ge=1, le=25),
) -> Dict[str, Any]:
    locations = await location_search_service.search_locations(
        query=q,
        limit=limit,
    )

    return {
        "success": True,
        "message": "Locations loaded successfully.",
        "data": locations,
    }


@router.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Check API health",
)
async def health_check(response: Response) -> HealthResponse:
    request_id = str(uuid4())
    response.headers["X-Request-ID"] = request_id

    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
        request_id=request_id,
    )


@router.get(
    "/api/agents",
    response_model=List[AgentInfo],
    tags=["Agents"],
    summary="List backend agents",
)
async def list_agents() -> List[AgentInfo]:
    registered_agents = get_agent_registry()

    return [
        AgentInfo(
            name=agent.name,
            role=agent.role,
            responsibility=agent.responsibility,
        )
        for agent in registered_agents
    ]


@router.get(
    "/api/catalog",
    tags=["Catalog"],
    summary="Get route-aware travel catalog cards",
)
async def get_travel_catalog(
    category: str = Query(
        default="Hotels",
        description="Travel category such as Hotels, Homes, Flights, Buses, Tours.",
    ),
    source_city: str = Query(
        default="Kolkata",
        min_length=2,
        description="Trip source city.",
    ),
    destination_city: str = Query(
        default="Bengaluru",
        min_length=2,
        description="Trip destination city.",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=20,
        description="Maximum number of catalog cards.",
    ),
) -> Dict[str, Any]:
    service = TravelCatalogService()

    return await service.get_catalog_async(
        category=category,
        source_city=source_city,
        destination_city=destination_city,
        limit=limit,
    )


@router.get(
    "/api/sample-request",
    response_model=Dict[str, Any],
    tags=["Planner"],
    summary="Get a sample trip planning request",
)
async def sample_request() -> Dict[str, Any]:
    sample = TripRequest(
        source_city="Delhi",
        destination_city="Bengaluru",
        start_date="2026-05-19",
        end_date="2026-05-23",
        budget=35000,
        currency="INR",
        travelers=1,
        interests=["culture", "local food"],
        travel_style=TravelStyle.BALANCED,
    )

    return sample.model_dump(mode="json")


@router.post(
    "/api/plan-trip",
    response_model=PlanTripResponse,
    tags=["Planner"],
    summary="Generate a full multi-agent trip plan",
)
async def plan_trip(
    trip_request: TripRequest,
    response: Response,
    service: TripPlanningService = Depends(get_trip_planning_service),
) -> PlanTripResponse:
    request_id = str(uuid4())
    response.headers["X-Request-ID"] = request_id

    try:
        result = await service.generate_trip_plan(trip_request)

        if isinstance(result, dict):
            result["request_id"] = request_id

        return PlanTripResponse(
            success=True,
            message="Trip plan generated successfully.",
            data=result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "request_id": request_id,
                "message": "Invalid trip planning request.",
                "error": str(exc),
            },
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
detail={
    "success": False,
    "request_id": request_id,
    "error_code": "AGENT_ORCHESTRATION_FAILED",
    "message": "One or more agents failed during orchestration.",
    "error": str(exc),
},
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
detail={
    "success": False,
    "request_id": request_id,
    "error_code": "TRIP_PLANNER_INTERNAL_ERROR",
    "message": "Unexpected backend error while planning trip.",
    "error": str(exc),
},
        ) from exc


@router.post(
    "/api/plan-trip/stream",
    tags=["Planner"],
    summary="Stream a live multi-agent trip planning workflow",
)
async def stream_trip_plan(
    trip_request: TripRequest,
    service: TripStreamingService = Depends(get_trip_streaming_service),
) -> StreamingResponse:
    request_id = str(uuid4())

    return StreamingResponse(
        service.stream_trip_plan(trip_request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Request-ID": request_id,
        },
    )


@router.get(
    "/api/trip-plans",
    response_model=ListSavedTripPlansResponse,
    tags=["Planner"],
    summary="List saved trip plans",
)
async def list_saved_trip_plans(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of saved trip plans to return.",
    ),
    destination_city: str | None = Query(
        default=None,
        description="Optional case-insensitive destination city filter.",
    ),
    source_city: str | None = Query(
        default=None,
        description="Optional case-insensitive source city filter.",
    ),
    service: TripPlanningService = Depends(get_trip_planning_service),
) -> ListSavedTripPlansResponse:
    try:
        saved_plans = service.list_saved_trip_plans()

        if destination_city:
            destination_query = destination_city.strip().lower()
            saved_plans = [
                plan
                for plan in saved_plans
                if str(plan.get("destination_city") or "").lower()
                == destination_query
            ]

        if source_city:
            source_query = source_city.strip().lower()
            saved_plans = [
                plan
                for plan in saved_plans
                if str(plan.get("source_city") or "").lower() == source_query
            ]

        limited_plans = saved_plans[:limit]

        return ListSavedTripPlansResponse(
            success=True,
            message="Saved trip plans retrieved successfully.",
            count=len(limited_plans),
            data=limited_plans,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
           detail={
    "success": False,
    "request_id": request_id,
    "error_code": "TRIP_VALIDATION_ERROR",
    "message": "Invalid trip planning request.",
    "error": str(exc),
},
        ) from exc


@router.get(
    "/api/trip-plans/{plan_id}",
    response_model=SavedTripPlanResponse,
    tags=["Planner"],
    summary="Retrieve a saved trip plan",
)
async def get_saved_trip_plan(
    plan_id: str,
    service: TripPlanningService = Depends(get_trip_planning_service),
) -> SavedTripPlanResponse:
    try:
        saved_plan = service.get_saved_trip_plan(plan_id)

        return SavedTripPlanResponse(
            success=True,
            message="Saved trip plan retrieved successfully.",
            data=saved_plan,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "Saved trip plan was not found.",
                "error": str(exc),
            },
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Invalid plan id.",
                "error": str(exc),
            },
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "Unexpected backend error while retrieving saved trip plan.",
                "error": str(exc),
            },
        ) from exc


@router.delete(
    "/api/trip-plans/{plan_id}",
    response_model=DeleteSavedTripPlanResponse,
    tags=["Planner"],
    summary="Delete a saved trip plan",
)
async def delete_saved_trip_plan(
    plan_id: str,
    service: TripPlanningService = Depends(get_trip_planning_service),
) -> DeleteSavedTripPlanResponse:
    try:
        deleted_plan = service.delete_saved_trip_plan(plan_id)

        return DeleteSavedTripPlanResponse(
            success=True,
            message="Saved trip plan deleted successfully.",
            plan_id=deleted_plan["plan_id"],
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "Saved trip plan was not found.",
                "error": str(exc),
            },
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Invalid plan id.",
                "error": str(exc),
            },
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "Unexpected backend error while deleting saved trip plan.",
                "error": str(exc),
            },
        ) from exc