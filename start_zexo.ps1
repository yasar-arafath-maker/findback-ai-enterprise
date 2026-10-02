# ZEXO / FindBack AI — Master Platform Launcher (PowerShell)
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "            ZEXO / FindBack AI — Master Platform Launcher               " -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

Write-Host "[1/3] Production Cloud Gateway: https://findback-ai-backend.onrender.com" -ForegroundColor Yellow
Write-Host "[2/3] Starting Backend Server (node server.js)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; node server.js"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Frontend Web Server (npm run dev)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "  SUCCESS! Backend Server & Frontend Web App are now running." -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
