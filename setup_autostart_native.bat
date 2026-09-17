@echo off
rem Donated Medicine Manager - Setup Autostart Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_autostart_native.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Execution finished with code %errorlevel%.
    pause
)
