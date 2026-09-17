@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0\.."
title สำรองข้อมูลระบบคลังยาบริจาค - รพ.สมเด็จพระยุพราชสายบุรี

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_DIR=%CD%\backups\%TIMESTAMP%

mkdir "%BACKUP_DIR%" 2>nul

echo ==============================================================================
echo   Sai Buri Hospital - Donated Medicine System
echo   กำลังสำรองข้อมูลฐานข้อมูลและรายงาน (DRP Backup)
echo   วัน-เวลา: %DATE% %TIME%
echo ==============================================================================

if exist "donated_medicine.db" (
    echo   - กำลังสำรองฐานข้อมูล SQLite...
    copy "donated_medicine.db" "%BACKUP_DIR%\donated_medicine_%TIMESTAMP%.db" >nul
)

if exist ".env" (
    copy ".env" "%BACKUP_DIR%\env_%TIMESTAMP%.bak" >nul
)

if exist "secrets.toml" (
    copy "secrets.toml" "%BACKUP_DIR%\secrets_%TIMESTAMP%.bak" >nul
)

echo   - กำลังดึงสำเนา Stock Card CSV จากระบบ API...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/api/reports/stock-card/export' -OutFile '%BACKUP_DIR%\StockCard_%TIMESTAMP%.csv' } catch {}"

echo ==============================================================================
echo   สำรองข้อมูลสำเร็จเรียบร้อย!
echo   ตำแหน่งโฟลเดอร์สำรอง: %BACKUP_DIR%
echo ==============================================================================
pause
