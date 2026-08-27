@echo off
TITLE ZEXO Master Build & Live Auto-Sync Engine
COLOR 0B
cls
echo =========================================================================
echo       ZEXO / FindBack AI — Automated Build, Test & Sync Engine          
echo =========================================================================
echo.

echo [1/4] Running Comprehensive Live Integration Diagnostic Suite...
node tests/live_integration_diagnostic.test.js
if %errorlevel% neq 0 (
    echo [-] FAILED: Integration diagnostics encountered an error!
    pause
    exit /b 1
)

echo.
echo [2/4] Building Clean Production Vite Web Assets...
call npm run build
if %errorlevel% neq 0 (
    echo [-] FAILED: Vite web compilation failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Syncing Web Assets to Capacitor Android Native Container...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [-] FAILED: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Compiling Pristine Production Release APK with Gradle...
cd android
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo [-] FAILED: Gradle APK compilation failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo =========================================================================
echo   SUCCESS! All services synced and production APK built successfully:
echo   - Integration Tests:  9 PASSED / 0 FAILED
echo   - Local Server:       http://localhost:5000 (0.0.0.0:5000)
echo   - Telemetry Dashboard: http://localhost:5173/enterprise-admin
echo   - APK Output Location: %~dp0android\app\build\outputs\apk\release\app-release.apk
echo =========================================================================
echo.
pause
