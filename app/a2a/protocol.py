from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    ROUTE_VALIDATOR_AGENT = "route_validator_agent"
    BUDGET_OPTIMIZER_AGENT = "budget_optimizer_agent"
    QUALITY_GATE_AGENT = "quality_gate_agent"
    USER_PROXY = "user_proxy"
    ORCHESTRATOR = "orchestrator"
    FLIGHT_AGENT = "flight_agent"
    HOTEL_AGENT = "hotel_agent"
    WEATHER_AGENT = "weather_agent"
    ACTIVITY_AGENT = "activity_agent"
    PRICING_AGENT = "pricing_agent"
    ITINERARY_AGENT = "itinerary_agent"
    GEMINI_SUMMARY_AGENT = "gemini_summary_agent"


class MessageType(str, Enum):
    REQUEST = "request"
    TASK = "task"
    RESULT = "result"
    ERROR = "error"
    STATUS = "status"


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class A2AMessage(BaseModel):
    """
    Structured agent-to-agent message.

    This is the core protocol object passed between the orchestrator and agents.
    It makes the system more explainable and closer to real agentic architecture.
    """

    message_id: str = Field(default_factory=lambda: str(uuid4()))
    conversation_id: str
    sender: AgentRole
    receiver: AgentRole
    message_type: MessageType
    task_name: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class AgentTraceEvent(BaseModel):
    """
    A timeline event used for debugging, UI visualization, and demos.
    """

    event_id: str = Field(default_factory=lambda: str(uuid4()))
    conversation_id: str
    agent: AgentRole
    status: AgentStatus
    title: str
    description: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentExecutionRecord(BaseModel):
    """
    Complete execution record for one agent call.
    """

    trace: AgentTraceEvent
    request_message: Optional[A2AMessage] = None
    response_message: Optional[A2AMessage] = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_task_message(
    *,
    conversation_id: str,
    sender: AgentRole,
    receiver: AgentRole,
    task_name: str,
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> A2AMessage:
    """
    Helper for creating task messages between agents.
    """

    return A2AMessage(
        conversation_id=conversation_id,
        sender=sender,
        receiver=receiver,
        message_type=MessageType.TASK,
        task_name=task_name,
        payload=payload,
        metadata=metadata or {},
    )


def create_result_message(
    *,
    conversation_id: str,
    sender: AgentRole,
    receiver: AgentRole,
    task_name: str,
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> A2AMessage:
    """
    Helper for creating result messages between agents.
    """

    return A2AMessage(
        conversation_id=conversation_id,
        sender=sender,
        receiver=receiver,
        message_type=MessageType.RESULT,
        task_name=task_name,
        payload=payload,
        metadata=metadata or {},
    )


def create_trace_event(
    *,
    conversation_id: str,
    agent: AgentRole,
    status: AgentStatus,
    title: str,
    description: str,
    input_summary: Optional[str] = None,
    output_summary: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AgentTraceEvent:
    """
    Helper for creating workflow trace events.
    """

    timestamp = utc_now()

    return AgentTraceEvent(
        conversation_id=conversation_id,
        agent=agent,
        status=status,
        title=title,
        description=description,
        input_summary=input_summary,
        output_summary=output_summary,
        started_at=timestamp if status == AgentStatus.RUNNING else None,
        completed_at=timestamp if status in {AgentStatus.COMPLETED, AgentStatus.FAILED} else None,
        metadata=metadata or {},
    )