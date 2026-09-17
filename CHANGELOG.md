# Changelog - ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)

บันทึกประวัติการเปลี่ยนแปลงและการพัฒนาเวอร์ชันทั้งหมด สอดคล้องตามมาตรฐาน [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) และ Semantic Versioning.

---

## [1.2.0] - 2026-09-17

### Added
- **Windows Native Mode (No-Docker / No-Virtualization)**:
  - เพิ่มตัวรันระบบ Windows โดยตรง `run_native_windows.bat` แบบ 1-Click ไม่ต้องพึ่งพา Docker Desktop หรือเปิด Virtualization (VT-x/AMD-V) ใน BIOS
  - เชื่อมโยง Pre-built React Frontend (`frontend/dist`) เข้ากับ FastAPI Backend โดยตรงผ่าน `StaticFiles` เสิร์ฟทั้งเว็บ UI และ API บนพอร์ตเดียวกัน (Port 8000)
  - นำไฟล์ Build ผลลัพธ์ของ Frontend เข้าสู่ Version Control (Git) เพื่อให้เครื่อง PC ในโรงพยาบาลรันระบบได้ทันทีโดยไม่ต้องติดตั้ง Node.js หรือ npm
  - เพิ่มสคริปต์เปิดทำงานอัตโนมัติเมื่อเปิดเครื่อง `setup_autostart_native.bat` และ `run_silent.vbs` ซ่อนหน้าต่างดำค้าง
  - รองรับ Python ย้อนหลัง (Python 3.9/3.10) ด้วย `tomli` Fallback ใน `backend/database.py`

---

## [1.1.0] - 2026-09-17

### Added
- **BCP & DRP Framework**:
  - เพิ่มเอกสาร `docs/BCP_BUSINESS_CONTINUITY_PLAN.md` รองรับมาตรฐาน HA ฉบับที่ 6 สำหรับห้องยาผู้ป่วยนอก
  - เพิ่มเอกสาร `docs/DRP_DISASTER_RECOVERY_PLAN.md` พร้อมขั้นตอนการกู้คืนระบบแบบ Step-by-Step (RPO < 1 ชม., RTO < 15 นาที)
  - เพิ่มเอกสาร `docs/VERSION_CONTROL_PLAN.md` สำหรับการควบคุมเวอร์ชันและการ Rollback โค้ด
  - เพิ่มสคริปต์สำรองและกู้คืนฐานข้อมูลอัตโนมัติ `scripts/backup_database.sh`, `scripts/restore_database.sh`, `scripts/backup_database.bat`, `scripts/restore_database.bat`
- **HOSxP Dual Installation Suite**:
  - เพิ่มตัวติดตั้ง Windows Server / Desktop: `install.ps1`, `install.bat`, `setup_autostart_and_firewall.bat`, `start_service.bat`, `run_docker.bat`
  - เพิ่มเทมเพลตคอนฟิก `secrets.toml.example`
  - เพิ่ม Antigravity Skill `hosxp-installation-packager` ทั้ง Global และ Local Workspace
- **GitHub Version Control**:
  - นำโปรเจกต์ขึ้นสู่ Remote Git Repository ที่ `taiongrx/donated-medicine-manager` พร้อมมาตรการรักษาความปลอดภัย `.gitignore`

---

## [1.0.0] - 2026-09-15

### Added
- ระบบคัดแยกและรับคืนเวชภัณฑ์บริจาคจากผู้ป่วย (Patient Consent & Anonymous Bag Coding)
- ระบบเชื่อมต่อฐานข้อมูล HOSxP MySQL (`opduser`, `s_drugitems`, `patient`) ดึงข้อมูลเจ้าหน้าที่จริง 625 รายชื่อ และ 109 ตำแหน่งราชการ
- ระบบพิมพ์สติ๊กเกอร์ความร้อน 8x5 ซม. พร้อมบาร์โค้ด Code 39
- ระบบจัดการคลังยาบริจาคตามหลัก FEFO และแจ้งเตือนยาใกล้หมดอายุ 90/180 วัน
- ระบบจัดทำบันทึกข้อความราชการขออนุมัติจำหน่ายทำลายพัสดุ พร้อมแต่งตั้งคณะกรรมการควบคุม ๓ ท่าน และบัญชีแนบท้าย (บัญชีหางว่าว)
- ระบบส่งออกรายงาน Stock Card Ledger เป็นไฟล์ CSV ภาษาไทย (UTF-8 BOM)
- ตัวติดตั้งอัตโนมัติบน Linux Server `install.sh` พร้อม Systemd Service
