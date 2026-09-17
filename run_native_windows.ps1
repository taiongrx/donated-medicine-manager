﻿# UTF-8 with BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ระบบบริหารจัดการคลังยาบริจาค - Donated Medicine Manager (Native Mode)"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)" -ForegroundColor Cyan
Write-Host "  โรงพยาบาลสมเด็จพระยุพราชสายบุรี (รหัสหน่วยบริการ 11053)" -ForegroundColor Cyan
Write-Host "  [โหมด Windows Native - ไม่ต้องใช้ Docker / ไม่ต้องเปิด Virtualization]" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Set-Location -Path $PSScriptRoot

# ฟังก์ชันตรวจสอบว่าคำสั่งเป็น Python ตัวจริง ไม่ใช่ Alias ของ Microsoft Store
function Test-RealPython($exePath) {
    if (-not $exePath) { return $false }
    try {
        $ver = & $exePath -c "import sys; print(sys.version_info[0])" 2>$null
        if ($LASTEXITCODE -eq 0 -and "$ver".Trim() -eq "3") {
            return $true
        }
    } catch {}
    return $false
}

# 1. ตรวจสอบ Python
Write-Host "[1/5] กำลังตรวจสอบ Python บนเครื่อง..." -ForegroundColor White

$pythonCmd = $null
$candidatePaths = @(
    "python",
    "py",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "C:\Program Files\Python311\python.exe",
    "C:\Program Files\Python312\python.exe",
    "C:\Program Files\Python310\python.exe"
)

foreach ($cand in $candidatePaths) {
    if (Test-RealPython $cand) {
        $pythonCmd = $cand
        break
    }
}

if (-not $pythonCmd) {
    Write-Host "[!] ไม่พบ Python ตัวจริงบนเครื่อง (หรือพบเฉพาะทางลัด Microsoft Store)" -ForegroundColor Yellow
    Write-Host "[*] กำลังดาวน์โหลดตัวติดตั้ง Python 3.11 จาก python.org อัตโนมัติ..." -ForegroundColor Cyan
    
    $installerUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    $installerPath = "$env:TEMP\python-3.11.9-amd64.exe"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host "    กำลังดาวน์โหลด: $installerUrl" -ForegroundColor Gray
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        
        Write-Host "[*] กำลังติดตั้ง Python 3.11 (เปิดหน้าต่างติดตั้งอัตโนมัติ กรุณารอสักครู่)..." -ForegroundColor Yellow
        Start-Process -FilePath $installerPath -ArgumentList "/passive", "PrependPath=1", "Include_pip=1" -Wait
        
        # อัปเดต PATH ในเซสชันปัจจุบัน
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        foreach ($cand in $candidatePaths) {
            if (Test-RealPython $cand) {
                $pythonCmd = $cand
                break
            }
        }
    } catch {
        Write-Host "[!] ดาวน์โหลดอัตโนมัติไม่สำเร็จ: $_" -ForegroundColor Red
    }

    if (-not $pythonCmd) {
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Red
        Write-Host "  กรุณาติดตั้ง Python 3.11 ด้วยตนเอง:" -ForegroundColor Yellow
        Write-Host "  1. ตัวติดตั้งถูกโหลดไว้ที่: $installerPath" -ForegroundColor White
        Write-Host "  2. หากยังไม่มี ให้เปิดเว็บ https://www.python.org/downloads/" -ForegroundColor White
        Write-Host "  3. สำคัญที่สุด: ในหน้าแรกของตัวติดตั้ง ให้ติ๊กถูก [Add python.exe to PATH]" -ForegroundColor Yellow
        Write-Host "  4. ติดตั้งเสร็จแล้ว ให้รัน run_native_windows.bat ใหม่อีกครั้ง" -ForegroundColor White
        Write-Host "==============================================================================" -ForegroundColor Red
        Write-Host ""
        if (Test-Path $installerPath) {
            Start-Process $installerPath
        } else {
            Start-Process "https://www.python.org/downloads/"
        }
        Read-Host "กด Enter เมื่อติดตั้งเสร็จสิ้นเพื่อดำเนินการต่อ..."
        exit 1
    }
}

$pyVer = & $pythonCmd --version 2>&1
Write-Host "[OK] พบ Python ในระบบ: $pyVer ($pythonCmd)" -ForegroundColor Green
Write-Host ""

# 2. Virtual Environment (.venv)
Write-Host "[2/5] กำลังเตรียมสภาพแวดล้อม Virtual Environment (.venv)..." -ForegroundColor White
$venvPython = ""
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[*] กำลังสร้าง .venv..." -ForegroundColor Gray
    & $pythonCmd -m venv .venv
}

