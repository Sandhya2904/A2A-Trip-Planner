from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    """
    Defines every agent in the system.

    Each agent has a clear boundary.
    Agents do not randomly call each other.
    They communicate through structured A2A messages.
    """

    USER = "user"
    ORCHESTRATOR = "orchestrator"
    FLIGHT_AGENT = "flight_agent"
    HOTEL_AGENT = "hotel_agent"
    WEATHER_AGENT = "weather_agent"
    ACTIVITY_AGENT = "activity_agent"
    PRICING_AGENT = "pricing_agent"
    ITINERARY_AGENT = "itinerary_agent"


class MessageType(str, Enum):
    """
    Defines why one agent is talking to another agent.
    """

    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    STATUS_UPDATE = "status_update"
    ERROR = "error"
    FINAL_PLAN = "final_plan"


class TaskStatus(str, Enum):
    """
    Tracks the state of each task.
    """

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class A2AMessage(BaseModel):
    """
    Standard message object used by all agents.

    This gives our project a clean agent-to-agent communication protocol.
    """

    message_id: str = Field(default_factory=lambda: str(uuid4()))
    conversation_id: str
    sender: AgentRole
    receiver: AgentRole
    message_type: MessageType
    task_name: str
    status: TaskStatus = TaskStatus.PENDING
    payload: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def mark_running(self) -> "A2AMessage":
        self.status = TaskStatus.RUNNING
        return self

    def mark_completed(self) -> "A2AMessage":
        self.status = TaskStatus.COMPLETED
        return self

    def mark_failed(self, error: str) -> "A2AMessage":
        self.status = TaskStatus.FAILED
        self.message_type = MessageType.ERROR
        self.error = error
        return self

    def to_pretty_json(self) -> str:
        return self.model_dump_json(indent=2)


def create_task_message(
    conversation_id: str,
    sender: AgentRole,
    receiver: AgentRole,
    task_name: str,
    payload: Dict[str, Any],
) -> A2AMessage:
    """
    Helper function to create a task request message.
    """

    return A2AMessage(
        conversation_id=conversation_id,
        sender=sender,
        receiver=receiver,
        message_type=MessageType.TASK_REQUEST,
        task_name=task_name,
        payload=payload,
        status=TaskStatus.PENDING,
    )