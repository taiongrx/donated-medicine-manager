# ระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)
### โรงพยาบาลสมเด็จพระยุพราชสายบุรี (Sai Buri Crown Prince Hospital) — รหัสหน่วยงาน 10690

ระบบแอปพลิเคชันบริการจัดการเวชภัณฑ์บริจาค/ยาคืนจากผู้ป่วย ออกแบบตามมาตรฐาน Lean Healthcare และระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ (หมวดการจำหน่ายและโอนย้ายพัสดุ) เชื่อมต่อฐานข้อมูลระบบสารสนเทศโรงพยาบาล HOSxP โดยตรง

---

## 🌟 จุดเด่นและฟังก์ชันหลักของระบบ

1. **เชื่อมต่อฐานข้อมูล HOSxP จริง 100% (MySQL/MariaDB `192.168.0.251:3306/hos`)**:
   - ตรวจสอบประวัติผู้ป่วยจากตาราง `patient` พร้อมระบบเติมเลข 0 หน้า HN ให้อัตโนมัติเป็น 7 หลัก
   - ค้นหารายการยากลางและราคากลางพัสดุจากตาราง `s_drugitems` แบบ Auto-suggest ทันที
   - ตรวจสอบสิทธิ์และยืนยันตัวตนเจ้าหน้าที่ผู้ปฏิบัติงานผ่านตาราง `opduser` (รองรับทั้ง MD5 และ Plaintext)
   - ดึงรายชื่อเจ้าหน้าที่ทั้งโรงพยาบาล (625 รายชื่อ) และตำแหน่งทางราชการ (109 ตำแหน่ง) ในการออกเอกสารราชการ

2. **ระบบหน้าต่างรับมอบยาและพิมพ์สติ๊กเกอร์ความร้อน (Lean Step 1 & 2)**:
   - บันทึกความยินยอมส่งมอบยาของผู้ป่วย (Patient Consent)
   - สั่งพิมพ์สติ๊กเกอร์ความร้อนขนาดมาตรฐาน 8x5 ซม. พร้อมระบบบาร์โค้ด Code 39 เพื่อแปะติดหน้าถุงยา

3. **ระบบคัดแยกและตรวจสอบสภาพยาหลังบ้าน (Reconciliation & Inspection)**:
   - สแกนบาร์โค้ดหน้าถุงยาเพื่อดึงรายการยาในถุงขึ้นมาตรวจสภาพ
   - บันทึกเลขล็อต (Lot Number), ยี่ห้อ (Brand), และวันหมดอายุ (Expiration Date)
   - ระบบแนะนำเลขล็อตและวันหมดอายุล่าสุดที่เคยคีย์ (Smart Preset) ช่วยลดเวลาหน้างาน

4. **การบริหารจัดการคลังยาและคลังย่อย (Inventory & FEFO Shelving)**:
   - เรียงลำดับยาตามวันหมดอายุ (First Expired, First Out - FEFO)
   - ระบบแจ้งเตือนยาใกล้หมดอายุล่วงหน้า (Warning 90/180 วัน)
   - โอนย้ายเวชภัณฑ์เข้าชั้นวางยาคลังย่อยเพื่อพร้อมจ่ายต่อ (Stock Transfer Requisition)
   - ขออนุมัติจำหน่ายทำลายเวชภัณฑ์เสื่อมสภาพ/หมดอายุ (Bulk Disposal & Memo Generation)

5. **ระบบเอกสารราชการและคลังประวัติ (Official Memos & Document Archive)**:
   - สร้างเอกสารบันทึกข้อความราชการขออนุมัติจำหน่ายทำลายยา พร้อมแต่งตั้งคณะกรรมการควบคุมการทำลาย ๓ ท่าน และบัญชีแนบท้าย (บัญชีหางว่าว)
   - สร้างใบส่งมอบเวชภัณฑ์คลังย่อย (Stock Transfer Slip) สำหรับผู้ส่งมอบ-ผู้รับมอบ
   - ระบบค้นหาและพิมพ์เอกสารย้อนหลัง (Document Archive) พิมพ์ลงกระดาษ A4 ได้ทันที

