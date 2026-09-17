@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0\.."
title กู้คืนระบบคลังยาบริจาค - รพ.สมเด็จพระยุพราชสายบุรี

echo ==============================================================================
echo   Sai Buri Hospital - DRP Restoration Utility
echo   โปรแกรมกู้คืนข้อมูลระบบคลังยาบริจาค
echo ==============================================================================

if not exist "%CD%\backups" (
    echo [ERROR] ไม่พบโฟลเดอร์ backups ในระบบ
    pause
    exit /b 1
)

echo ค้นหาชุดสำรองข้อมูลล่าสุด...
for /f "delims=" %%D in ('dir "%CD%\backups" /b /ad /o-d 2^>nul') do (
    set LATEST_DIR=%CD%\backups\%%D
    goto :found_backup
)

echo [ERROR] ไม่พบชุดข้อมูลสำรองในโฟลเดอร์ backups
pause
exit /b 1

:found_backup
echo.
echo ตรวจพบชุดข้อมูลสำรองล่าสุด: %LATEST_DIR%
echo.
set /p CONFIRM="คุณต้องการกู้คืนข้อมูลจากชุดสำรองนี้ใช่หรือไม่? (Y/N): "
if /i "%CONFIRM%" neq "Y" (
    echo ยกเลิกการกู้คืนข้อมูล
    pause
    exit /b 0
)

echo กำลังหยุดบริการ Docker Backend ชั่วคราว...
docker compose stop backend 2>nul

echo กำลังกู้คืนไฟล์ฐานข้อมูลและคอนฟิก...
for %%F in ("%LATEST_DIR%\*.db") do (
    copy "%%F" "%CD%\donated_medicine.db" >nul
    echo   + กู้คืนฐานข้อมูล SQLite สำเร็จ
)

for %%F in ("%LATEST_DIR%\env_*.bak") do (
    if not exist "%CD%\.env" copy "%%F" "%CD%\.env" >nul
)

for %%F in ("%LATEST_DIR%\secrets_*.bak") do (
    if not exist "%CD%\secrets.toml" copy "%%F" "%CD%\secrets.toml" >nul
)

echo กำลังเริ่มเปิดบริการ Backend อีกครั้ง...
docker compose start backend 2>nul

echo ==============================================================================
echo   กู้คืนข้อมูลเสร็จสิ้นเรียบร้อยแล้ว!
echo ==============================================================================
pause
