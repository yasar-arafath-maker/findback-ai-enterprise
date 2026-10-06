@echo off
TITLE ZEXO Master Platform Launcher - Backend Server & Web App
COLOR 0A
cls
echo =========================================================================
echo             ZEXO / FindBack AI - Master Platform Launcher               
echo =========================================================================
echo.
echo [1/3] Checking Node.js Environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [-] ERROR: Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

echo [+] Node.js Environment Verified.
echo.
echo [2/3] Starting Local Backend Server Persistence Engine (Port 5000)...
start "ZEXO Backend Persistence Server (Port 5000)" cmd /k "cd /d %~dp0 && node server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Vite Local Frontend Web Server...
start "ZEXO Frontend Web Server (Vite)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo =========================================================================
echo   SUCCESS! Both ZEXO Services are launching in parallel:
echo   - Backend Server:  https://findback-ai-backend.onrender.com
echo   - Local File DB:   %~dp0local_db.json
echo   - Frontend Web App: Check terminal window for Vite port
echo =========================================================================
echo.
pause
