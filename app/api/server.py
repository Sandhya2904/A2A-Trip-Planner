from __future__ import annotations

from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_routes import router as ai_router
from app.api.auth_routes import router as auth_router
from app.api.error_handlers import register_error_handlers
from app.api.routes import router
from app.core.config import settings
from app.core.logging_config import configure_logging, get_logger


configure_logging()

logger = get_logger("a2a_trip_planner.api")


@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Application lifecycle handler.

    This replaces scattered startup/shutdown logic and keeps app bootstrapping
    clean for local development, testing, and future deployment.
    """

    logger.info("%s v%s started", settings.app_name, settings.app_version)
    logger.info("Docs available at %s", settings.docs_url)

    yield

    logger.info("%s shutdown complete", settings.app_name)


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Keeping app creation inside a factory makes the backend easier to test,
    configure, and deploy.
    """

    application = FastAPI(
        title=settings.app_name,
        description=settings.description,
        version=settings.app_version,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        """
        Add request tracing and timing.

        Every response gets:
        - X-Request-ID
        - X-Process-Time

        This makes the backend easier to debug and more production-like.
        """

        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        request.state.request_id = request_id

        start_time = perf_counter()

        response = await call_next(request)

        process_time = perf_counter() - start_time

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}"

        logger.info(
            "request_id=%s | %s %s -> %s in %.4fs",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )

        return response

    register_error_handlers(application)

    application.include_router(router)
    application.include_router(auth_router)
    application.include_router(ai_router)

    return application


api = create_app()