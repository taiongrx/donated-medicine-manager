from .database import engine, Base
from . import models

# ตารางเฉพาะของระบบคลังยาบริจาคเท่านั้น (ห้ามแก้ไขหรือสร้างทับตารางหลักของ HOSxP)
APP_TABLES = [
    models.PatientConsent.__table__,
    models.DonatedInventory.__table__,
    models.StockMovement.__table__,
    models.DonatedLocalDrugItem.__table__,
    models.ConsentItem.__table__,
]


def init_database():
    """สร้างโครงสร้างตารางเฉพาะของระบบคลังยาบริจาคใน HOSxP MySQL (Zero Mockup Policy: ไม่ป้อน Mock Data)"""
    print("กำลังตรวจสอบและสร้างตารางระบบคลังยาบริจาค (donated_*) ในฐานข้อมูล HOSxP...")
    Base.metadata.create_all(bind=engine, tables=APP_TABLES)
    print("ตรวจสอบโครงสร้างตารางระบบคลังยาบริจาคเรียบร้อยแล้ว (Zero Mockup Policy)")


if __name__ == "__main__":
    init_database()
