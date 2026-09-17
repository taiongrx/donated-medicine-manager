# UTF-8 with BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ติดตั้งระบบขึ้นเครือข่าย Intranet - โรงพยาบาลสมเด็จพระยุพราชสายบุรี"

# ตรวจสอบและขอสิทธิ์ Administrator อัตโนมัติ (จำเป็นสำหรับการเปิด Firewall)
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[*] กำลังขอสิทธิ์ Administrator เพื่อเปิดพอร์ต Windows Firewall..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)" -ForegroundColor Cyan
Write-Host "  โรงพยาบาลสมเด็จพระยุพราชสายบุรี (รหัสหน่วยบริการ 11053)" -ForegroundColor Cyan
Write-Host "  [ติดตั้งและเปิดการเข้าถึงผ่านเครือข่าย Intranet โรงพยาบาล]" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Set-Location -Path $PSScriptRoot

# 1. ค้นหา IPv4 ของเครื่องเซิร์ฟเวอร์ในเครือข่ายโรงพยาบาล
Write-Host "[1/4] กำลังตรวจหา IP Address ของเครื่องในเครือข่าย รพ...." -ForegroundColor White
$ipList = @()
try {
    $ipList = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
               Where-Object { $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL" -and $_.IPAddress -notmatch "^169\.254\." -and $_.IPAddress -ne "127.0.0.1" }).IPAddress
} catch {}

if (-not $ipList -or $ipList.Count -eq 0) {
    # Fallback กรณี Get-NetIPAddress ใช้ไม่ได้
    $ipList = (Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled } | Select-Object -ExpandProperty IPAddress | Where-Object { $_ -match "^\d+\.\d+\.\d+\.\d+$" -and $_ -ne "127.0.0.1" })
}

$mainIp = if ($ipList) { $ipList[0] } else { "127.0.0.1" }
Write-Host "  + พบ IP Address ของเครื่อง: " -NoNewline -ForegroundColor White
Write-Host "$mainIp" -ForegroundColor Green
Write-Host ""

# 2. ปลดล็อก Windows Firewall ให้เครื่องลูกข่ายเข้าถึงได้
Write-Host "[2/4] กำลังเปิดพอร์ต Windows Firewall สำหรับเครือข่าย Intranet..." -ForegroundColor White

$ports = @(8000, 80)
foreach ($p in $ports) {
    $ruleName = "Donated Medicine Manager (Port $p)"
    try {
        netsh advfirewall firewall delete rule name="$ruleName" >$null 2>&1
        netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$p profile=any >$null 2>&1
        Write-Host "  + เปิดพอร์ต Inbound TCP $p สำเร็จ" -ForegroundColor Green
    } catch {
        Write-Host "  ! ไม่สามารถเปิดพอร์ต $p ผ่าน netsh ได้: $_" -ForegroundColor Yellow
    }
}
Write-Host ""

# 3. สร้างระบบ Auto-Start เมื่อเปิดเครื่อง (รันในพื้นหลังอัตโนมัติ)
Write-Host "[3/4] กำลังติดตั้งระบบ Auto-Start ให้ทำงานอัตโนมัติเมื่อเปิดเครื่อง..." -ForegroundColor White

$targetBat = Join-Path $PSScriptRoot "run_native_windows.bat"
$vbsRunner = Join-Path $PSScriptRoot "run_silent.vbs"

# สร้าง VBS สำหรับรันพื้นหลังโดยไม่แสดงหน้าต่างสีดำค้าง
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$targetBat" & chr(34), 0
Set WshShell = Nothing
"@
[System.IO.File]::WriteAllText($vbsRunner, $vbsContent, [System.Text.Encoding]::ASCII)

$startupDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startupDir "DonatedMedicineManager.lnk"
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsRunner`""
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Donated Medicine Manager Intranet Server"
$shortcut.Save()

Write-Host "  + สร้าง Startup Service เรียบร้อยแล้ว (ระบบจะเปิดตัวเองทุกครั้งที่เปิดเครื่อง)" -ForegroundColor Green
Write-Host ""

# 4. สร้างทางลัดบนหน้าจอ Desktop สำหรับเครื่องลูกข่าย (Client Shortcut)
Write-Host "[4/4] กำลังสร้างไฟล์ทางลัดสำหรับแจกจ่ายเครื่องลูกข่าย..." -ForegroundColor White
$desktopDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$clientUrlPath = Join-Path $desktopDir "ระบบคลังยาบริจาค (ห้องยานอก).url"

$urlContent = @"
[InternetShortcut]
URL=http://${mainIp}:8000
IconIndex=0
IconFile=C:\Windows\System32\shell32.dll
"@
[System.IO.File]::WriteAllText($clientUrlPath, $urlContent, [System.Text.Encoding]::UTF8)

$sharedUrlPath = Join-Path $PSScriptRoot "ระบบคลังยาบริจาค (เปิดบนเครื่องอื่น).url"
[System.IO.File]::WriteAllText($sharedUrlPath, $urlContent, [System.Text.Encoding]::UTF8)

Write-Host "  + สร้างไฟล์ทางลัดบน Desktop สำเร็จ: ระบบคลังยาบริจาค (ห้องยานอก).url" -ForegroundColor Green
Write-Host ""

# สรุปผลและแสดงวิธีเข้าใช้งาน
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  🚀 DEPLOY เข้า INTRANET สำเร็จเรียบร้อยแล้ว!" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  คอมพิวเตอร์ทุกเครื่องในเครือข่าย รพ.สมเด็จพระยุพราชสายบุรี สามารถใช้งานได้ทันที:" -ForegroundColor White
Write-Host ""
foreach ($ip in $ipList) {
    Write-Host "  👉 URL เข้าใช้งาน: " -NoNewline -ForegroundColor White
    Write-Host "http://${ip}:8000" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  คำแนะนำสำหรับเครื่องลูกข่าย (จุดจ่ายยา / โต๊ะคัดแยก):" -ForegroundColor White
Write-Host "  1. เปิด Google Chrome หรือ Microsoft Edge จากเครื่องใดก็ได้ใน รพ." -ForegroundColor Gray
Write-Host "  2. พิมพ์ URL ด้านบนลงในช่องที่อยู่เว็บ แล้วกด Enter" -ForegroundColor Gray
Write-Host "  3. หรือส่งไฟล์ 'ระบบคลังยาบริจาค (เปิดบนเครื่องอื่น).url' ไปวางที่หน้าจอเครื่องลูกข่าย" -ForegroundColor Gray
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

$ans = Read-Host "ต้องการเปิดเริ่มการทำงานของระบบเซิร์ฟเวอร์เดี๋ยวนี้เลยหรือไม่? (Y/N)"
if ($ans -eq "Y" -or $ans -eq "y" -or $ans -eq "") {
    Start-Process -FilePath $targetBat
}
