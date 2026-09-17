---
name: hosxp-installation-packager
description: >-
  Automates the generation of production-ready installation scripts, configuration templates,
  firewall configurations, and autostart services for deploying hospital intranet applications
  that integrate with HOSxP MySQL/MariaDB (supporting both Linux systemd and Windows Server/Desktop).
---

# HOSxP Hospital Installation & Deployment Packager

คู่มือมาตรฐานและแบบแผน (Best Practice) ในการสร้างชุดไฟล์สำหรับติดตั้งระบบบริการทางการแพทย์/เภสัชกรรมในโรงพยาบาล ที่ต้องเชื่อมต่อกับฐานข้อมูล HOSxP (MySQL / MariaDB) เพื่อให้เจ้าหน้าที่หรือผู้ดูแลระบบคอมพิวเตอร์ (IT รพ.) นำไป Deploy บน Server ประจำแผนก (เช่น ห้องยาผู้ป่วยนอก, หอผู้ป่วย, ศูนย์สารสนเทศ) ได้ในคำสั่งเดียว ทั้งบนระบบปฏิบัติการ **Linux** และ **Windows**

---

## 1. ชุดไฟล์ติดตั้งที่ต้องสร้างให้ครบทุกโปรเจกต์ (Standard File Manifest)

ทุกโปรเจกต์ที่มีการเชื่อมต่อกับฐานข้อมูล HOSxP จะต้องมีชุดไฟล์มาตรฐานดังต่อไปนี้:

```
[project-root]/
├── .gitignore                         # ป้องกัน credentials, .env, secrets.toml และ *.db หลุดขึ้น Git
├── .env.example                       # เทมเพลตตัวแปรสภาพแวดล้อม (ห้ามใส่รหัสผ่านจริง)
├── secrets.toml.example               # เทมเพลตการตั้งค่า HOSxP สำหรับ Backend / Streamlit
│
├── install.sh                         # สคริปต์ติดตั้งอัตโนมัติบน Linux Server (Ubuntu/Debian)
├── [service-name].service             # Systemd Unit file สำหรับ Linux auto-start on boot
│
├── install.ps1                        # สคริปต์ติดตั้งอัตโนมัติบน Windows (PowerShell 5.1/7+)
├── install.bat                        # Batch wrapper ขอสิทธิ์ Administrator เพื่อรัน install.ps1
├── setup_autostart_and_firewall.bat   # เปิดพอร์ต Windows Defender Firewall และสร้าง Startup Shortcut
├── start_service.bat                  # สคริปต์ตรวจสอบ Docker Desktop และเปิดทำงาน Containers
├── run_docker.bat                     # สคริปต์ Quick Launcher สำหรับ Docker Compose
│
├── docker-compose.yml                 # คอนฟิกการทำงานร่วมกันระหว่าง Frontend & Backend
└── README_SERVER_INSTALLATION.md      # คู่มือติดตั้งและบำรุงรักษาสำหรับเจ้าหน้าที่ IT รพ.
```

---

## 2. กฎความปลอดภัยและการจัดการ Credentials (Zero-Leak Security Guard)

1. **ห้าม Commit ข้อมูลจริงขึ้น Git เด็ดขาด**:
   - ไฟล์ `.env`, `secrets.toml`, `.streamlit/secrets.toml`, ไฟล์ฐานข้อมูล SQLite (`*.db`), และ Log Files ต้องอยู่ใน `.gitignore` เสมอ
   - ให้สร้างเฉพาะไฟล์ `.env.example` และ `secrets.toml.example` ที่ระบุรูปแบบ IP, Port, Username, Password จำลองสำหรับ Git
