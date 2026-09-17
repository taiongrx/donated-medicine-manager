# คู่มือการติดตั้งและการใช้งานระบบบริหารจัดการคลังยาบริจาค (Donated Medicine Manager)
## สำหรับเซิร์ฟเวอร์ห้องยานอก (OPD Pharmacy Server) - โรงพยาบาลสมเด็จพระยุพราชสายบุรี

---

## 1. การติดตั้งด่วนด้วย One-Line Installer Script (`install.sh`)

ทางทีมพัฒนาได้จัดทำสคริปต์การติดตั้งอัตโนมัติ `install.sh` สามารถดำเนินการติดตั้งได้ในคำสั่งเดียวบน Server ห้องยานอก:

```bash
cd /opt/donated-medicine-manager
sudo chmod +x install.sh
sudo ./install.sh
```

สคริปต์ `install.sh` จะดำเนินการโดยอัตโนมัติ:
1. ตรวจสอบสิทธิ์และเครื่องมือ Docker / Docker Compose
2. ตรวจสอบการเชื่อมต่อกับ HOSxP MySQL (`192.168.0.251:3306`)
3. สร้างไฟล์ `.env` และ `secrets.toml`
4. รัน `docker compose up --build -d` เพื่อสร้างและเปิดทำงาน Containers
5. ตรวจสอบความพร้อมผ่าน Health Check (`http://localhost:8000/healthz`)

---

## 2. การตั้งค่า Auto-Start เมื่อเปิดเครื่อง (Systemd Service Setup)

เพื่อให้ระบบเปิดทำงานเองอัตโนมัติเมื่อเปิดเซิร์ฟเวอร์ห้องยานอก หรือกรณีไฟดับแล้วเครื่องรีบูต:

1. **คัดลอกไฟล์ Service ไปที่ `/etc/systemd/system/`**:
   ```bash
   sudo cp donated-medicine.service /etc/systemd/system/
   ```

2. **Reload และเปิดใช้งาน Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable donated-medicine.service
   sudo systemctl start donated-medicine.service
   ```

3. **ตรวจสอบสถานะการทำงาน**:
   ```bash
   sudo systemctl status donated-medicine.service
   ```

---

## 3. การเข้าใช้งานจากเครื่องลูกข่าย (Client PCs หน้าต่างห้องยานอก)

1. ตรวจสอบ IP Address ของเซิร์ฟเวอร์ห้องยานอก (เช่น `192.168.1.100`)
2. ที่เครื่องลูกข่ายหน้าต่างจ่ายยา เปิดเว็บเบราว์เซอร์ (Google Chrome / Microsoft Edge)
3. พิมพ์ URL: **`http://192.168.1.100`**
4. บัญชีเข้าใช้งานเริ่มต้น (Password: 123):
   - `jaslan` : ภก.ยัสลัน มายุดิน (เภสัชกรปฏิบัติงานคลังยาบริจาค)
   - `Ahlam` : อัหลาม แคเม๊าะ (เจ้าพนักงานเภสัชกรรม)
   - `dah` : ภญ.วันฮามีดะห์ ปานากาเซ็ง (หัวหน้ากลุ่มงานเภสัชกรรม)

---

## 4. คำสั่งดูแลรักษาระบบเบื้องต้น (Maintenance Commands)

```bash
# ดู Log การทำงานของระบบ
docker compose logs -f

# รีสตาร์ทระบบ
docker compose restart

# ปิดการทำงานระบบ
docker compose down
```
