#!/bin/bash
# ==============================================================================
# Automated Database & Inventory Backup Script (Linux)
# ระบบบริหารจัดการคลังยาบริจาค - โรงพยาบาลสมเด็จพระยุพราชสายบุรี
# ==============================================================================

set -e

BACKUP_DIR="$(pwd)/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_SUBDIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${BACKUP_SUBDIR}"

echo "====================================================================="
echo "   📦 เริ่มต้นการสำรองข้อมูลระบบคลังยาบริจาค (DRP Automated Backup)"
echo "   วัน-เวลา: $(date)"
echo "====================================================================="

# 1. สำรองฐานข้อมูล SQLite ประจำเครื่อง (ถ้ามี)
if [ -f "donated_medicine.db" ]; then
    echo "  - กำลังสำรองไฟล์ฐานข้อมูล SQLite..."
    cp donated_medicine.db "${BACKUP_SUBDIR}/donated_medicine_${TIMESTAMP}.db"
fi

# 2. สำรองข้อมูลการตั้งค่าและคอนฟิก
if [ -f ".env" ]; then
    cp .env "${BACKUP_SUBDIR}/env_${TIMESTAMP}.bak"
fi
if [ -f "secrets.toml" ]; then
    cp secrets.toml "${BACKUP_SUBDIR}/secrets_${TIMESTAMP}.bak"
fi

# 3. ดึงรายงาน Stock Card CSV จาก Backend API ผ่าน Port 8000
echo "  - กำลังส่งออกสำเนาบัญชีความเคลื่อนไหวคลังยา (Stock Card CSV)..."
curl -s http://localhost:8000/api/reports/stock-card/export > "${BACKUP_SUBDIR}/StockCard_${TIMESTAMP}.csv" || true

# 4. คำนวณค่า Checksum SHA-256 เพื่อตรวจสอบความถูกต้องในการกู้คืน
cd "${BACKUP_SUBDIR}"
sha256sum * > "checksum.sha256" 2>/dev/null || shasum -a 256 * > "checksum.sha256"
cd - > /dev/null

# 5. ลบไฟล์สำรองเก่าที่มีอายุเกิน 90 วันอัตโนมัติ (Automated Pruning)
echo "  - ทำความสะอาดไฟล์สำรองเก่า (Retention 90 วัน)..."
find "${BACKUP_DIR}" -type d -mtime +90 -exec rm -rf {} + 2>/dev/null || true

echo "====================================================================="
echo "   ✅ สำรองข้อมูลเรียบร้อยแล้ว!"
echo "   ตำแหน่งไฟล์: ${BACKUP_SUBDIR}"
echo "====================================================================="
