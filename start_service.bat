@echo off
cd /d "%~dp0"
title เริ่มทำงานระบบคลังยาบริจาค - รพ.สมเด็จพระยุพราชสายบุรี
echo ==============================================================================
echo   Sai Buri Crown Prince Hospital - Donated Medicine System
echo   กำลังเริ่มต้นการทำงานของบริการ Docker...
echo ==============================================================================

docker info >nul 2>&1
if errorlevel 1 (
    echo กำลังเปิดโปรแกรม Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :wait_docker
    ping -n 4 127.0.0.1 >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        echo รอให้ Docker Engine เริ่มทำงาน...
        goto wait_docker
    )
)

echo สั่งเปิดระบบด้วย Docker Compose...
docker compose up -d

echo ------------------------------------------------------------------------------
echo ระบบคลังยาบริจาคพร้อมทำงานบนเครือข่ายโรงพยาบาลแล้ว!
echo เข้าใช้งานผ่านเบราว์เซอร์: http://localhost
echo คู่มือ API Docs:         http://localhost:8000/docs
echo ------------------------------------------------------------------------------