6. **ระบบตรวจสอบภายในและ สตง. (Audit Trail & Stock Card Ledger)**:
   - บันทึกประวัติการเคลื่อนไหวของเวชภัณฑ์ทุกรายการ (Stock Movement Ledger)
   - ส่งออกข้อมูล Stock Card เป็นไฟล์ CSV ภาษาไทย (UTF-8 with BOM) สำหรับเปิดบน Microsoft Excel

---

## 🛠️ สถาปัตยกรรมระบบ (Architecture)

- **Frontend**: React 18, Vite, Lucide Icons, Pure CSS Responsive (Apple Clean Medical Theme)
- **Backend API**: FastAPI (Python 3.11), SQLAlchemy ORM, PyMySQL, Pydantic v2
- **Database Engine**: HOSxP MySQL / MariaDB (Primary) + SQLite Local Storage (Fallback)
- **Deployment**: Docker & Docker Compose (Nginx Web Server + Uvicorn ASGI Server)

---

## 🚀 คู่มือการติดตั้งบนเซิร์ฟเวอร์ห้องยานอก (Deployment Guide)

### 🐧 วิธีที่ 1: การติดตั้งบน Linux Server (Ubuntu / Debian)

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd /opt/donated-medicine-manager

# 2. ให้สิทธิ์การรันและสั่งติดตั้งอัตโนมัติ
sudo chmod +x install.sh
sudo ./install.sh
```

**ตั้งค่าให้เปิดระบบอัตโนมัติเมื่อเปิดเครื่อง (Systemd Service)**:
```bash
sudo cp donated-medicine.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable donated-medicine.service
sudo systemctl start donated-medicine.service
```

---

### 🪟 วิธีที่ 2: การติดตั้งผ่าน Docker Desktop (Windows Server / PC)

1. คลิกขวาที่ไฟล์ **`install.bat`** แล้วเลือก **"Run as administrator"** (หรือเปิด PowerShell แล้วรัน `.\install.ps1`)
2. ตัวติดตั้งจะสอบถาม IP และข้อมูลการเชื่อมต่อ HOSxP MySQL (กด `Enter` เพื่อใช้ค่ามาตรฐาน)
3. ระบบจะทำการ Build Docker Containers, เปิดพอร์ต Windows Firewall (พอร์ต 80 และ 8000) ให้อัตโนมัติ

**เปิดใช้งานและตั้งค่า Auto-start บน Windows**:
- ดับเบิ้ลคลิก **`setup_autostart_and_firewall.bat`** เพื่อเปิดพอร์ต Firewall และสร้าง Startup Shortcut
- หรือดับเบิ้ลคลิก **`start_service.bat`** เพื่อเปิดทำงานระบบ

---

### ⚡ วิธีที่ 3: รันแบบ Windows Native ทันที (ไม่ต้องใช้ Docker / ไม่ต้องเปิด BIOS Virtualization)

> **เหมาะที่สุดสำหรับ**: คอมพิวเตอร์โรงพยาบาลที่ไม่ได้เปิด CPU Virtualization (VT-x / AMD-V) ใน BIOS หรือติดตั้ง Docker ไม่ผ่าน

1. **ดับเบิ้ลคลิกไฟล์ `run_native_windows.bat`**:
   - หากยังไม่มี Python บนเครื่อง ระบบจะพยายามติดตั้งให้ผ่าน winget อัตโนมัติ (หรือดาวน์โหลด Python 3.11 แล้วติ๊ก *Add python.exe to PATH*)
   - ตัวสคริปต์จะติดตั้ง library ที่จำเป็น, สร้างไฟล์คอนฟิก, เชื่อมโยงฐานข้อมูล และเปิดหน้าเว็บให้ทันทีที่ `http://localhost:8000`
2. **ตั้งค่าให้เปิดอัตโนมัติเมื่อเปิดเครื่อง (Auto-start)**:
   - ดับเบิ้ลคลิกไฟล์ **`setup_autostart_native.bat`** เพื่อสร้างทางลัดรันพื้นหลัง (ซ่อนหน้าต่างดำ) ในโฟลเดอร์ Startup ของ Windows และเปิดพอร์ต 8000 ใน Windows Firewall


