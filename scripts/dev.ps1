$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Launching A2A Trip Planner Full Stack Dev Environment..." -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting backend in a new PowerShell window..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd `"$ProjectRoot`"; .\scripts\run_backend.ps1"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend in a new PowerShell window..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd `"$ProjectRoot`"; .\scripts\run_frontend.ps1"
)

Write-Host ""
Write-Host "Full stack dev environment launched." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend:     http://localhost:5173" -ForegroundColor Green
Write-Host ""