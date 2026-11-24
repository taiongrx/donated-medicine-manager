import os
from urllib.parse import quote_plus

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


def _load_database_url() -> str:
    """โหลดค่าการเชื่อมต่อ HOSxP MySQL จาก secrets.toml หรือ Environment Variables เท่านั้น (Zero Mockup Policy)"""
    # 1. ตรวจสอบจาก secrets.toml
    secrets_paths = [
        os.path.join(os.path.dirname(__file__), "..", "secrets.toml"),
        os.path.join(os.path.dirname(__file__), "..", ".streamlit", "secrets.toml"),
        os.path.join(os.path.dirname(__file__), "secrets.toml"),
    ]

    if tomllib is not None:
        for sp in secrets_paths:
            if os.path.exists(sp):
                with open(sp, "rb") as f:
                    data = tomllib.load(f)
                db_cfg = data.get("database")
                if isinstance(db_cfg, dict):
                    if db_cfg.get("url"):
                        return str(db_cfg["url"]).strip()
                    if db_cfg.get("host") and db_cfg.get("user"):
                        driver = db_cfg.get("driver", "mysql+pymysql")
                        user = quote_plus(str(db_cfg["user"]))
                        password = quote_plus(str(db_cfg.get("password", "")))
                        host = str(db_cfg["host"])
                        port = int(db_cfg.get("port", 3306))
                        name = str(db_cfg.get("name", "hos"))
                        return f"{driver}://{user}:{password}@{host}:{port}/{name}"

    # 2. ตรวจสอบจาก Environment Variable DATABASE_URL
    env_url = os.getenv("DATABASE_URL", "").strip()
    if env_url:
        return env_url

    # 3. ตรวจสอบจาก Environment Variables แยกฟิลด์ (รองรับการ inject จาก MEDUSA AI+)
    db_host = os.getenv("DB_HOST", "").strip()
    db_user = os.getenv("DB_USER", "").strip()
    if db_host and db_user:
        db_password = quote_plus(os.getenv("DB_PASSWORD", ""))
        db_port = int(os.getenv("DB_PORT", "3306"))
        db_name = os.getenv("DB_NAME", "hos").strip()
        return f"mysql+pymysql://{quote_plus(db_user)}:{db_password}@{db_host}:{db_port}/{db_name}"

    raise RuntimeError(
        "ไม่พบการตั้งค่าฐานข้อมูล HOSxP MySQL กรุณาสร้างไฟล์ secrets.toml หรือตั้งค่าตัวแปร DATABASE_URL / DB_HOST (ห้ามใช้ Mock/SQLite Fallback)"
    )


DATABASE_URL = _load_database_url()

if not DATABASE_URL.startswith("mysql"):
    raise RuntimeError(
        "Zero Mockup Policy: ระบบรองรับเฉพาะฐานข้อมูล HOSxP MySQL/MariaDB จริงเท่านั้น (ไม่อนุญาตให้ใช้ SQLite หรือ Mock DB)"
    )

DB_MODE = "hosxp_mysql"

# Production Database Guard: Connection Pooling & Timeout rules
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)

try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[DB] เชื่อมต่อฐานข้อมูล HOSxP MySQL สำเร็จเรียบร้อย")
except Exception as err:
    print(f"[DB ERROR] ไม่สามารถติดต่อฐานข้อมูล HOSxP MySQL ได้ในขณะนี้: {err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """ฟังก์ชันดึง Session Database สำหรับใช้กับ FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
