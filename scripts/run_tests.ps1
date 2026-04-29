$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Running A2A Trip Planner Backend Tests..." -ForegroundColor Cyan
Write-Host ""

python -m pytest

Write-Host ""
Write-Host "All tests completed." -ForegroundColor Green
Write-Host ""