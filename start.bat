@echo off
chcp 65001 >nul
title A Dark Room - Game Launcher

echo ===================================================
echo   Starting A Dark Room Web Game...
echo ===================================================

cd /d "%~dp0"

set NO_PROXY=localhost,127.0.0.1,192.168.*
set no_proxy=localhost,127.0.0.1,192.168.*

if not exist "node_modules" (
    echo Installing dependencies via npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

set LOCAL_IP=
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip

if "%LOCAL_IP%"=="" set LOCAL_IP=127.0.0.1

echo.
echo Server URL: http://%LOCAL_IP%:3000/
echo Opening browser...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://%LOCAL_IP%:3000/"

call npm run dev

pause
