import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Text, Numeric, ForeignKey
from .database import Base

# =====================================================================
# 1. ตารางจำลองข้อมูล HOSxP เดิม (Read-Only ในการใช้งานจริง)
# =====================================================================

class HOSxPPatient(Base):
    """ตารางประวัติคนไข้ดั้งเดิมของ HOSxP"""
    __tablename__ = 'patient'
    
    hn = Column(String(20), primary_key=True, index=True)
    fname = Column(String(50))
    lname = Column(String(50))
    # ฟิลด์อื่นๆ ของโรงพยาบาลในตาราง patient
    sex = Column(String(1), nullable=True)
    birthday = Column(Date, nullable=True)

class HOSxPDrugItem(Base):
    """ตารางรายการยาทั้งหมดของ HOSxP (s_drugitems)"""
    __tablename__ = 's_drugitems'
    
    icode = Column(String(7), primary_key=True, index=True)
    name = Column(String(150))          # ชื่อยาทั้ง Generic + Trade เช่น Paracetamol 500 mg tab
    strength = Column(String(50), nullable=True)
    units = Column(String(50), nullable=True)
    unitprice = Column('unitprice', Float, default=0.0) # ราคาในฐาน HOSxP จริง (s_drugitems.unitprice)

    @property
    def unitcost(self) -> float:
        return self.unitprice or 0.0


class HOSxPOpdUser(Base):
    """ตารางผู้ใช้งานระบบดั้งเดิมของ HOSxP (opduser) สำหรับตรวจสอบสิทธิ์เข้าใช้งาน"""
    __tablename__ = 'opduser'
    
    loginname = Column(String(50), primary_key=True, index=True)
    name = Column(String(150))
    passweb = Column(String(100), nullable=True)
    password = Column(String(100), nullable=True)
    entryposition = Column(String(100), nullable=True)
    groupname = Column(String(50), nullable=True)


# =====================================================================
# 2. ตารางใหม่สำหรับระบบจัดการคลังยาบริจาค (สร้างเพิ่มในฐานข้อมูล)
# =====================================================================

class PatientConsent(Base):
    """ตารางเก็บใบยินยอมการบริจาค/คืนยาของผู้ป่วย"""
    __tablename__ = 'donated_patient_consent'
    
    consent_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consent_date = Column(DateTime, default=datetime.utcnow)
    hn = Column(String(20), index=True)
    patient_name = Column(String(100))
    consent_signed = Column(Boolean, default=True)
    officer_name = Column(String(100))
    # รหัสอ้างอิงสุ่มบน Consent Sticker (เช่น PC-260717-0012) เพื่อใช้จับคู่ทางกายภาพกับถุงยา
    print_reference_code = Column(String(20), unique=True, index=True)
    status = Column(String(20), default="pending_items")  # pending_items | completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, index=True)

class DonatedInventory(Base):
    """ตารางรายการคลังยาบริจาค (Anonymous - ไม่มี Link ตรงหาประวัติผู้ป่วยในฐานข้อมูลดิจิทัล)"""
    __tablename__ = 'donated_inventory'
    
    inventory_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    icode = Column(String(7), index=True)                # ลิงก์กับ s_drugitems.icode
    lot_number = Column(String(50))
    expiration_date = Column(Date)
    quantity_received = Column(Integer)
    quantity_remaining = Column(Integer)
    unit_price_at_receive = Column(Float)
    total_value = Column(Float)
    received_date = Column(Date, default=date.today)
    source_type = Column(String(50), default="คืนจากผู้ป่วย")
    status = Column(String(20), default="pending_inspect") # pending_inspect | active (โอนเข้าชั้นแล้ว) | disposed (ทำลายทิ้ง)
    inspector_name = Column(String(100), nullable=True)    # ผู้ตรวจรับพัสดุบริจาค
    inspected_at = Column(DateTime, nullable=True)
    print_reference_code = Column(String(20), index=True)  # รหัสอ้างอิงสุ่ม เชื่อมความสัมพันธ์ทางกายภาพ (Sticker)
    brand_name = Column(String(100), nullable=True)  # ยี่ห้อของเวชภัณฑ์ที่คีย์รับเข้า
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, index=True)

class StockMovement(Base):
    """ตารางประวัติความเคลื่อนไหวสต็อก (Stock Card / Audit Trail สำหรับ สตง.)"""
    __tablename__ = 'donated_stock_movement'
    
    movement_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_id = Column(String(36), index=True)
    transaction_type = Column(String(20))                  # receive | inspect_approve | shelve (โอนเข้าชั้นวาง) | dispose (ทำลาย) | adjust_add | adjust_sub
    quantity = Column(Integer)
    value = Column(Float)
    action_date = Column(DateTime, default=datetime.utcnow)
    performed_by = Column(String(100))                     # เจ้าหน้าที่ที่ทำรายการ
    doc_reference = Column(String(100), nullable=True)      # อ้างอิงเลขที่หนังสืออนุมัติ หรือใบเบิก/ใบโอนย้าย
    remarks = Column(Text, nullable=True)
    print_reference_code = Column(String(20), nullable=True, index=True)  # เพิ่มรหัสใบยินยอมใน Movement เพื่อเป็น Audit Trail ย้อนรอย
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, index=True)



class DonatedLocalDrugItem(Base):
    """ตารางสำเนาสำหรับเก็บรายการยาหลักและราคากลางพัสดุ ดึงซิงค์มาจาก s_drugitems (HOSxP) ทุกเที่ยงคืน"""
    __tablename__ = 'donated_local_drugitems'
    
    icode = Column(String(7), primary_key=True, index=True)
    name = Column(String(150))
    strength = Column(String(50), nullable=True)
    units = Column(String(50), nullable=True)
    unitcost = Column(Float, default=0.0)
    last_sync = Column(DateTime, default=datetime.utcnow)


class ConsentItem(Base):
    """ตารางรายการเวชภัณฑ์บริจาคที่คีย์จากหน้าต่างจ่ายยาแบบชั่วคราว (ยังไม่ระบุ Lot/Exp เพื่อความรวดเร็ว)"""
    __tablename__ = 'donated_consent_items'
    
    item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consent_code = Column(String(20), index=True)  # ผูกกับ print_reference_code ของ PatientConsent
    icode = Column(String(20), index=True)
    drug_name = Column(String(150), nullable=True)
    units = Column(String(50), nullable=True)
    quantity = Column(Integer)


class HOSxPOpitemrece(Base):
    """ตารางประวัติการสั่งยา/ค่ารักษาพยาบาลเดิมของ HOSxP (opitemrece)"""
    __tablename__ = 'opitemrece'
    
    hos_guid = Column(String(38), primary_key=True)
    hn = Column(String(20), index=True)
    vn = Column(String(13), index=True, nullable=True)
    vstdate = Column(Date, index=True, nullable=True)
    icode = Column(String(7), index=True)
    qty = Column(Float, default=1.0)
    unitprice = Column(Float, default=0.0)



