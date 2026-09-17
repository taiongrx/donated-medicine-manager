@echo off
cd /d "%~dp0"
title ติดตั้งระบบคลังยาบริจาค - รพ.สมเด็จพระยุพราชสายบุรี

net session >nul 2>&1
if errorlevel 1 (
    echo ==============================================================================
    echo   [INFO] ขอสิทธิ์ Administrator เพื่อกำหนดค่า Firewall และติดตั้ง Service...
    echo ==============================================================================
    powershell -Command "Start-Process cmd -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

echo ==============================================================================
echo   ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)
echo   โรงพยาบาลสมเด็จพระยุพราชสายบุรี (รหัสหน่วยงาน: 10690)
echo ==============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
