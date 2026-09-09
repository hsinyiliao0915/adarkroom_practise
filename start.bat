@echo off
chcp 65001 >nul
title A Dark Room - Launcher

echo ===================================================
echo   Starting A Dark Room Web Game...
echo ===================================================

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Launching server at http://localhost:3000/
echo Opening browser without proxy...
echo.

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --no-proxy-server "http://localhost:3000/"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --no-proxy-server "http://localhost:3000/"
) else (
    start http://localhost:3000/
)

call npm run dev

pause
