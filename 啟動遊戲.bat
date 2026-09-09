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
    if %errorlevel% neq 0 (
        echo [錯誤] 套件安裝失敗，檢查網路連線或 Node.js 環境。
        pause
        exit /b %errorlevel%
    )
)

echo.
echo 正在啟動 Vite 本機開發伺服器...
echo 稍後將自動開啟瀏覽器：http://localhost:3000/
echo.

:: 延遲 2 秒後在背景開啟瀏覽器
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/"

:: 啟動 Vite 開發伺服器
call npm run dev

pause
