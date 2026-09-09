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

set "GAME_URL=http://127.0.0.1:3000/"

echo.
echo Starting Vite server...
start "A Dark Room Vite Server" /D "%~dp0" cmd /k "npm run dev"

echo Waiting for the server...
powershell -NoProfile -Command "Start-Sleep -Seconds 3"

echo Server ready: %GAME_URL%
echo Opening browser without proxy...

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --no-proxy-server "%GAME_URL%"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --no-proxy-server "%GAME_URL%"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --no-proxy-server "%GAME_URL%"
) else (
    start "" "%GAME_URL%"
)

exit /b 0
