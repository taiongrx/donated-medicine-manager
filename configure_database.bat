@echo off
rem Donated Medicine Manager - Database Configuration Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0configure_database.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Execution finished with code %errorlevel%.
    pause
)
