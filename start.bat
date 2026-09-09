@echo off
chcp 65001 >nul
title A Dark Room - Game Launcher

echo ===================================================
echo   Starting A Dark Room Web Game...
echo ===================================================

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies via npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo Starting Vite dev server...
echo Opening browser: http://localhost:3000/
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/"

call npm run dev

pause
