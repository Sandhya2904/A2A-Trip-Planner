$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "A2A Trip Planner Project Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking Python..." -ForegroundColor Yellow
python --version

Write-Host ""
Write-Host "2. Checking backend tests..." -ForegroundColor Yellow
python -m pytest

Write-Host ""
Write-Host "3. Project URLs" -ForegroundColor Yellow
Write-Host "Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Backend Health: http://127.0.0.1:8000/api/health" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green

Write-Host ""
Write-Host "4. Useful commands" -ForegroundColor Yellow
Write-Host "Run backend:  .\scripts\run_backend.ps1"
Write-Host "Run frontend: .\scripts\run_frontend.ps1"
Write-Host "Run all dev:  .\scripts\dev.ps1"
Write-Host "Run tests:    .\scripts\run_tests.ps1"

Write-Host ""
Write-Host "Project check completed successfully." -ForegroundColor Green
Write-Host ""