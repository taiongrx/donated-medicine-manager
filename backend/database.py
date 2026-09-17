import os
try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = None

# อ่านการตั้งค่าจาก secrets.toml หากไฟล์อยู่ล่างสุด หรือโฟลเดอร์หลัก
secrets_paths = [
    os.path.join(os.path.dirname(__file__), "..", "secrets.toml"),
    os.path.join(os.path.dirname(__file__), "..", ".streamlit", "secrets.toml"),
    os.path.join(os.path.dirname(__file__), "secrets.toml"),
]

for sp in secrets_paths:
    if os.path.exists(sp):
        try:
            with open(sp, "rb") as f:
                data = tomllib.load(f)
                if "database" in data:
                    db_cfg = data["database"]
                    if "url" in db_cfg:
                        DATABASE_URL = db_cfg["url"]
                    elif "host" in db_cfg:
                        user = db_cfg.get("user", "sa")
                        password = db_cfg.get("password", "sa")
                        host = db_cfg.get("host", "192.168.0.251")
                        port = db_cfg.get("port", 3306)
                        name = db_cfg.get("name", "hos")
                        DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"
                break
        except Exception:
            pass

if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://sa:sa@192.168.0.251:3306/hos")


# Production Database Guard: Connection Pooling & Timeout rules
is_mysql = DATABASE_URL.startswith("mysql")
engine = None
DB_MODE = "hosxp_mysql" if is_mysql else "local_sqlite"

if is_mysql:
    try:
        # ทดสอบเชื่อมต่อ MySQL ด้วย timeout สั้น (3 วินาที)
        test_kwargs = {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
            "connect_args": {"connect_timeout": 3}
        }
        test_engine = create_engine(DATABASE_URL, **test_kwargs)
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        DB_MODE = "hosxp_mysql"
        print("[DB] เชื่อมต่อฐานข้อมูล HOSxP MySQL สำเร็จเรียบร้อย")
    except Exception as err:
        print(f"[DB WARN] ไม่สามารถติดต่อฐานข้อมูล HOSxP ได้ ({err}) -> สลับเข้าสู่โหมด Offline BCP (Local SQLite)...")
        DB_MODE = "local_sqlite_fallback"

if not engine:
    os.makedirs("./data", exist_ok=True)
    DATABASE_URL = "sqlite:///./data/donated_medicine_local.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    if DB_MODE != "local_sqlite_fallback":
        DB_MODE = "local_sqlite"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ฟังก์ชันดึง Session Database สำหรับใช้กับ FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
