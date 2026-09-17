# UTF-8 with BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ติดตั้ง Auto-start (Native Mode)"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  สร้างทางลัด Auto-start เมื่อเปิดเครื่อง Windows (Native Mode)" -ForegroundColor Cyan
Write-Host "  โรงพยาบาลสมเด็จพระยุพราชสายบุรี" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Set-Location -Path $PSScriptRoot
$targetBat = Join-Path $PSScriptRoot "run_native_windows.bat"
$vbsRunner = Join-Path $PSScriptRoot "run_silent.vbs"

# 1. สร้าง VBS รันพื้นหลังแบบซ่อนหน้าต่างดำ
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$targetBat" & chr(34), 0
Set WshShell = Nothing
"@
[System.IO.File]::WriteAllText($vbsRunner, $vbsContent, [System.Text.Encoding]::ASCII)

# 2. สร้าง Shortcut ในโฟลเดอร์ Startup
$startupDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startupDir "DonatedMedicineManager.lnk"
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsRunner`""
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Donated Medicine Manager Service"
$shortcut.Save()

# 3. เปิด Firewall Port 8000
try {
    netsh advfirewall firewall show rule name="Donated Medicine Manager (Port 8000)" >$null 2>&1
    if ($LASTEXITCODE -ne 0) {
        netsh advfirewall firewall add rule name="Donated Medicine Manager (Port 8000)" dir=in action=allow protocol=TCP localport=8000 >$null 2>&1
    }
} catch {}

Write-Host "[OK] ติดตั้ง Auto-start สำเร็จเรียบร้อย!" -ForegroundColor Green
Write-Host "     ระบบจะทำงานอัตโนมัติในพื้นหลังทุกครั้งที่เข้าสู่ระบบ Windows" -ForegroundColor White
Write-Host ""
Read-Host "กด Enter เพื่อเสร็จสิ้น..."
