from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class AgentResult:
    """
    Standard result object returned by stronger backend agents.

    This keeps every agent output consistent:
    - success/failure
    - main data payload
    - readable summary
    - warnings
    - confidence score
    - metadata for debugging
    """

    success: bool
    summary: str
    data: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    confidence: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "summary": self.summary,
            "data": self.data,
            "warnings": self.warnings,
            "confidence": self.confidence,
            "metadata": self.metadata,
        }


class BaseTravelAgent:
    """
    Base class for all travel planning agents.

    Every specialized agent should define:
    - name
    - role
    - responsibility
    """

    name: str = "Base Travel Agent"
    role: str = "base_agent"
    responsibility: str = "Base agent responsibility."

    def success(
        self,
        *,
        summary: str,
        data: Dict[str, Any] | None = None,
        warnings: List[str] | None = None,
        confidence: float = 1.0,
        metadata: Dict[str, Any] | None = None,
    ) -> AgentResult:
        return AgentResult(
            success=True,
            summary=summary,
            data=data or {},
            warnings=warnings or [],
            confidence=confidence,
            metadata=metadata or {},
        )

    def failure(
        self,
        *,
        summary: str,
        warnings: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
    ) -> AgentResult:
        return AgentResult(
            success=False,
            summary=summary,
            data={},
            warnings=warnings or [],
            confidence=0.0,
            metadata=metadata or {},
        )