# UTF-8 with BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ตั้งค่าการเชื่อมต่อ HOSxP - Donated Medicine Manager"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  ตั้งค่าการเชื่อมต่อฐานข้อมูล HOSxP MySQL" -ForegroundColor Cyan
Write-Host "  โรงพยาบาลสมเด็จพระยุพราชสายบุรี (รหัสหน่วยบริการ 11053)" -ForegroundColor Cyan
Write-Host "  (กด Enter หากต้องการใช้ค่ามาตรฐานในวงเล็บ)" -ForegroundColor Gray
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Set-Location -Path $PSScriptRoot

$hHost = Read-Host "  1. HOSxP MySQL Host IP"
if (-not $hHost -or -not $hHost.Trim()) { $hHost = "192.168.0.251" } else { $hHost = $hHost.Trim() }

$hPort = Read-Host "  2. HOSxP MySQL Port"
if (-not $hPort -or -not $hPort.Trim()) { $hPort = "3306" } else { $hPort = $hPort.Trim() }

$hDb = Read-Host "  3. HOSxP Database Name"
if (-not $hDb -or -not $hDb.Trim()) { $hDb = "hos" } else { $hDb = $hDb.Trim() }

$hUser = Read-Host "  4. HOSxP Database User"
if (-not $hUser -or -not $hUser.Trim()) { $hUser = "sa" } else { $hUser = $hUser.Trim() }

$hPass = Read-Host "  5. HOSxP Database Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($hPass)
$hPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
if (-not $hPassPlain) { $hPassPlain = "sa" }

$dbUrl = "mysql+pymysql://${hUser}:${hPassPlain}@${hHost}:${hPort}/${hDb}"

# บันทึก secrets.toml
$secretsContent = @"
# Donated Medicine Manager Configuration
[database]
host = "$hHost"
port = $hPort
name = "$hDb"
user = "$hUser"
password = "$hPass"
driver = "mysql+pymysql"
url = "$dbUrl"

[system]
hospital_name = "โรงพยาบาลสมเด็จพระยุพราชสายบุรี"
hospital_code = "10690"
environment = "production"
"@
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "secrets.toml"), $secretsContent, [System.Text.Encoding]::UTF8)

# บันทึก .env
$envContent = @"
DATABASE_URL=$dbUrl
HOSXP_HOST=$hHost
HOSXP_PORT=$hPort
HOSXP_USER=$hUser
HOSXP_PASSWORD=$hPass
HOSXP_DB=$hDb
HOSPITAL_CODE=10690
HOSPITAL_NAME=โรงพยาบาลสมเด็จพระยุพราชสายบุรี
PORT=8000
HOST=0.0.0.0
"@
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot ".env"), $envContent, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "[OK] อัปเดตไฟล์ secrets.toml และ .env เรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "     Host: $hHost, DB: $hDb, User: $hUser" -ForegroundColor White
Write-Host ""
Read-Host "กด Enter เพื่อเสร็จสิ้น..."
