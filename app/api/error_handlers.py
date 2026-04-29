from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging_config import get_logger


logger = get_logger("a2a_trip_planner.errors")


def register_error_handlers(api: FastAPI) -> None:
    """
    Register centralized API error handlers.

    This keeps validation and unexpected-error responses consistent across the
    backend while preserving the normal route-level HTTPException behavior.
    """

    @api.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")

        logger.warning(
            "request_id=%s | validation_error | path=%s | errors=%s",
            request_id,
            request.url.path,
            exc.errors(),
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": {
                    "success": False,
                    "message": "Request validation failed.",
                    "error": _format_validation_error(exc),
                    "request_id": request_id,
                }
            },
        )

    @api.exception_handler(Exception)
    async def unexpected_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")

        logger.exception(
            "request_id=%s | unexpected_error | path=%s | error=%s",
            request_id,
            request.url.path,
            str(exc),
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": {
                    "success": False,
                    "message": "Unexpected backend error.",
                    "error": str(exc),
                    "request_id": request_id,
                }
            },
        )


def _format_validation_error(exc: RequestValidationError) -> str:
    """
    Convert FastAPI/Pydantic validation errors into a readable string.
    """

    messages: list[str] = []

    for error in exc.errors():
        location = ".".join(str(part) for part in error.get("loc", []))
        message = error.get("msg", "Invalid value")

        if location:
            messages.append(f"{location}: {message}")
        else:
            messages.append(message)

    return " | ".join(messages)