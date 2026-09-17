#!/bin/bash
# ==============================================================================
# Database Restoration Script (Linux)
# ระบบบริหารจัดการคลังยาบริจาค - โรงพยาบาลสมเด็จพระยุพราชสายบุรี
# ==============================================================================

set -e

BACKUP_DIR="$(pwd)/backups"

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    echo "❌ ไม่พบโฟลเดอร์สำรองข้อมูลหรือไม่มีไฟล์สำรองใน ${BACKUP_DIR}"
    exit 1
fi

echo "====================================================================="
echo "   🔄 โปรแกรมกู้คืนระบบคลังยาบริจาค (DRP Database Restore Utility)"
echo "====================================================================="
echo "รายการไฟล์สำรองที่มีในระบบ:"
echo ""

LATEST_BACKUP=$(ls -td "$BACKUP_DIR"/*/ 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ ไม่พบชุดข้อมูลสำรอง"
    exit 1
fi

echo "ชุดสำรองล่าสุด: $LATEST_BACKUP"
echo ""
read -p "ต้องการกู้คืนจากชุดสำรองล่าสุดนี้ใช่หรือไม่? [Y/n]: " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [ "$CONFIRM" != "Y" ] && [ "$CONFIRM" != "y" ]; then
    echo "ยกเลิกการกู้คืนข้อมูล"
    exit 0
fi

# ตรวจสอบ SHA256 Checksum
if [ -f "${LATEST_BACKUP}/checksum.sha256" ]; then
    echo "กำลังตรวจสอบความสมบูรณ์ของไฟล์สำรอง (SHA-256 Checksum)..."
    cd "${LATEST_BACKUP}"
    sha256sum -c "checksum.sha256" 2>/dev/null || shasum -a 256 -c "checksum.sha256"
    cd - > /dev/null
    echo "  + ตรวจสอบ Checksum ผ่านเรียบร้อย"
fi

# ค้นหาไฟล์ .db
DB_FILE=$(find "${LATEST_BACKUP}" -name "*.db" | head -n 1)
if [ -n "$DB_FILE" ]; then
    echo "กำลังกู้คืนไฟล์ฐานข้อมูล SQLite..."
    cp "$DB_FILE" "./donated_medicine.db"
    echo "  + กู้คืนฐานข้อมูล SQLite สำเร็จ"
fi

# ค้นหาไฟล์ .env
ENV_FILE=$(find "${LATEST_BACKUP}" -name "env_*.bak" | head -n 1)
if [ -n "$ENV_FILE" ] && [ ! -f ".env" ]; then
    echo "กำลังกู้คืนไฟล์การตั้งค่า .env..."
    cp "$ENV_FILE" "./.env"
    echo "  + กู้คืนไฟล์ .env สำเร็จ"
fi

# ค้นหาไฟล์ secrets.toml
SECRETS_FILE=$(find "${LATEST_BACKUP}" -name "secrets_*.bak" | head -n 1)
if [ -n "$SECRETS_FILE" ] && [ ! -f "secrets.toml" ]; then
    echo "กำลังกู้คืนไฟล์การตั้งค่า secrets.toml..."
    cp "$SECRETS_FILE" "./secrets.toml"
    echo "  + กู้คืนไฟล์ secrets.toml สำเร็จ"
fi

echo "====================================================================="
echo "   🎉 กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!"
echo "   กรุณาสั่งรีสตาร์ทบริการด้วย: docker compose restart"
echo "====================================================================="
