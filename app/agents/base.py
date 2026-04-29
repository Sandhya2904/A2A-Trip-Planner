from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from app.a2a.messages import (
    A2AMessage,
    AgentRole,
    MessageType,
    TaskStatus,
)


class BaseAgent(ABC):
    """
    Base class for every specialized agent in the system.

    This class gives all agents the same behavior:
    - receive an A2A message
    - validate the receiver
    - run the actual task
    - return a structured A2A response
    - handle errors safely
    """

    def __init__(self, role: AgentRole, name: str, description: str) -> None:
        self.role = role
        self.name = name
        self.description = description

    async def handle_message(self, message: A2AMessage) -> A2AMessage:
        """
        Main entry point for all agents.
        """

        if message.receiver != self.role:
            return self._create_error_response(
                original_message=message,
                error=f"{self.name} cannot handle message for {message.receiver.value}",
            )

        try:
            message.mark_running()
            result = await self.execute(message.payload)

            return A2AMessage(
                conversation_id=message.conversation_id,
                sender=self.role,
                receiver=message.sender,
                message_type=MessageType.TASK_RESPONSE,
                task_name=message.task_name,
                status=TaskStatus.COMPLETED,
                payload=result,
            )

        except Exception as exc:
            return self._create_error_response(
                original_message=message,
                error=str(exc),
            )

    @abstractmethod
    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Every specialized agent must implement this method.

        Example:
        - FlightAgent searches flights
        - HotelAgent searches hotels
        - WeatherAgent checks weather
        - PricingAgent calculates total cost
        """

        raise NotImplementedError

    def _create_error_response(
        self,
        original_message: A2AMessage,
        error: str,
    ) -> A2AMessage:
        """
        Creates a safe structured error message.
        """

        return A2AMessage(
            conversation_id=original_message.conversation_id,
            sender=self.role,
            receiver=original_message.sender,
            message_type=MessageType.ERROR,
            task_name=original_message.task_name,
            status=TaskStatus.FAILED,
            payload={},
            error=error,
        )