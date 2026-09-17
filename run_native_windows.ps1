# UTF-8 with BOM
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

# 1. ตรวจสอบ Python
Write-Host "[1/5] กำลังตรวจสอบ Python บนเครื่อง..." -ForegroundColor White
$pythonCmd = $null

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
}

if (-not $pythonCmd) {
    Write-Host "[!] ตรวจไม่พบ Python ในระบบ!" -ForegroundColor Yellow
    Write-Host "[*] กำลังพยายามติดตั้ง Python 3.11 ผ่าน winget..." -ForegroundColor White
    try {
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (Get-Command python -ErrorAction SilentlyContinue) {
            $pythonCmd = "python"
        }
    } catch {}

    if (-not $pythonCmd) {
        Write-Host "[X] ไม่สามารถติดตั้ง Python อัตโนมัติได้" -ForegroundColor Red
        Write-Host ""
        Write-Host "คำแนะนำในการติดตั้ง Python:" -ForegroundColor Yellow
        Write-Host "1. เข้าเว็บไซต์ https://www.python.org/downloads/" -ForegroundColor White
        Write-Host "2. ดาวน์โหลดและติดตั้ง Python 3.11 (หรือ 3.10 / 3.12)" -ForegroundColor White
        Write-Host "3. สำคัญมาก: ตอนเริ่มติดตั้ง ให้ติ๊กถูกที่ช่อง [Add python.exe to PATH]" -ForegroundColor Yellow
        Write-Host "4. เมื่อติดตั้งเสร็จแล้ว ให้เปิดรันคำสั่งใหม่อีกครั้ง" -ForegroundColor White
        Start-Process "https://www.python.org/downloads/"
        Read-Host "กด Enter เพื่อปิดหน้าต่างนี้..."
        exit 1
    }
}

$pyVer = & $pythonCmd --version 2>&1
Write-Host "[OK] พบ Python ในระบบ: $pyVer" -ForegroundColor Green
Write-Host ""

# 2. Virtual Environment (.venv)
Write-Host "[2/5] กำลังเตรียมสภาพแวดล้อม Virtual Environment (.venv)..." -ForegroundColor White
$venvPython = ""
if (-not (Test-Path ".venv")) {
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

# 4. ไฟล์ตั้งค่า .env และ secrets.toml
Write-Host "[4/5] ตรวจสอบไฟล์ตั้งค่าระบบ..." -ForegroundColor White
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] สร้างไฟล์ .env เริ่มต้นเรียบร้อย" -ForegroundColor Green
}
if (-not (Test-Path "secrets.toml") -and (Test-Path "secrets.toml.example")) {
    Copy-Item "secrets.toml.example" "secrets.toml"
    Write-Host "[OK] สร้างไฟล์ secrets.toml เริ่มต้นเรียบร้อย" -ForegroundColor Green
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
