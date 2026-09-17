@echo off
title Donated Medicine System - Docker Launcher
echo ==============================================================================
echo   โรงพยาบาลสมเด็จพระยุพราชสายบุรี - ระบบคลังยาบริจาค (Docker Launcher)
echo ==============================================================================
echo กำลังเริ่มต้น Containers ด้วย Docker Compose...
docker compose up --build -d
echo.
echo ==============================================================================
echo   บริการพร้อมทำงานแล้ว:
echo   - หน้าต่างระบบห้องยานอก (Web UI): http://localhost
echo   - เอกสาร Backend API Docs:         http://localhost:8000/docs
echo   - ตรวจสอบสถานะ (Health Probe):      http://localhost:8000/healthz
echo ==============================================================================
pause
