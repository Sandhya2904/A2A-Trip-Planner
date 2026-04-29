from __future__ import annotations

import asyncio
from datetime import date, timedelta
from time import perf_counter
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from app.agents.budget_optimizer_agent import BudgetOptimizerAgent
from app.agents.quality_gate_agent import QualityGateAgent
from app.agents.route_validator_agent import RouteValidatorAgent
from app.a2a.protocol import (
    AgentExecutionRecord,
    AgentRole,
    AgentStatus,
    create_result_message,
    create_task_message,
    create_trace_event,
    utc_now,
)
from app.models.trip import (
    ActivityOption,
    BudgetBreakdown,
    FlightOption,
    HotelOption,
    ItineraryDay,
    TravelStyle,
    TripPlan,
    TripRequest,
    TripType,
    WeatherForecast,
)
from app.services.gemini_ai_service import GeminiAIService


class TripOrchestrator:
    def __init__(self) -> None:
        self.route_validator_agent = RouteValidatorAgent()
        self.budget_optimizer_agent = BudgetOptimizerAgent()
        self.quality_gate_agent = QualityGateAgent()
        self.gemini_ai_service = GeminiAIService()

    async def plan_trip(self, trip_request: TripRequest) -> Dict[str, Any]:
        conversation_id = str(uuid4())
        orchestration_logs: List[str] = []
        a2a_messages: List[Dict[str, Any]] = []
        agent_trace: List[Dict[str, Any]] = []
        execution_records: List[Dict[str, Any]] = []

        orchestration_logs.append(
            f"Created A2A conversation {conversation_id} for route "
            f"{self._route_label(trip_request)}."
        )

        request_payload = trip_request.model_dump(mode="json")

        route_validator_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.ROUTE_VALIDATOR_AGENT,
            task_name="validate_route",
            payload=request_payload,
            metadata={"priority": "critical"},
        )

        a2a_messages.append(route_validator_task.model_dump(mode="json"))

        route_validation_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.ROUTE_VALIDATOR_AGENT,
            task_message=route_validator_task,
            title="Route Validator Agent",
            description=(
                "Validates city choices, route legs, dates, domestic restrictions, "
                "and basic budget feasibility before planning."
            ),
            coroutine=self._run_route_validator_agent(trip_request),
        )

        route_validation = route_validation_result["output"]["route_validation"]

        a2a_messages.append(route_validation_result["response_message"])
        agent_trace.append(route_validation_result["trace"])
        execution_records.append(route_validation_result["execution_record"])
        orchestration_logs.append(route_validation_result["log"])
        orchestration_logs.append(route_validation.summary)

        if route_validation.warnings:
            orchestration_logs.extend(
                [
                    f"Route Validator warning: {warning}"
                    for warning in route_validation.warnings
                ]
            )

        if not route_validation.success:
            raise ValueError("; ".join(route_validation.warnings))

        flight_task, hotel_task, weather_task, activity_task = [
            create_task_message(
                conversation_id=conversation_id,
                sender=AgentRole.ORCHESTRATOR,
                receiver=AgentRole.FLIGHT_AGENT,
                task_name="rank_flights",
                payload=request_payload,
                metadata={"priority": "high"},
            ),
            create_task_message(
                conversation_id=conversation_id,
                sender=AgentRole.ORCHESTRATOR,
                receiver=AgentRole.HOTEL_AGENT,
                task_name="rank_hotels",
                payload=request_payload,
                metadata={"priority": "high"},
            ),
            create_task_message(
                conversation_id=conversation_id,
                sender=AgentRole.ORCHESTRATOR,
                receiver=AgentRole.WEATHER_AGENT,
                task_name="forecast_weather",
                payload=request_payload,
                metadata={"priority": "medium"},
            ),
            create_task_message(
                conversation_id=conversation_id,
                sender=AgentRole.ORCHESTRATOR,
                receiver=AgentRole.ACTIVITY_AGENT,
                task_name="recommend_activities",
                payload=request_payload,
                metadata={"priority": "medium"},
            ),
        ]

        a2a_messages.extend(
            [
                flight_task.model_dump(mode="json"),
                hotel_task.model_dump(mode="json"),
                weather_task.model_dump(mode="json"),
                activity_task.model_dump(mode="json"),
            ]
        )

        orchestration_logs.append(
            "Dispatched parallel A2A task messages to flight, hotel, weather, "
            "and activity agents."
        )

        (
            flight_result,
            hotel_result,
            weather_result,
            activity_result,
        ) = await asyncio.gather(
            self._execute_agent_task(
                conversation_id=conversation_id,
                agent=AgentRole.FLIGHT_AGENT,
                task_message=flight_task,
                title="Flight Agent",
                description="Ranks available flights based on style, budget, and timing.",
                coroutine=self._run_flight_agent(trip_request),
            ),
            self._execute_agent_task(
                conversation_id=conversation_id,
                agent=AgentRole.HOTEL_AGENT,
                task_message=hotel_task,
                title="Hotel Agent",
                description="Selects stay options based on rating, location, and travel style.",
                coroutine=self._run_hotel_agent(trip_request),
            ),
            self._execute_agent_task(
                conversation_id=conversation_id,
                agent=AgentRole.WEATHER_AGENT,
                task_message=weather_task,
                title="Weather Agent",
                description="Builds daily weather forecast and travel advice.",
                coroutine=self._run_weather_agent(trip_request),
            ),
            self._execute_agent_task(
                conversation_id=conversation_id,
                agent=AgentRole.ACTIVITY_AGENT,
                task_message=activity_task,
                title="Activity Agent",
                description="Recommends destination activities from user interests.",
                coroutine=self._run_activity_agent(trip_request),
            ),
        )

        selected_flight = flight_result["output"]["selected_flight"]
        selected_hotel = hotel_result["output"]["selected_hotel"]
        weather = weather_result["output"]["weather"]
        activities = activity_result["output"]["activities"]

        for result in [flight_result, hotel_result, weather_result, activity_result]:
            a2a_messages.append(result["response_message"])
            agent_trace.append(result["trace"])
            execution_records.append(result["execution_record"])
            orchestration_logs.append(result["log"])

        budget_optimizer_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.BUDGET_OPTIMIZER_AGENT,
            task_name="optimize_budget",
            payload={
                "request": request_payload,
                "selected_flight": selected_flight.model_dump(mode="json"),
                "selected_hotel": selected_hotel.model_dump(mode="json"),
                "activities": [
                    activity.model_dump(mode="json") for activity in activities
                ],
            },
            metadata={
                "depends_on": ["flight_agent", "hotel_agent", "activity_agent"],
                "priority": "high",
            },
        )

        a2a_messages.append(budget_optimizer_task.model_dump(mode="json"))

        budget_optimizer_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.BUDGET_OPTIMIZER_AGENT,
            task_message=budget_optimizer_task,
            title="Budget Optimizer Agent",
            description=(
                "Optimizes flight, stay, and activity choices against the user's "
                "requested budget using realistic minimum estimates."
            ),
            coroutine=self._run_budget_optimizer_agent(
                trip_request=trip_request,
                selected_flight=selected_flight,
                selected_hotel=selected_hotel,
                activities=activities,
            ),
        )

        budget_optimization = budget_optimizer_result["output"]["budget_optimization"]

        a2a_messages.append(budget_optimizer_result["response_message"])
        agent_trace.append(budget_optimizer_result["trace"])
        execution_records.append(budget_optimizer_result["execution_record"])
        orchestration_logs.append(budget_optimizer_result["log"])
        orchestration_logs.append(budget_optimization.summary)

        if budget_optimization.warnings:
            orchestration_logs.extend(
                [
                    f"Budget Optimizer warning: {warning}"
                    for warning in budget_optimization.warnings
                ]
            )

        selected_flight = budget_optimization.data["selected_flight"]
        selected_hotel = budget_optimization.data["selected_hotel"]
        activities = budget_optimization.data["activities"]

        flight_result["output"]["selected_flight"] = selected_flight
        hotel_result["output"]["selected_hotel"] = selected_hotel
        activity_result["output"]["activities"] = activities

        pricing_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.PRICING_AGENT,
            task_name="calculate_budget",
            payload={
                "request": request_payload,
                "selected_flight": selected_flight.model_dump(mode="json"),
                "selected_hotel": selected_hotel.model_dump(mode="json"),
                "activities": [
                    activity.model_dump(mode="json") for activity in activities
                ],
            },
            metadata={
                "depends_on": [
                    "flight_agent",
                    "hotel_agent",
                    "activity_agent",
                    "budget_optimizer_agent",
                ]
            },
        )

        a2a_messages.append(pricing_task.model_dump(mode="json"))

        pricing_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.PRICING_AGENT,
            task_message=pricing_task,
            title="Pricing Agent",
            description="Calculates itemized costs, buffer, and budget health.",
            coroutine=self._run_pricing_agent(
                trip_request=trip_request,
                selected_flight=selected_flight,
                selected_hotel=selected_hotel,
                activities=activities,
            ),
        )

        budget_breakdown = pricing_result["output"]["budget_breakdown"]

        a2a_messages.append(pricing_result["response_message"])
        agent_trace.append(pricing_result["trace"])
        execution_records.append(pricing_result["execution_record"])
        orchestration_logs.append(pricing_result["log"])

        itinerary_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.ITINERARY_AGENT,
            task_name="build_itinerary",
            payload={
                "request": request_payload,
                "selected_flight": selected_flight.model_dump(mode="json"),
                "selected_hotel": selected_hotel.model_dump(mode="json"),
                "weather": [item.model_dump(mode="json") for item in weather],
                "activities": [
                    activity.model_dump(mode="json") for activity in activities
                ],
                "budget_breakdown": budget_breakdown.model_dump(mode="json"),
            },
            metadata={
                "depends_on": [
                    "flight_agent",
                    "hotel_agent",
                    "weather_agent",
                    "activity_agent",
                    "pricing_agent",
                    "budget_optimizer_agent",
                ]
            },
        )

        a2a_messages.append(itinerary_task.model_dump(mode="json"))

        itinerary_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.ITINERARY_AGENT,
            task_message=itinerary_task,
            title="Itinerary Agent",
            description="Combines all agent outputs into a day-by-day travel plan.",
            coroutine=self._run_itinerary_agent(
                trip_request=trip_request,
                selected_flight=selected_flight,
                selected_hotel=selected_hotel,
                weather=weather,
                activities=activities,
                budget_breakdown=budget_breakdown,
            ),
        )

        itinerary = itinerary_result["output"]["itinerary"]

        a2a_messages.append(itinerary_result["response_message"])
        agent_trace.append(itinerary_result["trace"])
        execution_records.append(itinerary_result["execution_record"])
        orchestration_logs.append(itinerary_result["log"])

        booking_links = self._collect_booking_links(
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            activities=activities,
        )

        gemini_summary_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.GEMINI_SUMMARY_AGENT,
            task_name="generate_trip_summary",
            payload={
                "request": request_payload,
                "selected_hotel": selected_hotel.model_dump(mode="json"),
                "budget_breakdown": budget_breakdown.model_dump(mode="json"),
                "itinerary_days": len(itinerary),
                "warnings": [
                    log for log in orchestration_logs if "warning" in log.lower()
                ],
            },
            metadata={
                "depends_on": [
                    "route_validator_agent",
                    "budget_optimizer_agent",
                    "pricing_agent",
                    "itinerary_agent",
                ],
                "provider": "gemini",
                "fallback_enabled": True,
            },
        )

        a2a_messages.append(gemini_summary_task.model_dump(mode="json"))

        gemini_summary_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.GEMINI_SUMMARY_AGENT,
            task_message=gemini_summary_task,
            title="Gemini Summary Agent",
            description=(
                "Uses Gemini as an optional AI layer to create a polished "
                "user-facing trip summary with safe backend fallback."
            ),
            coroutine=self._run_gemini_summary_agent(
                trip_request=trip_request,
                selected_hotel=selected_hotel,
                budget_breakdown=budget_breakdown,
                itinerary=itinerary,
                orchestration_logs=orchestration_logs,
            ),
        )

        summary = gemini_summary_result["output"]["trip_summary"]

        a2a_messages.append(gemini_summary_result["response_message"])
        agent_trace.append(gemini_summary_result["trace"])
        execution_records.append(gemini_summary_result["execution_record"])
        orchestration_logs.append(gemini_summary_result["log"])
        orchestration_logs.append(gemini_summary_result["output"]["summary"])

        final_trip_plan = TripPlan(
            request=trip_request,
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            weather=weather,
            activities=activities,
            itinerary=itinerary,
            budget_breakdown=budget_breakdown,
            summary=summary,
            booking_links=booking_links,
        )

        orchestration_logs.append(
            "Final trip plan assembled with A2A messages, agent traces, "
            "budget breakdown, itinerary, Gemini summary, and booking links."
        )

        quality_gate_task = create_task_message(
            conversation_id=conversation_id,
            sender=AgentRole.ORCHESTRATOR,
            receiver=AgentRole.QUALITY_GATE_AGENT,
            task_name="review_final_plan",
            payload={
                "request": request_payload,
                "final_trip_plan": final_trip_plan.model_dump(mode="json"),
            },
            metadata={
                "depends_on": [
                    "flight_agent",
                    "hotel_agent",
                    "weather_agent",
                    "activity_agent",
                    "pricing_agent",
                    "itinerary_agent",
                    "budget_optimizer_agent",
                    "gemini_summary_agent",
                ],
                "priority": "critical",
            },
        )

        a2a_messages.append(quality_gate_task.model_dump(mode="json"))

        quality_gate_result = await self._execute_agent_task(
            conversation_id=conversation_id,
            agent=AgentRole.QUALITY_GATE_AGENT,
            task_message=quality_gate_task,
            title="Quality Gate Agent",
            description=(
                "Reviews the final trip plan for missing fields, invalid costs, "
                "budget consistency, itinerary completeness, and frontend safety."
            ),
            coroutine=self._run_quality_gate_agent(final_trip_plan),
        )

        quality_review = quality_gate_result["output"]["quality_review"]

        a2a_messages.append(quality_gate_result["response_message"])
        agent_trace.append(quality_gate_result["trace"])
        execution_records.append(quality_gate_result["execution_record"])
        orchestration_logs.append(quality_gate_result["log"])
        orchestration_logs.append(quality_review.summary)

        if quality_review.warnings:
            orchestration_logs.extend(
                [
                    f"Quality Gate warning: {warning}"
                    for warning in quality_review.warnings
                ]
            )

        if not quality_review.success:
            raise RuntimeError("; ".join(quality_review.warnings))

        return {
            "conversation_id": conversation_id,
            "summary": summary,
            "final_trip_plan": final_trip_plan.model_dump(mode="json"),
            "agent_outputs": {
                "route_validator": self._json_ready(route_validation_result["output"]),
                "flight": self._json_ready(flight_result["output"]),
                "hotel": self._json_ready(hotel_result["output"]),
                "weather": self._json_ready(weather_result["output"]),
                "activity": self._json_ready(activity_result["output"]),
                "budget_optimizer": self._json_ready(budget_optimizer_result["output"]),
                "pricing": self._json_ready(pricing_result["output"]),
                "itinerary": self._json_ready(itinerary_result["output"]),
                "gemini_summary": self._json_ready(gemini_summary_result["output"]),
                "quality_gate": self._json_ready(quality_gate_result["output"]),
            },
            "orchestration_logs": orchestration_logs,
            "a2a_messages": a2a_messages,
            "agent_trace": agent_trace,
            "execution_records": execution_records,
        }

    async def _execute_agent_task(
        self,
        *,
        conversation_id: str,
        agent: AgentRole,
        task_message: Any,
        title: str,
        description: str,
        coroutine: Any,
    ) -> Dict[str, Any]:
        started_at = utc_now()
        start_time = perf_counter()

        running_trace = create_trace_event(
            conversation_id=conversation_id,
            agent=agent,
            status=AgentStatus.RUNNING,
            title=title,
            description=description,
            input_summary=f"Task: {task_message.task_name}",
            metadata={
                "task_message_id": task_message.message_id,
                "task_name": task_message.task_name,
            },
        )

        output = await coroutine

        duration_ms = round((perf_counter() - start_time) * 1000, 2)
        completed_at = utc_now()

        completed_trace = create_trace_event(
            conversation_id=conversation_id,
            agent=agent,
            status=AgentStatus.COMPLETED,
            title=title,
            description=description,
            input_summary=f"Task: {task_message.task_name}",
            output_summary=output.get("summary", "Agent completed successfully."),
            metadata={
                "task_message_id": task_message.message_id,
                "task_name": task_message.task_name,
                "duration_ms": duration_ms,
            },
        )

        completed_trace.started_at = started_at
        completed_trace.completed_at = completed_at
        completed_trace.duration_ms = duration_ms

        response_message = create_result_message(
            conversation_id=conversation_id,
            sender=agent,
            receiver=AgentRole.ORCHESTRATOR,
            task_name=task_message.task_name,
            payload=self._json_ready(output),
            metadata={
                "status": AgentStatus.COMPLETED.value,
                "duration_ms": duration_ms,
                "request_message_id": task_message.message_id,
            },
        )

        execution_record = AgentExecutionRecord(
            trace=completed_trace,
            request_message=task_message,
            response_message=response_message,
        )

        return {
            "output": output,
            "running_trace": running_trace.model_dump(mode="json"),
            "trace": completed_trace.model_dump(mode="json"),
            "response_message": response_message.model_dump(mode="json"),
            "execution_record": execution_record.model_dump(mode="json"),
            "log": f"{title} completed task '{task_message.task_name}' in {duration_ms}ms.",
        }

    async def _run_route_validator_agent(
        self,
        trip_request: TripRequest,
    ) -> Dict[str, Any]:
        await asyncio.sleep(0)

        route_validation = self.route_validator_agent.validate(trip_request)

        return {
            "summary": route_validation.summary,
            "route_validation": route_validation,
            "warnings": route_validation.warnings,
            "confidence": route_validation.confidence,
            "metadata": route_validation.metadata,
        }

    async def _run_flight_agent(self, trip_request: TripRequest) -> Dict[str, Any]:
        await asyncio.sleep(0)

        flight_source, flight_destination = self._selected_flight_route(trip_request)

        selected_flight = FlightOption(
            airline=self._select_airline(trip_request),
            flight_number=self._select_flight_number(trip_request),
            source_city=flight_source,
            destination_city=flight_destination,
            departure_time="20:10",
            arrival_time="22:50",
            duration="2h 40m",
            price=self._estimate_flight_price(trip_request),
            booking_link=self._build_flight_search_link(trip_request),
        )

        return {
            "summary": (
                f"Selected {selected_flight.airline} flight "
                f"{selected_flight.flight_number}."
            ),
            "selected_flight": selected_flight,
            "ranked_options": [
                selected_flight.model_dump(mode="json"),
            ],
        }

    async def _run_hotel_agent(self, trip_request: TripRequest) -> Dict[str, Any]:
        await asyncio.sleep(0)

        planning_destination = self._planning_destination(trip_request)
        nights = max((trip_request.end_date - trip_request.start_date).days, 1)
        hotel_name = self._select_hotel_name(trip_request)
        price_per_night = self._estimate_hotel_price_per_night(trip_request)
        rating = self._select_hotel_rating(trip_request)

        selected_hotel = HotelOption(
            name=hotel_name,
            location=f"Near main attractions, {planning_destination}",
            rating=rating,
            nights=nights,
            price_per_night=price_per_night,
            total_price=price_per_night * nights,
            amenities=self._select_hotel_amenities(trip_request),
            booking_link=self._build_hotel_search_link(trip_request),
        )

        return {
            "summary": f"Selected {selected_hotel.name} for {nights} nights.",
            "selected_hotel": selected_hotel,
            "ranked_options": [
                selected_hotel.model_dump(mode="json"),
            ],
        }

    async def _run_weather_agent(self, trip_request: TripRequest) -> Dict[str, Any]:
        await asyncio.sleep(0)

        planning_destination = self._planning_destination(trip_request)
        weather: List[WeatherForecast] = []
        trip_days = self._trip_days(trip_request)

        for day_index in range(trip_days):
            current_date = trip_request.start_date + timedelta(days=day_index)
            condition = self._weather_condition_for_day(
                destination_city=planning_destination,
                day_index=day_index,
            )

            weather.append(
                WeatherForecast(
                    date=current_date,
                    condition=condition,
                    temperature_celsius=self._temperature_for_destination(
                        planning_destination,
                        day_index,
                    ),
                    travel_advice=self._weather_advice(condition),
                )
            )

        return {
            "summary": f"Generated {len(weather)} daily weather forecasts.",
            "weather": weather,
        }

    async def _run_activity_agent(self, trip_request: TripRequest) -> Dict[str, Any]:
        await asyncio.sleep(0)

        planning_destination = self._planning_destination(trip_request)
        activities: List[ActivityOption] = []

        interest_to_activity = {
            "beaches": (
                "Beach sunset experience",
                "beaches",
                1200,
                3,
                "Relaxed coastal experience with sunset views and local snacks.",
            ),
            "nightlife": (
                "Evening nightlife walk",
                "nightlife",
                1800,
                4,
                "Curated evening plan around popular safe nightlife areas.",
            ),
            "local food": (
                "Local food trail",
                "local food",
                1400,
                3,
                "Taste regional dishes through a guided food route.",
            ),
            "culture": (
                "Culture and heritage circuit",
                "culture",
                1600,
                4,
                "Museums, markets, architecture, and heritage areas.",
            ),
            "adventure": (
                "Adventure experience",
                "adventure",
                2500,
                5,
                "Outdoor activity matched to the destination and travel style.",
            ),
        }

        requested_interests = trip_request.interests or ["culture", "local food"]

        for interest in requested_interests:
            activity = interest_to_activity.get(interest)

            if not activity:
                continue

            name, category, cost, duration, description = activity

            if trip_request.travel_style == TravelStyle.PREMIUM:
                cost *= 1.35
                name = f"Premium {name}"

            activities.append(
                ActivityOption(
                    name=name,
                    category=category,
                    location=planning_destination,
                    estimated_cost=float(cost) * trip_request.travelers,
                    duration_hours=float(duration),
                    description=description,
                    booking_link=self._build_activity_search_link(
                        destination_city=planning_destination,
                        activity_name=name,
                    ),
                )
            )

        if not activities:
            activities.append(
                ActivityOption(
                    name="City highlights tour",
                    category="general",
                    location=planning_destination,
                    estimated_cost=1500 * trip_request.travelers,
                    duration_hours=4,
                    description="A balanced first-time route through key city highlights.",
                    booking_link=self._build_activity_search_link(
                        destination_city=planning_destination,
                        activity_name="city highlights tour",
                    ),
                )
            )

        return {
            "summary": f"Recommended {len(activities)} activities.",
            "activities": activities,
        }

    async def _run_budget_optimizer_agent(
        self,
        *,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activities: List[ActivityOption],
    ) -> Dict[str, Any]:
        await asyncio.sleep(0)

        budget_optimization = self.budget_optimizer_agent.optimize(
            trip_request=trip_request,
            selected_flight=selected_flight,
            selected_hotel=selected_hotel,
            activities=activities,
        )

        return {
            "summary": budget_optimization.summary,
            "budget_optimization": budget_optimization,
            "warnings": budget_optimization.warnings,
            "confidence": budget_optimization.confidence,
            "metadata": budget_optimization.metadata,
        }

    async def _run_pricing_agent(
        self,
        *,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activities: List[ActivityOption],
    ) -> Dict[str, Any]:
        await asyncio.sleep(0)

        trip_days = self._trip_days(trip_request)
        route_leg_count = max(len(trip_request.route_legs), 1)

        flights = selected_flight.price * trip_request.travelers * route_leg_count
        hotels = selected_hotel.total_price
        activity_total = sum(activity.estimated_cost for activity in activities)
        food = self._estimate_food_cost(trip_request, trip_days)
        local_transport = self._estimate_local_transport(trip_request, trip_days)

        subtotal = flights + hotels + activity_total + food + local_transport
        buffer_rate = 0.07 if self._is_domestic_india_trip(trip_request) else 0.1
        buffer = round(subtotal * buffer_rate, 2)
        total_estimated_cost = round(subtotal + buffer, 2)

        if (
            trip_request.budget > 0
            and total_estimated_cost > trip_request.budget
            and total_estimated_cost - trip_request.budget <= 50
        ):
            total_estimated_cost = round(float(trip_request.budget), 2)
            buffer = round(total_estimated_cost - subtotal, 2)

        remaining_budget = round(trip_request.budget - total_estimated_cost, 2)

        budget_breakdown = BudgetBreakdown(
            flights=round(flights, 2),
            hotels=round(hotels, 2),
            activities=round(activity_total, 2),
            food=round(food, 2),
            local_transport=round(local_transport, 2),
            buffer=buffer,
            total_estimated_cost=total_estimated_cost,
            remaining_budget=remaining_budget,
        )

        if remaining_budget < 0:
            budget_status = "over_budget"
        elif remaining_budget <= trip_request.budget * 0.1:
            budget_status = "tight_budget"
        else:
            budget_status = "healthy_budget"

        return {
            "summary": (
                f"Estimated total cost is {trip_request.currency} "
                f"{total_estimated_cost:,.0f}; budget status is {budget_status}."
            ),
            "budget_breakdown": budget_breakdown,
            "budget_status": budget_status,
        }

    async def _run_itinerary_agent(
        self,
        *,
        trip_request: TripRequest,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        weather: List[WeatherForecast],
        activities: List[ActivityOption],
        budget_breakdown: BudgetBreakdown,
    ) -> Dict[str, Any]:
        await asyncio.sleep(0)

        itinerary: List[ItineraryDay] = []
        trip_days = self._trip_days(trip_request)
        planning_destination = self._planning_destination(trip_request)

        daily_activity_cost = budget_breakdown.activities / trip_days if trip_days else 0
        daily_food_cost = budget_breakdown.food / trip_days if trip_days else 0
        daily_transport_cost = (
            budget_breakdown.local_transport / trip_days if trip_days else 0
        )

        for day_index in range(trip_days):
            current_date = trip_request.start_date + timedelta(days=day_index)
            weather_item = weather[min(day_index, len(weather) - 1)]
            activity = activities[day_index % len(activities)]
            travel_leg = self._travel_leg_for_date(trip_request, current_date)

            if travel_leg:
                title = f"Travel to {travel_leg.destination_city}"
                morning = f"Prepare to depart from {travel_leg.source_city}."
                afternoon = (
                    f"Travel from {travel_leg.source_city} to "
                    f"{travel_leg.destination_city} and settle in."
                )
                evening = (
                    f"Easy evening near {travel_leg.destination_city} after check-in or arrival."
                )
            elif day_index == trip_days - 1 and trip_request.trip_type == TripType.ONE_WAY:
                title = f"Final exploration in {planning_destination}"
                morning = f"Relaxed start near {selected_hotel.name}."
                afternoon = "Use the day for final sightseeing, shopping, or local food."
                evening = "Wrap up the trip comfortably."
            else:
                title = activity.name
                morning = "Start with a comfortable breakfast and local commute."
                afternoon = activity.description
                evening = "Dinner and flexible exploration based on energy levels."

            itinerary.append(
                ItineraryDay(
                    day=day_index + 1,
                    date=current_date,
                    title=title,
                    morning=morning,
                    afternoon=afternoon,
                    evening=evening,
                    estimated_cost=round(
                        daily_activity_cost + daily_food_cost + daily_transport_cost,
                        2,
                    ),
                    weather_note=weather_item.travel_advice,
                )
            )

        return {
            "summary": f"Built {len(itinerary)} itinerary days.",
            "itinerary": itinerary,
        }

    async def _run_gemini_summary_agent(
        self,
        *,
        trip_request: TripRequest,
        selected_hotel: HotelOption,
        budget_breakdown: BudgetBreakdown,
        itinerary: List[ItineraryDay],
        orchestration_logs: List[str],
    ) -> Dict[str, Any]:
        await asyncio.sleep(0)

        summary = await self.gemini_ai_service.generate_trip_summary(
            route_label=self._route_label(trip_request),
            trip_days=len(itinerary),
            travel_style=trip_request.travel_style.value,
            travelers=trip_request.travelers,
            currency=trip_request.currency,
            total_estimated_cost=budget_breakdown.total_estimated_cost,
            remaining_budget=budget_breakdown.remaining_budget,
            hotel_name=selected_hotel.name,
            interests=trip_request.interests,
            warnings=[
                log for log in orchestration_logs if "warning" in log.lower()
            ],
        )

        ai_status = self.gemini_ai_service.build_ai_status()

        return {
            "summary": (
                "Gemini Summary Agent generated the final user-facing trip summary."
                if ai_status["enabled"]
                else "Gemini Summary Agent used safe fallback summary because Gemini is disabled."
            ),
            "trip_summary": summary,
            "ai_status": ai_status,
        }

    async def _run_quality_gate_agent(self, trip_plan: TripPlan) -> Dict[str, Any]:
        await asyncio.sleep(0)

        quality_review = self.quality_gate_agent.review(trip_plan)

        return {
            "summary": quality_review.summary,
            "quality_review": quality_review,
            "warnings": quality_review.warnings,
            "confidence": quality_review.confidence,
            "metadata": quality_review.metadata,
        }

    def _trip_days(self, trip_request: TripRequest) -> int:
        return max((trip_request.end_date - trip_request.start_date).days + 1, 1)

    def _planning_destination(self, trip_request: TripRequest) -> str:
        if trip_request.trip_type == TripType.MULTI_CITY and trip_request.route_legs:
            return trip_request.route_legs[-1].destination_city
        return trip_request.destination_city

    def _selected_flight_route(self, trip_request: TripRequest) -> Tuple[str, str]:
        if trip_request.route_legs:
            return (
                trip_request.route_legs[0].source_city,
                trip_request.route_legs[0].destination_city,
            )

        return trip_request.source_city, trip_request.destination_city

    def _travel_leg_for_date(self, trip_request: TripRequest, current_date: date):
        for leg in trip_request.route_legs:
            if leg.travel_date == current_date:
                return leg

        return None

    def _route_label(self, trip_request: TripRequest) -> str:
        if trip_request.route_legs:
            route_parts = [trip_request.route_legs[0].source_city] + [
                leg.destination_city for leg in trip_request.route_legs
            ]
            return " → ".join(route_parts)

        return f"{trip_request.source_city} → {trip_request.destination_city}"

    def _estimate_flight_price(self, trip_request: TripRequest) -> float:
        source, destination = self._selected_flight_route(trip_request)
        route_price = self._route_flight_base_price(source, destination)

        style_multiplier = {
            TravelStyle.BUDGET: 0.88,
            TravelStyle.BALANCED: 1.0,
            TravelStyle.PREMIUM: 1.85,
        }[trip_request.travel_style]

        return round(route_price * style_multiplier, 2)

    def _estimate_hotel_price_per_night(self, trip_request: TripRequest) -> float:
        destination = self._planning_destination(trip_request)
        base_price = self._city_hotel_base_price(destination, trip_request.travel_style)
        rooms_needed = max((trip_request.travelers + 1) // 2, 1)

        return round(base_price * rooms_needed, 2)

    def _estimate_food_cost(self, trip_request: TripRequest, trip_days: int) -> float:
        normal_food = self._raw_food_cost(trip_request, trip_days)

        if trip_request.budget <= 0:
            return normal_food

        allocation = self._budget_allocation(trip_request)
        allowed_food = self._target_subtotal_budget(trip_request) * allocation["food"]
        minimum_food = self._minimum_food_cost(trip_request, trip_days)

        return round(min(normal_food, max(minimum_food, allowed_food)), 2)

    def _estimate_local_transport(
        self,
        trip_request: TripRequest,
        trip_days: int,
    ) -> float:
        normal_transport = self._raw_local_transport_cost(trip_request, trip_days)

        if trip_request.budget <= 0:
            return normal_transport

        allocation = self._budget_allocation(trip_request)
        allowed_transport = (
            self._target_subtotal_budget(trip_request) * allocation["local_transport"]
        )
        minimum_transport = self._minimum_local_transport_cost(trip_request, trip_days)

        return round(min(normal_transport, max(minimum_transport, allowed_transport)), 2)

    def _raw_food_cost(self, trip_request: TripRequest, trip_days: int) -> float:
        domestic = self._is_domestic_india_trip(trip_request)

        if domestic:
            daily_per_person = {
                TravelStyle.BUDGET: 550,
                TravelStyle.BALANCED: 850,
                TravelStyle.PREMIUM: 1800,
            }[trip_request.travel_style]
        else:
            daily_per_person = {
                TravelStyle.BUDGET: 1200,
                TravelStyle.BALANCED: 1800,
                TravelStyle.PREMIUM: 3500,
            }[trip_request.travel_style]

        return float(daily_per_person * trip_request.travelers * trip_days)

    def _raw_local_transport_cost(
        self,
        trip_request: TripRequest,
        trip_days: int,
    ) -> float:
        domestic = self._is_domestic_india_trip(trip_request)

        if domestic:
            daily_per_group = {
                TravelStyle.BUDGET: 450,
                TravelStyle.BALANCED: 700,
                TravelStyle.PREMIUM: 1800,
            }[trip_request.travel_style]
        else:
            daily_per_group = {
                TravelStyle.BUDGET: 1100,
                TravelStyle.BALANCED: 1700,
                TravelStyle.PREMIUM: 3500,
            }[trip_request.travel_style]

        return float(daily_per_group * trip_days)

    def _route_flight_base_price(self, source_city: str, destination_city: str) -> float:
        source = self._city_key(source_city)
        destination = self._city_key(destination_city)
        route = tuple(sorted((source, destination)))

        route_prices = {
            tuple(sorted(("kolkata", "bengaluru"))): 5200,
            tuple(sorted(("kolkata", "goa"))): 7200,
            tuple(sorted(("kolkata", "mumbai"))): 5600,
            tuple(sorted(("kolkata", "delhi"))): 5000,
            tuple(sorted(("kolkata", "chennai"))): 5900,
            tuple(sorted(("kolkata", "hyderabad"))): 5600,
            tuple(sorted(("kolkata", "pune"))): 6200,
            tuple(sorted(("kolkata", "jaipur"))): 6500,
            tuple(sorted(("bengaluru", "goa"))): 4200,
            tuple(sorted(("bengaluru", "mumbai"))): 4500,
            tuple(sorted(("bengaluru", "delhi"))): 6100,
            tuple(sorted(("bengaluru", "chennai"))): 3500,
            tuple(sorted(("bengaluru", "hyderabad"))): 3800,
            tuple(sorted(("bengaluru", "pune"))): 4300,
            tuple(sorted(("mumbai", "goa"))): 3600,
            tuple(sorted(("mumbai", "delhi"))): 5100,
            tuple(sorted(("mumbai", "chennai"))): 5200,
            tuple(sorted(("delhi", "goa"))): 7200,
            tuple(sorted(("delhi", "chennai"))): 6900,
            tuple(sorted(("delhi", "jaipur"))): 3400,
            tuple(sorted(("chennai", "goa"))): 5200,
            tuple(sorted(("hyderabad", "goa"))): 4500,
            tuple(sorted(("kolkata", "dubai"))): 14500,
            tuple(sorted(("bengaluru", "dubai"))): 16500,
            tuple(sorted(("mumbai", "dubai"))): 13500,
            tuple(sorted(("delhi", "dubai"))): 15500,
            tuple(sorted(("kolkata", "bangkok"))): 13000,
            tuple(sorted(("bengaluru", "bangkok"))): 15000,
            tuple(sorted(("kolkata", "singapore"))): 16000,
            tuple(sorted(("bengaluru", "singapore"))): 14500,
        }

        if route in route_prices:
            return float(route_prices[route])

        if self._is_india_city(source) and self._is_india_city(destination):
            return 5800.0

        return 15500.0

    def _city_hotel_base_price(
        self,
        destination_city: str,
        travel_style: TravelStyle,
    ) -> float:
        destination = self._city_key(destination_city)

        city_prices = {
            "bengaluru": {
                TravelStyle.BUDGET: 1900,
                TravelStyle.BALANCED: 3000,
                TravelStyle.PREMIUM: 7800,
            },
            "goa": {
                TravelStyle.BUDGET: 2300,
                TravelStyle.BALANCED: 4200,
                TravelStyle.PREMIUM: 9500,
            },
            "mumbai": {
                TravelStyle.BUDGET: 2800,
                TravelStyle.BALANCED: 5200,
                TravelStyle.PREMIUM: 11500,
            },
            "delhi": {
                TravelStyle.BUDGET: 2400,
                TravelStyle.BALANCED: 4300,
                TravelStyle.PREMIUM: 9800,
            },
            "kolkata": {
                TravelStyle.BUDGET: 1900,
                TravelStyle.BALANCED: 3300,
                TravelStyle.PREMIUM: 7800,
            },
            "chennai": {
                TravelStyle.BUDGET: 2100,
                TravelStyle.BALANCED: 3600,
                TravelStyle.PREMIUM: 8500,
            },
            "hyderabad": {
                TravelStyle.BUDGET: 2200,
                TravelStyle.BALANCED: 3600,
                TravelStyle.PREMIUM: 8500,
            },
            "pune": {
                TravelStyle.BUDGET: 2100,
                TravelStyle.BALANCED: 3500,
                TravelStyle.PREMIUM: 8200,
            },
            "jaipur": {
                TravelStyle.BUDGET: 1800,
                TravelStyle.BALANCED: 3300,
                TravelStyle.PREMIUM: 7800,
            },
            "dubai": {
                TravelStyle.BUDGET: 6500,
                TravelStyle.BALANCED: 11000,
                TravelStyle.PREMIUM: 23000,
            },
            "bangkok": {
                TravelStyle.BUDGET: 4200,
                TravelStyle.BALANCED: 7200,
                TravelStyle.PREMIUM: 14500,
            },
            "singapore": {
                TravelStyle.BUDGET: 7800,
                TravelStyle.BALANCED: 12500,
                TravelStyle.PREMIUM: 26000,
            },
        }

        fallback = {
            TravelStyle.BUDGET: 2200,
            TravelStyle.BALANCED: 4000,
            TravelStyle.PREMIUM: 9000,
        }

        return float(city_prices.get(destination, fallback)[travel_style])

    def _target_subtotal_budget(self, trip_request: TripRequest) -> float:
        buffer_rate = 0.07 if self._is_domestic_india_trip(trip_request) else 0.1
        return float(trip_request.budget) / (1 + buffer_rate)

    def _budget_allocation(self, trip_request: TripRequest) -> Dict[str, float]:
        if trip_request.trip_type == TripType.MULTI_CITY:
            return {
                "flights": 0.38,
                "hotels": 0.29,
                "activities": 0.09,
                "food": 0.14,
                "local_transport": 0.10,
            }

        if trip_request.trip_type == TripType.ROUND_TRIP:
            return {
                "flights": 0.31,
                "hotels": 0.34,
                "activities": 0.08,
                "food": 0.15,
                "local_transport": 0.12,
            }

        return {
            "flights": 0.23,
            "hotels": 0.39,
            "activities": 0.10,
            "food": 0.17,
            "local_transport": 0.11,
        }

    def _minimum_food_cost(self, trip_request: TripRequest, trip_days: int) -> float:
        if self._is_domestic_india_trip(trip_request):
            daily_per_person = {
                TravelStyle.BUDGET: 400,
                TravelStyle.BALANCED: 550,
                TravelStyle.PREMIUM: 1000,
            }[trip_request.travel_style]
        else:
            daily_per_person = {
                TravelStyle.BUDGET: 900,
                TravelStyle.BALANCED: 1300,
                TravelStyle.PREMIUM: 2200,
            }[trip_request.travel_style]

        return float(daily_per_person * trip_request.travelers * trip_days)

    def _minimum_local_transport_cost(
        self,
        trip_request: TripRequest,
        trip_days: int,
    ) -> float:
        if self._is_domestic_india_trip(trip_request):
            daily_per_group = {
                TravelStyle.BUDGET: 300,
                TravelStyle.BALANCED: 450,
                TravelStyle.PREMIUM: 1000,
            }[trip_request.travel_style]
        else:
            daily_per_group = {
                TravelStyle.BUDGET: 900,
                TravelStyle.BALANCED: 1300,
                TravelStyle.PREMIUM: 2800,
            }[trip_request.travel_style]

        return float(daily_per_group * trip_days)

    def _is_domestic_india_trip(self, trip_request: TripRequest) -> bool:
        if trip_request.route_legs:
            route_cities: List[str] = []

            for leg in trip_request.route_legs:
                route_cities.append(leg.source_city)
                route_cities.append(leg.destination_city)

            return all(self._is_india_city(city) for city in route_cities)

        return self._is_india_city(trip_request.source_city) and self._is_india_city(
            trip_request.destination_city
        )

    def _is_india_city(self, city: str) -> bool:
        return self._city_key(city) in {
            "kolkata",
            "bengaluru",
            "chennai",
            "delhi",
            "mumbai",
            "hyderabad",
            "goa",
            "pune",
            "jaipur",
        }

    def _city_key(self, city: str) -> str:
        value = str(city or "").strip().lower()

        aliases = {
            "bangalore": "bengaluru",
            "blr": "bengaluru",
            "calcutta": "kolkata",
            "ccu": "kolkata",
            "bombay": "mumbai",
            "bom": "mumbai",
            "new delhi": "delhi",
            "dxb": "dubai",
            "bkk": "bangkok",
            "sin": "singapore",
        }

        return aliases.get(value, value)

    def _select_airline(self, trip_request: TripRequest) -> str:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return "Vistara Luxe"

        if trip_request.travel_style == TravelStyle.BUDGET:
            return "IndiGo Smart"

        return "CloudJet"

    def _select_flight_number(self, trip_request: TripRequest) -> str:
        _, flight_destination = self._selected_flight_route(trip_request)
        destination_code = flight_destination[:2].upper()
        return f"CJ-{destination_code}902"

    def _select_hotel_name(self, trip_request: TripRequest) -> str:
        destination = self._planning_destination(trip_request)

        if trip_request.travel_style == TravelStyle.PREMIUM:
            return f"The Grand Meridian {destination}"

        if trip_request.travel_style == TravelStyle.BUDGET:
            return f"Urban Nest {destination}"

        return f"The Horizon {destination}"

    def _select_hotel_rating(self, trip_request: TripRequest) -> float:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return 4.7

        if trip_request.travel_style == TravelStyle.BUDGET:
            return 4.0

        return 4.4

    def _select_hotel_amenities(self, trip_request: TripRequest) -> List[str]:
        if trip_request.travel_style == TravelStyle.PREMIUM:
            return ["WiFi", "Breakfast", "Pool", "Spa", "Airport Transfer"]

        if trip_request.travel_style == TravelStyle.BUDGET:
            return ["WiFi", "Breakfast", "24x7 Desk"]

        return ["WiFi", "Breakfast", "Gym", "Airport Access"]

    def _weather_condition_for_day(
        self,
        *,
        destination_city: str,
        day_index: int,
    ) -> str:
        city = destination_city.lower()

        if city in {"goa", "mumbai", "chennai"}:
            pattern = ["Sunny", "Humid", "Partly Cloudy", "Sunny", "Light Rain"]
        elif city in {"bengaluru", "bangalore", "pune"}:
            pattern = ["Pleasant", "Cloudy", "Pleasant", "Light Rain", "Clear"]
        elif city == "dubai":
            pattern = ["Hot", "Sunny", "Hot", "Clear", "Sunny"]
        else:
            pattern = ["Clear", "Sunny", "Cloudy", "Pleasant", "Clear"]

        return pattern[day_index % len(pattern)]

    def _temperature_for_destination(
        self,
        destination_city: str,
        day_index: int,
    ) -> float:
        city = destination_city.lower()

        base_temperature = {
            "goa": 31,
            "bengaluru": 26,
            "bangalore": 26,
            "dubai": 36,
            "mumbai": 32,
            "delhi": 34,
            "kolkata": 33,
            "chennai": 33,
            "pune": 29,
        }.get(city, 30)

        return float(base_temperature + (day_index % 3))

    def _weather_advice(self, condition: str) -> str:
        condition_lower = condition.lower()

        if "rain" in condition_lower:
            return "Carry an umbrella and keep indoor backup plans ready."

        if "hot" in condition_lower or "sunny" in condition_lower:
            return "Use sunscreen, hydrate often, and avoid peak afternoon heat."

        if "humid" in condition_lower:
            return "Plan lighter outdoor activities and keep water handy."

        return "Weather looks comfortable for sightseeing and local exploration."

    def _collect_booking_links(
        self,
        *,
        selected_flight: FlightOption,
        selected_hotel: HotelOption,
        activities: List[ActivityOption],
    ) -> List[str]:
        links = [selected_flight.booking_link, selected_hotel.booking_link]

        for activity in activities:
            if activity.booking_link:
                links.append(activity.booking_link)

        return links

    def _build_summary(
        self,
        *,
        trip_request: TripRequest,
        selected_hotel: HotelOption,
        budget_breakdown: BudgetBreakdown,
        trip_days: int,
    ) -> str:
        budget_sentence = (
            "within the requested budget."
            if budget_breakdown.remaining_budget >= 0
            else "above the requested budget."
        )

        if trip_request.trip_type == TripType.MULTI_CITY:
            trip_label = "multi-city trip"
        elif trip_request.trip_type == TripType.ROUND_TRIP:
            trip_label = "round trip"
        else:
            trip_label = "trip"

        return (
            f"{trip_days}-day {trip_request.travel_style.value} {trip_label} across "
            f"{self._route_label(trip_request)} for {trip_request.travelers} traveler(s). "
            f"Stay is planned at {selected_hotel.name}. Estimated total cost is "
            f"{trip_request.currency} {budget_breakdown.total_estimated_cost:,.0f}, "
            f"which is {budget_sentence}"
        )

    def _build_flight_search_link(self, trip_request: TripRequest) -> str:
        route_text = self._route_label(trip_request).replace(" → ", " to ")

        return (
            "https://www.google.com/travel/flights?q="
            f"{route_text.replace(' ', '%20')}"
        )

    def _build_hotel_search_link(self, trip_request: TripRequest) -> str:
        destination = self._planning_destination(trip_request)

        return (
            "https://www.google.com/travel/hotels?q="
            f"hotels%20in%20{destination}"
        )

    def _build_activity_search_link(
        self,
        *,
        destination_city: str,
        activity_name: str,
    ) -> str:
        return (
            "https://www.google.com/search?q="
            f"{activity_name.replace(' ', '%20')}%20{destination_city}"
        )

    def _json_ready(self, value: Any) -> Any:
        if hasattr(value, "to_dict"):
            return value.to_dict()

        if hasattr(value, "model_dump"):
            return value.model_dump(mode="json")

        if isinstance(value, dict):
            return {key: self._json_ready(item) for key, item in value.items()}

        if isinstance(value, list):
            return [self._json_ready(item) for item in value]

        if isinstance(value, tuple):
            return [self._json_ready(item) for item in value]

        if isinstance(value, date):
            return value.isoformat()

        return value