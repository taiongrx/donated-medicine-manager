@echo off
chcp 65001 >nul
title ติดตั้ง Auto-start (Native Mode)
color 0B

echo ==============================================================================
echo   สร้างทางลัด Auto-start เมื่อเปิดเครื่อง Windows (Native Mode)
echo   โรงพยาบาลสมเด็จพระยุพราชสายบุรี
echo ==============================================================================
echo.

cd /d "%~dp0"
set TARGET_BAT=%~dp0run_native_windows.bat
set VBS_RUNNER=%~dp0run_silent.vbs

:: 1. สร้าง VBS สำหรับรันพื้นหลังโดยไม่แสดงหน้าต่างสีดำค้าง
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_RUNNER%"
echo WshShell.Run chr(34) ^& "%TARGET_BAT%" ^& chr(34), 0 >> "%VBS_RUNNER%"
echo Set WshShell = Nothing >> "%VBS_RUNNER%"

:: 2. สร้าง Shortcut ใน Startup Folder
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_DIR%\DonatedMedicineManager.lnk'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_RUNNER%\"'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Donated Medicine Manager Service'; $s.Save()"

:: 3. เปิด Firewall Port 8000 สำหรับเครือข่าย รพ.
netsh advfirewall firewall show rule name="Donated Medicine Manager (Port 8000)" >nul 2>nul
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="Donated Medicine Manager (Port 8000)" dir=in action=allow protocol=TCP localport=8000 >nul 2>nul
)

echo.
echo [OK] ติดตั้ง Auto-start สำเร็จ!
echo      ระบบจะเริ่มทำงานอัตโนมัติทุกครั้งที่เข้าสู่ระบบ Windows
echo.
pause