if (Test-Path ".venv\Scripts\python.exe") {
    $venvPython = "$PSScriptRoot\.venv\Scripts\python.exe"
} else {
    $venvPython = $pythonCmd
}
Write-Host "[OK] สภาพแวดล้อม Python พร้อมใช้งาน ($venvPython)" -ForegroundColor Green
Write-Host ""

# 3. ติดตั้ง Dependencies
Write-Host "[3/5] กำลังตรวจสอบและติดตั้ง Dependencies..." -ForegroundColor White
$checkImports = & $venvPython -c "import fastapi, uvicorn, pymysql, sqlalchemy" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[*] กำลังดาวน์โหลดและติดตั้ง Dependencies (ใช้เวลาประมาณ 1-2 นาที)..." -ForegroundColor Yellow
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r backend/requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] การติดตั้ง Dependencies ล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต" -ForegroundColor Red
        Read-Host "กด Enter เพื่อปิด..."
        exit 1
    }
}
Write-Host "[OK] Dependencies ติดตั้งครบถ้วนเรียบร้อย" -ForegroundColor Green
Write-Host ""

# 4. ตั้งค่าการเชื่อมต่อฐานข้อมูล (secrets.toml & .env)
Write-Host "[4/5] ตรวจสอบไฟล์ตั้งค่าระบบ..." -ForegroundColor White

$needConfig = $false
if (-not (Test-Path "secrets.toml")) {
    $needConfig = $true
} else {
    $content = Get-Content "secrets.toml" -Raw
    if ($content -match "YOUR_HOSXP_PASSWORD") {
        $needConfig = $true
    }
}

if ($needConfig) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Yellow
    Write-Host "  [ตั้งค่าการเชื่อมต่อฐานข้อมูล HOSxP MySQL]" -ForegroundColor Cyan
    Write-Host "  (กด Enter ทันทีหากต้องการใช้ค่ามาตรฐานของ รพ.สมเด็จพระยุพราชสายบุรี)" -ForegroundColor Gray
    Write-Host "==============================================================================" -ForegroundColor Yellow
    
    $hHost = Read-Host "  1. HOSxP MySQL Host IP [ค่ามาตรฐาน: 192.168.0.251]"
    if (-not $hHost -or -not $hHost.Trim()) { $hHost = "192.168.0.251" } else { $hHost = $hHost.Trim() }

    $hPort = Read-Host "  2. HOSxP MySQL Port [ค่ามาตรฐาน: 3306]"
    if (-not $hPort -or -not $hPort.Trim()) { $hPort = "3306" } else { $hPort = $hPort.Trim() }

    $hDb = Read-Host "  3. HOSxP Database Name [ค่ามาตรฐาน: hos]"
    if (-not $hDb -or -not $hDb.Trim()) { $hDb = "hos" } else { $hDb = $hDb.Trim() }

    $hUser = Read-Host "  4. HOSxP Database User [ค่ามาตรฐาน: sa]"
    if (-not $hUser -or -not $hUser.Trim()) { $hUser = "sa" } else { $hUser = $hUser.Trim() }

    $hPass = Read-Host "  5. HOSxP Database Password [ค่ามาตรฐาน: sa]"
    if (-not $hPass) { $hPass = "sa" }

    $dbUrl = "mysql+pymysql://${hUser}:${hPass}@${hHost}:${hPort}/${hDb}"

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
    Write-Host "[OK] บันทึกไฟล์ secrets.toml และ .env เรียบร้อยแล้ว" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[OK] พบไฟล์ secrets.toml และ .env เรียบร้อยแล้ว" -ForegroundColor Green
}

$port = if ($env:PORT) { $env:PORT } else { "8000" }
$hostIp = if ($env:HOST) { $env:HOST } else { "0.0.0.0" }
$env:PORT = $port
$env:HOST = $hostIp
Write-Host "[OK] การตั้งค่าพร้อมใช้งาน (Port: $port)" -ForegroundColor Green
Write-Host ""

# 5. เตรียมฐานข้อมูลและเริ่มระบบ
Write-Host "[5/5] กำลังเตรียมฐานข้อมูลและเริ่มระบบ..." -ForegroundColor White
& $venvPython -m backend.init_db

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  ระบบพร้อมเปิดใช้งานแล้ว!" -ForegroundColor Cyan
Write-Host "  URL สำหรับใช้งาน: http://localhost:$port" -ForegroundColor Yellow
Write-Host "  (เครื่องอื่นในเครือข่าย รพ. สามารถเข้าผ่าน http://[IP-เครื่องนี้]:$port)" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:$port"

& $venvPython -m backend.main
