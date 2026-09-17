@echo off
cd /d "%~dp0"
title ตั้งค่าระบบเริ่มทำงานอัตโนมัติ และ Firewall - รพ.สมเด็จพระยุพราชสายบุรี

net session >nul 2>&1
if errorlevel 1 (
    echo Requesting Administrator Elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

echo ==============================================================================
echo   Sai Buri Crown Prince Hospital - Donated Medicine Setup
echo   เปิดพอร์ต Windows Firewall และตั้งค่าเปิดระบบอัตโนมัติเมื่อเปิดเครื่อง
echo ==============================================================================

echo [1/2] กำลังตั้งค่า Windows Defender Firewall...
netsh advfirewall firewall delete rule name="Donated Medicine Web (Port 80)" >nul 2>&1
netsh advfirewall firewall delete rule name="Donated Medicine API (Port 8000)" >nul 2>&1
netsh advfirewall firewall add rule name="Donated Medicine Web (Port 80)" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Donated Medicine API (Port 8000)" dir=in action=allow protocol=TCP localport=8000
echo  + เปิดพอร์ต 80 (Web UI) และ 8000 (Backend API) สำเร็จ!

echo.
echo [2/2] กำลังสร้าง Shortcut ใน Windows Startup เพื่อเปิดบริการอัตโนมัติ...
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut([Environment]::GetFolderPath('Startup') + '\Start-Donated-Medicine.lnk');$s.TargetPath='%~dp0start_service.bat';$s.WorkingDirectory='%~dp0';$s.WindowStyle=7;$s.Save()"
echo  + ลงทะเบียนใน Windows Startup สำเร็จ!

echo ==============================================================================
echo   การตั้งค่าสำเร็จสมบูรณ์!
echo ==============================================================================
pause
