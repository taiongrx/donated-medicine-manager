#!/usr/bin/env bash
# =====================================================================
# Donated Medicine Manager - Automated Server Installer Script
# ระบบบริหารจัดการคลังยาบริจาค โรงพยาบาลสมเด็จพระยุพราชสายบุรี
# สำหรับติดตั้งบน Server ห้องยานอก (OPD Pharmacy Server)
# =====================================================================

set -e

# สีแสดงผลบน Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "====================================================================="
echo "   🏥 โปรแกรมติดตั้งระบบบริหารจัดการคลังยาบริจาค (Donated Medicine)"
echo "        โรงพยาบาลสมเด็จพระยุพราชสายบุรี - ห้องยานอก (OPD Pharmacy)"
echo "====================================================================="
echo -e "${NC}"

# 1. ตรวจสอบสิทธิ์และระบบปฏิบัติการ
echo -e "${BLUE}[1/6] 🔍 ตรวจสอบสภาพแวดล้อมระบบและสิทธิ์การทำงาน...${NC}"
OS_TYPE=$(uname -s)
echo -e "  - ระบบปฏิบัติการ: ${YELLOW}${OS_TYPE}${NC}"

# 2. ตรวจสอบ Docker และ Docker Compose
echo -e "${BLUE}[2/6] 🐳 ตรวจสอบเครื่องมือ Docker & Docker Compose...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ไม่พบ Docker ในระบบ!${NC}"
    echo -e "${YELLOW}กรุณาติดตั้ง Docker ก่อนดำเนินการติดตั้งต่อ:${NC}"
    echo "  Linux (Ubuntu/Debian): curl -fsSL https://get.docker.com | sh"
    echo "  macOS: Install Docker Desktop"
    exit 1
else
    DOCKER_VER=$(docker --version)
    echo -e "  - Docker Version: ${GREEN}${DOCKER_VER}${NC}"
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ ไม่พบ Docker Compose ในระบบ!${NC}"
    exit 1
else
    echo -e "  - Docker Compose: ${GREEN}พร้อมใช้งาน${NC}"
fi

# 3. ตรวจสอบการเชื่อมต่อฐานข้อมูล HOSxP MySQL (192.168.0.251:3306)
echo -e "${BLUE}[3/6] 🌐 ตรวจสอบการเชื่อมต่อฐานข้อมูล HOSxP (192.168.0.251:3306)...${NC}"
HOSXP_HOST="192.168.0.251"
HOSXP_PORT="3306"
HOSXP_USER="sa"
HOSXP_PASS="sa"
HOSXP_DB="hos"

# ทดสอบ socket connection ด้วย python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

CHECK_CONN=$($PYTHON_CMD -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(3)
try:
    s.connect(('$HOSXP_HOST', int('$HOSXP_PORT')))
    print('OK')
except Exception as e:
    print('FAIL')
s.close()
" 2>/dev/null || echo "FAIL")

if [ "$CHECK_CONN" == "OK" ]; then
    echo -e "  - สถานะการเชื่อมต่อ HOSxP MySQL ($HOSXP_HOST:$HOSXP_PORT): ${GREEN}เชื่อมต่อสำเร็จ (Online)${NC}"
else
    echo -e "  - สถานะการเชื่อมต่อ HOSxP MySQL ($HOSXP_HOST:$HOSXP_PORT): ${YELLOW}⚠️ ไม่สามารถเชื่อมต่อพอร์ต 3306 ได้โดยตรง${NC}"
    echo -e "    (ระบบจะรันผ่านโหมดการเชื่อมต่อสำรอง หรือกรุณาตรวจสอบสายแลน/Firewall เครือข่าย รพ.)"
fi

# 4. สร้างหรือยืนยันไฟล์การตั้งค่า (.env และ secrets.toml)
echo -e "${BLUE}[4/6] ⚙️ ตรวจสอบไฟล์การตั้งค่าสภาพแวดล้อม (.env และ secrets.toml)...${NC}"

if [ ! -f .env ]; then
    CAT_ENV_CONTENT="DATABASE_URL=mysql+pymysql://${HOSXP_USER}:${HOSXP_PASS}@${HOSXP_HOST}:${HOSXP_PORT}/${HOSXP_DB}"
    echo "$CAT_ENV_CONTENT" > .env
    echo -e "  - สร้างไฟล์ ${GREEN}.env${NC} เริ่มต้นเรียบร้อยแล้ว"
else
    echo -e "  - ตรวจพบไฟล์ ${GREEN}.env${NC} เดิม (คงค่าการตั้งค่าเดิมไว้)"
fi

if [ ! -f secrets.toml ]; then
    cat <<EOF > secrets.toml
[database]
host = "${HOSXP_HOST}"
port = ${HOSXP_PORT}
name = "${HOSXP_DB}"
user = "${HOSXP_USER}"
password = "${HOSXP_PASS}"
driver = "mysql+pymysql"
url = "mysql+pymysql://${HOSXP_USER}:${HOSXP_PASS}@${HOSXP_HOST}:${HOSXP_PORT}/${HOSXP_DB}"

[system]
hospital_name = "โรงพยาบาลสมเด็จพระยุพราชสายบุรี"
hospital_code = "10690"
environment = "production"
EOF
    echo -e "  - สร้างไฟล์ ${GREEN}secrets.toml${NC} เริ่มต้นเรียบร้อยแล้ว"
else
    echo -e "  - ตรวจพบไฟล์ ${GREEN}secrets.toml${NC} เดิม (คงค่าการตั้งค่าเดิมไว้)"
fi

# 5. Build และ Start Docker Containers
echo -e "${BLUE}[5/6] 🚀 เริ่มต้นคอมไพล์และเปิดทำงานบริการด้วย Docker Compose...${NC}"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d

echo -e "  - รอระบบ Backend และ Frontend เริ่มต้นทำงาน (10 วินาที)..."
sleep 10

# 6. ตรวจสอบความพร้อมของระบบ (Health Check)
echo -e "${BLUE}[6/6] 🏥 ตรวจสอบสถานะการทำงานของบริการ (Health Check)...${NC}"

BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/healthz 2>/dev/null || echo "000")

