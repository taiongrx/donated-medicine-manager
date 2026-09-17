from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

# =====================================================================
# HOSxP Schema
# =====================================================================

class PatientResponse(BaseModel):
    hn: str
    fname: str
    lname: str
    sex: Optional[str] = None
    birthday: Optional[date] = None

    class Config:
        from_attributes = True

class DrugItemResponse(BaseModel):
    icode: str
    name: str
    strength: Optional[str] = None
    units: Optional[str] = None
    unitcost: Optional[float] = 0.0
    active: Optional[str] = "Y"

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    username: str
    name: str
    role: str
    dept: str
    source: str

class OfficerResponse(BaseModel):
    loginname: str
    name: str
    entryposition: Optional[str] = None
    groupname: Optional[str] = None

    class Config:
        from_attributes = True



# =====================================================================
# Donated Patient Consent Schema
# =====================================================================

class ConsentItemCreate(BaseModel):
    icode: str
    quantity: int

class ConsentItemResponse(BaseModel):
    item_id: str
    consent_code: str
    icode: str
    drug_name: Optional[str] = None
    quantity: int
    units: Optional[str] = None
    unitcost: Optional[float] = 0.0
    preset_lot_number: Optional[str] = ""
    preset_expiration_date: Optional[str] = ""
    preset_brand_name: Optional[str] = ""

    class Config:
        from_attributes = True

class ConsentCreate(BaseModel):
    hn: str
    patient_name: str
    officer_name: str
    items: List[ConsentItemCreate]

class ConsentResponse(BaseModel):
    consent_id: str
    consent_date: datetime
    hn: str
    patient_name: str
    consent_signed: bool
    officer_name: str
    print_reference_code: str
    status: str
    items: Optional[List[ConsentItemResponse]] = None

    class Config:
        from_attributes = True

class ConsentReconcileItem(BaseModel):
    icode: str
    lot_number: str
    expiration_date: date
    quantity: int
    brand_name: Optional[str] = ""

class ConsentReconcileRequest(BaseModel):
    inspector_name: str
    source_type: str = "คืนจากผู้ป่วยเนื่องจากเหลือใช้ที่บ้าน"
    items: List[ConsentReconcileItem]


# Donated Inventory Schema
# =====================================================================

class MedicineItemCreate(BaseModel):
    icode: str
    lot_number: str
    expiration_date: date
    quantity_received: int
    source_type: str = "คืนจากผู้ป่วย"

class InventoryCreate(BaseModel):
    print_reference_code: str
    items: List[MedicineItemCreate]
    inspector_name: str

class InventoryResponse(BaseModel):
    inventory_id: str
    icode: str
    brand_name: Optional[str] = ""
    drug_name: Optional[str] = None  # จะ Join ชื่อยามาแสดงผล
    unit: Optional[str] = None       # Join หน่วยนับมาแสดง
    lot_number: str
    expiration_date: date
    quantity_received: int
    quantity_remaining: int
    unit_price_at_receive: float
    total_value: float
    received_date: date
    source_type: str
    status: str
    inspector_name: Optional[str] = None
    inspected_at: Optional[datetime] = None
    print_reference_code: str

    class Config:
        from_attributes = True

class InventoryShelveRequest(BaseModel):
    quantity_to_shelve: int
    performed_by: str
    doc_reference: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDisposeRequest(BaseModel):
    quantity_to_dispose: int
    performed_by: str
    doc_reference: str  # บังคับใส่เลขที่หนังสือสั่งการอนุมัติทำลายพัสดุ
    remarks: str        # บังคับระบุหมายเหตุทำลาย

# =====================================================================
# Stock Movement & Audit Log Schema
# =====================================================================

class StockMovementResponse(BaseModel):
    movement_id: str
    inventory_id: str
    icode: Optional[str] = None
    drug_name: Optional[str] = None
    lot_number: Optional[str] = None
    transaction_type: str
    quantity: int
    value: float
    action_date: datetime
    performed_by: str
    doc_reference: Optional[str] = None
    remarks: Optional[str] = None
    print_reference_code: Optional[str] = None


    class Config:
        from_attributes = True

# =====================================================================
# Dashboard Summary Schema
# =====================================================================

class DashboardSummaryResponse(BaseModel):
    total_value_received: float
    total_value_shelved: float
    total_value_remaining: float
    total_items_pending: int
    total_items_shelved: int
    total_items_expired_warning: int  # ยาหมดอายุภายใน 6 เดือน


# =====================================================================
# Bulk Actions Schema
# =====================================================================

class BulkShelveItem(BaseModel):
    inventory_id: str
    quantity_to_shelve: int

class BulkShelveRequest(BaseModel):
    items: List[BulkShelveItem]
    performed_by: str
    doc_reference: Optional[str] = None
    remarks: Optional[str] = None

class BulkDisposeItem(BaseModel):
    inventory_id: str
    quantity_to_dispose: int

class BulkDisposeRequest(BaseModel):
    items: List[BulkDisposeItem]
    performed_by: str
    doc_reference: str
    remarks: str

