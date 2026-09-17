# ใช้ base image Python 3.11-slim เพื่อความเสถียรและเบาในการดึง Rust compile dependencies
FROM python:3.11-slim

WORKDIR /app

# ติดตั้ง System dependencies ที่อาจจำเป็นในการรัน SQLAlchemy กับ MySQL/PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmariadb-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# คัดลอกและติดตั้ง Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกซอร์สโค้ดของ backend ทั้งหมด
# หมายเหตุ: ในโฟลเดอร์ root จะรัน backend เสมือนเป็น module
COPY . /app/backend

# กำหนดให้ทำงานในโฟลเดอร์หลักเพื่อให้ module backend ค้นหากันเจอ
WORKDIR /app

# เปิดพอร์ต API
EXPOSE 8000

# สั่งรัน Uvicorn API Server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
