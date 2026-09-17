@echo off
rem Donated Medicine Manager - Native Windows Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_native_windows.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Execution finished with code %errorlevel%.
    pause
)
