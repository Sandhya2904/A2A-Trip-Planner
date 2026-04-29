$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Starting A2A Trip Planner Frontend..." -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Green
Write-Host ""

Set-Location frontend
npm run dev -- --host localhost --port 5173 --strictPort