---

## 💻 การเข้าใช้งานจากเครื่องลูกข่าย (Client PCs หน้าต่างห้องยานอก)

- เปิดโปรแกรม Google Chrome หรือ Microsoft Edge
- พิมพ์ URL: **`http://[IP_SERVER]`** (เช่น `http://192.168.0.xxx` หรือ `http://localhost`)
- บัญชีผู้ใช้งานเริ่มต้น: **ใช้ Username และ Password บัญชี HOSxP จริงของท่าน**

---

## 🔒 กฎความปลอดภัยและการจัดการรหัสผ่าน (Security & PDPA Guard)

- ไฟล์ `.env` และ `secrets.toml` ที่มีรหัสผ่านฐานข้อมูล HOSxP จริง จะถูกยกเว้นไม่ให้ Push ขึ้น Git ผ่าน `.gitignore` เสมอ
- สำหรับการตั้งค่าในเครื่องใหม่ ให้คัดลอกไฟล์ต้นแบบ:
  ```bash
  cp secrets.toml.example secrets.toml
  cp .env.example .env
  ```
- ข้อมูลผู้ป่วยและบันทึกประวัติภายในระบบรองรับมาตรฐาน PDPA และไม่มีการบันทึก Raw PII ลงใน System Logs

---

## 🛡️ มาตรฐานความต่อเนื่องและการบริหารความเสี่ยง (BCP, DRP & Version Control)

ระบบได้รับการออกแบบตามมาตรฐานคุณภาพโรงพยาบาล (HA ฉบับที่ 6: มาตรฐานหมวดสารสนเทศและระบบยา II-4, II-5) โดยมีเอกสารและสคริปต์รองรับภาวะฉุกเฉินครบถ้วน:

1. **[แผนบริหารความต่อเนื่องในการดำเนินงาน (BCP Plan)](docs/BCP_BUSINESS_CONTINUITY_PLAN.md)**:
   - กลไกการสลับเข้าสู่โหมด **Offline Fallback** เมื่อสายแลนขาดหรือเซิร์ฟเวอร์ HOSxP ชะลอตัว
   - ขั้นตอนการใช้ **Emergency Manual Voucher** สำหรับหน้าต่างจ่ายยาเมื่อไฟฟ้าดับฉุกเฉิน
2. **[แผนกู้คืนระบบจากภัยพิบัติ (DRP Plan)](docs/DRP_DISASTER_RECOVERY_PLAN.md)**:
   - กำหนดเป้าหมาย **RPO < 1 ชั่วโมง** และ **RTO < 15 นาที**
   - กลยุทธ์การสำรองข้อมูลแบบ 3-2-1 และรอบการซักซ้อมกู้ระบบทุก 6 เดือน
   - สคริปต์สำรองข้อมูล: `scripts/backup_database.sh` (Linux) / `scripts/backup_database.bat` (Windows)
   - สคริปต์กู้คืนข้อมูล: `scripts/restore_database.sh` (Linux) / `scripts/restore_database.bat` (Windows)
3. **[แผนบริหารจัดการเวอร์ชันและการเปลี่ยนแปลง (Version Control Plan)](docs/VERSION_CONTROL_PLAN.md)**:
   - การบริหารหมายเลขเวอร์ชันตาม Semantic Versioning 2.0.0
   - นโยบายความปลอดภัยฐานข้อมูล Expand-and-Contract และขั้นตอน Rollback ฉุกเฉินใน 3 นาที
   - ดูประวัติการเปลี่ยนแปลงทั้งหมดได้ที่ [CHANGELOG.md](CHANGELOG.md)

---

## 📄 ลิขสิทธิ์และการพัฒนา
พัฒนาโดยทีมเภสัชกรรมและสารสนเทศ โรงพยาบาลสมเด็จพระยุพราชสายบุรี จังหวัดปัตตานี
