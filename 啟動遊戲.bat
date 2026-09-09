@echo off
chcp 65001 >nul
title 小黑屋 (A Dark Room) - 遊戲啟動器

echo ===================================================
echo   正在啟動 小黑屋 (A Dark Room) 網頁遊戲...
echo ===================================================

cd /d "%~dp0"

:: 繞過公司內部 Proxy，避免連線被 Squid 攔截
set NO_PROXY=localhost,127.0.0.1,192.168.*
set no_proxy=localhost,127.0.0.1,192.168.*

:: 檢查是否已安裝 node_modules
if not exist "node_modules" (
    echo 檢測到尚未安裝相依套件，正在執行 npm install...
    call npm install
    if errorlevel 1 (
        echo [錯誤] 套件安裝失敗，檢查網路連線或 Node.js 環境。
        pause
        exit /b 1
    )
)

:: 自動偵測本機區網 IP（避免 Proxy 阻擋 localhost）
set LOCAL_IP=
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip

if "%LOCAL_IP%"=="" set LOCAL_IP=127.0.0.1

echo.
echo 正在啟動伺服器...
echo 遊戲網址：http://%LOCAL_IP%:3000/
echo 稍後將自動為您開啟瀏覽器。
echo.

:: 延遲 2 秒後開啟瀏覽器
start "" cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://%LOCAL_IP%:3000/"

:: 啟動 Vite 開發伺服器
call npm run dev

pause
