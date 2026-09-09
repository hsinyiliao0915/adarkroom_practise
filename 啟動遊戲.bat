@echo off
chcp 65001 >nul
title 小黑屋 (A Dark Room) - 遊戲啟動器

echo ===================================================
echo   正在啟動 小黑屋 (A Dark Room) 網頁遊戲...
echo ===================================================

cd /d "%~dp0"

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

echo.
echo 正在啟動 Vite 本機伺服器...
echo 遊戲網址：http://localhost:3000/
echo 正在以無代理模式開啟瀏覽器以繞過公司 Proxy...
echo.

:: 優先以 --no-proxy-server 開啟 Chrome，避免被公司 Squid Proxy (403) 與防火牆阻擋
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --no-proxy-server "http://localhost:3000/"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --no-proxy-server "http://localhost:3000/"
) else (
    start http://localhost:3000/
)

:: 啟動 Vite 開發伺服器
call npm run dev

pause
