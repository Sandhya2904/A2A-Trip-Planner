# A2A Trip Planner

A production-style, offline-first multi-agent travel planning platform.

This project accepts a travel request containing budget, destination, travel dates, travellers, interests, and travel style. It then coordinates multiple specialized agents through a central orchestrator to generate a structured itinerary, budget breakdown, booking/search links, agent logs, and exportable JSON output.

The system is designed to demonstrate real AI system design concepts such as agent boundaries, orchestration, shared state, provider abstraction, API design, persistence, validation, and frontend/backend integration.

---

## Project Goal

Most AI travel planner demos are simple prompt wrappers.

This project is different.

It focuses on building a real multi-agent architecture where each part of the travel planning process is separated into clear responsibilities:

- Flight planning
- Hotel selection
- Weather planning
- Activity recommendation
- Budget calculation
- Itinerary generation
- Saved trip plan management

The goal is to show how a full-stack agentic system can be structured like an industry-ready application.

---

## Tech Stack

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn
- Pytest
- Local JSON persistence

### Frontend

- React
- Vite
- Tailwind CSS
- Motion
- Lucide React

### Architecture Concepts

- Multi-agent orchestration
- A2A-style communication
- Service layer
- API route layer
- Schema layer
- Config layer
- Dependency injection
- Local storage abstraction
- Request validation
- Request ID tracing
- Structured logging
- Test coverage

---

## Features

### Trip Planning

- Accepts source city, destination city, dates, budget, currency, travellers, interests, and travel style
- Generates a full trip plan using specialized agents
- Produces a day-by-day itinerary
- Calculates detailed budget breakdown
- Provides booking/search links
- Returns raw agent outputs and orchestration logs

### Agent System

The backend includes the following logical agents:

- Trip Orchestrator
- Flight Agent
- Hotel Agent
- Weather Agent
- Activity Agent
- Pricing Agent
- Itinerary Agent

Each agent has a clear responsibility and contributes to the final trip plan.

### API Features

- Health check endpoint
- Agent registry endpoint
- Sample request endpoint
- Generate trip plan endpoint
- List saved trip plans endpoint
- Retrieve saved trip plan endpoint
- Delete saved trip plan endpoint
- Query filters for saved trip plans
- Centralized error handling
- Request ID middleware
- Request timing middleware

### Persistence

Generated trip plans are saved locally as JSON files in:

```txt
storage/trip_plans/