if [ "$BACKEND_HTTP" -eq 200 ]; then
    echo -e "  - Backend API (Port 8000): ${GREEN}ทำงานปกติ (Healthy - HTTP 200)${NC}"
else
    echo -e "  - Backend API (Port 8000): ${YELLOW}กำลังเริ่มต้น หรือส่งคำตอบต่างจากปกติ (HTTP ${BACKEND_HTTP})${NC}"
fi

FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$FRONTEND_HTTP" -eq 200 ]; then
    echo -e "  - Frontend Web UI (Port 80): ${GREEN}ทำงานปกติ (Healthy - HTTP 200)${NC}"
else
    echo -e "  - Frontend Web UI (Port 80): ${YELLOW}กำลังเริ่มต้น หรือส่งคำตอบต่างจากปกติ (HTTP ${FRONTEND_HTTP})${NC}"
fi

# ตรวจสอบ Local IP Address ของเซิร์ฟเวอร์
LOCAL_IP=""
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LOCAL_IP" ] && command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "localhost")
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo -e "\n${GREEN}${BOLD}"
echo "====================================================================="
echo "   🎉 การติดตั้งระบบบริหารจัดการคลังยาบริจาค บน Server สำเร็จแล้ว!"
echo "====================================================================="
echo -e "${NC}"
echo -e "📌 ${BOLD}การเข้าใช้งานจากเครื่องลูกข่าย (Client PCs หน้าต่างห้องยานอก):${NC}"
echo -e "   - เข้าผ่านเว็บเบราว์เซอร์: ${CYAN}${BOLD}http://${LOCAL_IP}${NC}  (หรือ http://localhost)"
echo -e "   - Backend API URL:       ${CYAN}http://${LOCAL_IP}:8000${NC}"
echo -e "   - Swagger API Docs:      ${CYAN}http://${LOCAL_IP}:8000/docs${NC}"
echo ""
echo -e "🔐 ${BOLD}บัญชีผู้ใช้เริ่มต้นสำหรับเข้าใช้งาน (Password: 123):${NC}"
echo -e "   - ${YELLOW}jaslan${NC}    : ภก.ยัสลัน มายุดิน (เภสัชกรคลังยาบริจาค)"
echo -e "   - ${YELLOW}Ahlam${NC}     : อัหลาม แคเม๊าะ (เจ้าพนักงานเภสัชกรรม ตรวจรับ)"
echo -e "   - ${YELLOW}dah${NC}       : ภญ.วันฮามีดะห์ ปานากาเซ็ง (หัวหน้ากลุ่มงานเภสัชกรรม)"
echo ""
echo -e "🛠️ ${BOLD}คำสั่งดูแลรักษาระบบเบื้องต้น:${NC}"
echo -e "   - ดู Log การทำงาน:       ${CYAN}docker compose logs -f${NC}"
echo -e "   - รีสตาร์ทระบบ:           ${CYAN}docker compose restart${NC}"
echo -e "   - ปิดการทำงานระบบ:       ${CYAN}docker compose down${NC}"
echo -e "=====================================================================\n"
