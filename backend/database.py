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


# หากใช้ SQLite จะต้องมี argument check_same_thread=False
connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
else:

    # Production Database Guard: Connection Pooling & Timeout rules
    engine_kwargs = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }

engine = create_engine(
    DATABASE_URL, connect_args=connect_args, **engine_kwargs
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ฟังก์ชันดึง Session Database สำหรับใช้กับ FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