2. **การคงค่าเดิมเมื่อรันสคริปต์ซ้ำ (Idempotent Installation)**:
   - สคริปต์ติดตั้ง (`install.sh`, `install.ps1`) ต้องตรวจเช็คก่อนว่ามีไฟล์ `.env` หรือ `secrets.toml` อยู่แล้วหรือไม่
   - หากตรวจพบไฟล์เดิมที่มีอยู่แล้ว **ห้ามเขียนทับ (Do NOT overwrite)** ให้คงค่าเดิมไว้ เพื่อป้องกันการล้างการตั้งค่าที่ IT รพ. เคยปรับแต่งไว้

---

## 3. รายละเอียดและโครงสร้างของแต่ละไฟล์ (Implementation Details)

### 3.1. `secrets.toml.example`
```toml
[database]
host = "192.168.0.251"
port = 3306
name = "hos"
user = "sa"
password = "YOUR_HOSXP_PASSWORD"
driver = "mysql+pymysql"
url = "mysql+pymysql://sa:YOUR_HOSXP_PASSWORD@192.168.0.251:3306/hos"

[system]
hospital_name = "โรงพยาบาลสมเด็จพระยุพราชสายบุรี"
hospital_code = "10690"
environment = "production"
```

### 3.2. `install.sh` (Linux Server Installer)
- **สิทธิ์**: รันด้วย `sudo`
- **ขั้นตอน**:
  1. ตรวจสอบ Docker & Docker Compose
  2. ตรวจสอบการเชื่อมต่อ Network ไปยัง HOSxP MySQL (`nc` หรือ Python socket probe ไปยัง IP:3306)
  3. สร้างไฟล์ `.env` และ `secrets.toml` (เฉพาะเมื่อยังไม่มีไฟล์)
  4. สั่ง `docker compose up --build -d`
  5. ตรวจสอบ Health Check ด้วย HTTP status code (`curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/healthz`)
  6. ตรวจหา Local IP Address ของเซิร์ฟเวอร์ และแสดงผล URL ใช้งานสำหรับเครื่องลูกข่าย

### 3.3. `install.ps1` & `install.bat` (Windows Server / PC Installer)
- **การขอสิทธิ์**: มีการตรวจสอบ Admin Elevation ผ่าน `net session` หากไม่มี ให้สั่ง UAC Prompt อัตโนมัติ
- **ขั้นตอน**:
  1. ตรวจสอบ Docker Desktop และ Docker Compose Engine
  2. รับค่า Input หรือใช้ค่า Default สำหรับ HOSxP IP / Port / User / Password / Database Name
  3. สั่ง `docker compose build` และ `docker compose up -d`
  4. ตรวจสอบ Health Check ผ่าน `Invoke-RestMethod`
  5. สร้างกฎ Windows Defender Firewall ผ่าน `netsh advfirewall` หรือ `New-NetFirewallRule` สำหรับพอร์ต Web (เช่น 80) และ API (เช่น 8000)
  6. แสดง Local IP Address เพื่อให้เครื่องลูกข่ายในเครือข่ายโรงพยาบาลเปิดใช้งานได้

### 3.4. `setup_autostart_and_firewall.bat`
- สร้าง Shortcut ไปยัง `start_service.bat` ไว้ในโฟลเดอร์ Startup ของ Windows (`shell:startup`)
- เปิดพอร์ต Inbound TCP บน Windows Firewall ให้เครื่องคอมพิวเตอร์แผนกอื่นเข้าใช้งานได้

---

## 4. Health & Readiness Standards

ทุก Backend API ที่เชื่อมต่อ HOSxP ต้องมี 2 Probes:
- **`GET /healthz`**: เช็คว่า Process/Uvicorn ยังมีชีวิตอยู่ (Liveness Probe) คืนค่า `{"status": "ok", "timestamp": "..."}`
- **`GET /readyz`**: เช็คว่าเชื่อมต่อฐานข้อมูล HOSxP สำเร็จ (Readiness Probe) โดยทดสอบรัน `SELECT 1` หากเชื่อมต่อไม่สำเร็จต้องคืน HTTP 503 Service Unavailable (ห้ามใช้ 530)
