$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Starting A2A Trip Planner Backend..." -ForegroundColor Cyan
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""

uvicorn app.api.server:api --reload