@echo off
chcp 65001 >nul
title ระบบบริหารจัดการคลังยาบริจาค - Donated Medicine Manager (Native Mode)
color 0A

echo ==============================================================================
echo   ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)
echo   โรงพยาบาลสมเด็จพระยุพราชสายบุรี (รหัสหน่วยบริการ 11053)
echo   [โหมด Windows Native - ไม่ต้องใช้ Docker / ไม่ต้องเปิด Virtualization]
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. ตรวจสอบ Python
echo [1/5] กำลังตรวจสอบ Python บนเครื่อง...
set PYTHON_CMD=

where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    )
)

if "%PYTHON_CMD%"=="" (
    echo [!] ตรวจไม่พบ Python ในระบบ!
    echo [*] กำลังพยายามติดตั้ง Python 3.11 ผ่าน winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] ติดตั้ง Python สำเร็จ กรุณารัน run_native_windows.bat ใหม่อีกครั้ง
        pause
        exit /b 0
    ) else (
        echo [X] ไม่สามารถติดตั้ง Python อัตโนมัติได้
        echo.
        echo คำแนะนำ:
        echo 1. ดาวน์โหลด Python 3.11 ได้ที่: https://www.python.org/downloads/
        echo 2. ตอนติดตั้ง ต้องติ๊กถูกที่ช่อง [Add python.exe to PATH] ด้วยทุกครั้ง
        echo 3. เมื่อติดตั้งเสร็จแล้ว ให้เปิดไฟล์ run_native_windows.bat นี้ใหม่อีกครั้ง
        echo.
        start https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

%PYTHON_CMD% --version
echo [OK] พบ Python ในระบบเรียบร้อย
echo.

:: 2. ตรวจสอบ/สร้าง Virtual Environment
echo [2/5] กำลังตรวจสอบสภาพแวดล้อม Virtual Environment (.venv)...
if not exist ".venv" (
    echo [*] กำลังสร้าง Virtual Environment ใหม่...
    %PYTHON_CMD% -m venv .venv
    if %errorlevel% neq 0 (
        echo [!] ไม่สามารถสร้าง .venv ได้ จะใช้ Python หลักของระบบแทน
        set VENV_PYTHON=%PYTHON_CMD%
    ) else (
        set VENV_PYTHON=.venv\Scripts\python.exe
    )
) else (
    set VENV_PYTHON=.venv\Scripts\python.exe
)

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    set VENV_PYTHON=python
)
echo [OK] Virtual Environment พร้อมใช้งาน
echo.

:: 3. ติดตั้ง Dependencies (backend/requirements.txt)
echo [3/5] กำลังตรวจสอบและติดตั้ง Dependencies...
%VENV_PYTHON% -c "import fastapi, uvicorn, pymysql, sqlalchemy" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] กำลังดาวน์โหลดและติดตั้ง Dependencies (ใช้เวลาประมาณ 1-2 นาที)...
    %VENV_PYTHON% -m pip install --upgrade pip
    %VENV_PYTHON% -m pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [X] การติดตั้ง Dependencies ล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ติดตั้งครบถ้วนเรียบร้อย
echo.

:: 4. ตรวจสอบการตั้งค่า .env และ secrets.toml
echo [4/5] กำลังตรวจสอบไฟล์ตั้งค่าระบบ...
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo [OK] สร้างไฟล์ .env เริ่มต้นเรียบร้อย
    )
)
if not exist "secrets.toml" (
    if exist "secrets.toml.example" (
        copy /y "secrets.toml.example" "secrets.toml" >nul
        echo [OK] สร้างไฟล์ secrets.toml เริ่มต้นเรียบร้อย
    )
)

:: ตั้งค่า Default Port เป็น 8000 (เลี่ยงการชนกับ IIS/System บน Windows)
if "%PORT%"=="" set PORT=8000
if "%HOST%"=="" set HOST=0.0.0.0

echo [OK] ไฟล์คอนฟิกพร้อมใช้งาน (Port: %PORT%)
echo.

:: 5. ตรวจสอบฐานข้อมูลและเริ่มการทำงาน
echo [5/5] กำลังเตรียมฐานข้อมูลและเริ่มระบบ...
%VENV_PYTHON% -m backend.init_db

echo.
echo ==============================================================================
echo   ระบบพร้อมเปิดใช้งานแล้ว!
echo   URL เข้าใช้งาน: http://localhost:%PORT%
echo   (คอมพิวเตอร์เครื่องอื่นในเครือข่าย รพ. สามารถเข้าผ่าน http://IP-เครื่องนี้:%PORT%)
echo ==============================================================================
echo.
echo [*] กำลังเปิดเว็บเบราว์เซอร์อัตโนมัติใน 3 วินาที...
start "" "http://localhost:%PORT%"

:: รันเซิร์ฟเวอร์
%VENV_PYTHON% -m backend.main

pause
