@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Donated Medicine System - Installer

net session >nul 2>&1
if errorlevel 1 (
    echo ==============================================================================
    echo   [INFO] Requesting Administrator Elevation for Firewall and Setup...
    echo ==============================================================================
    powershell.exe -NoProfile -Command "Start-Process cmd -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

echo ==============================================================================
echo   Donated Medicine Manager - OPD Pharmacy Server
echo   Sai Buri Crown Prince Hospital (Code: 10690)
echo ==============================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
