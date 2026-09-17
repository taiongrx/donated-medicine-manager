@echo off
rem Donated Medicine Manager - Deploy to Intranet Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy_intranet.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Execution halted with code %errorlevel%.
    pause
)
