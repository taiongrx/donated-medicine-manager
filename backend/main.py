import random
import csv
from datetime import datetime, date, timedelta
from io import StringIO
from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from .database import get_db, engine
from . import models, schemas

from fastapi.responses import JSONResponse
from sqlalchemy import text
from .logging_config import logger

app = FastAPI(title="Donated Medicine Manager API - รพ.สมเด็จพระยุพราชสายบุรี")

# เปิดใช้งาน CORS สำหรับการเชื่อมโยงข้ามพอร์ตในฝั่งพัฒนา
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler สำหรับ Uniform Error Envelope ตามมาตรฐาน Directives
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "details": getattr(exc, "headers", None)
            }
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled system error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "เกิดข้อผิดพลาดภายในระบบ กรุณาติดต่อผู้ดูแลระบบสารสนเทศ",
                "details": None
            }
        }
    )

# Health & Readiness Probes (Directive 7)
@app.get("/healthz", status_code=200)
def healthz():
    """Liveness probe สำหรับ Orchestrator เช็คสถานะตัว Service"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}

@app.get("/readyz", status_code=200)
def readyz(db: Session = Depends(get_db)):
    """Readiness probe สำหรับเช็คความพร้อมของ Database connection"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        raise HTTPException(status_code=503, detail="Database connection failed")

@app.on_event("startup")
def startup_event():
    """เริ่มต้นโครงสร้างฐานข้อมูล และท่อส่งข้อมูล Data Sync Pipeline ซิงค์ HOSxP ทุกเที่ยงคืน"""
    logger.info("Application starting up...")
    from .init_db import init_database
    try:
        init_database()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    from .scheduler import start_sync_scheduler
    start_sync_scheduler()


import hashlib

# =====================================================================
# 1. APIs สำหรับสืบค้นและยืนยันตัวตนจาก HOSxP Database (opduser, patient, s_drugitems)
# =====================================================================

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login_user(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """ตรวจสอบสิทธิ์เข้าใช้งานผ่านฐานข้อมูลเจ้าหน้าที่ HOSxP (opduser) ดึงข้อมูลจริงจากตารางเท่านั้น"""
    username_clean = payload.username.strip().lower()
    user = db.query(models.HOSxPOpdUser).filter(func.lower(models.HOSxPOpdUser.loginname) == username_clean).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="ไม่พบชื่อผู้ใช้งานนี้ในฐานข้อมูล HOSxP (opduser)")
    
    # ตรวจสอบรหัสผ่าน (รองรับทั้ง Plain Text และ MD5 Hash)
    input_pass = payload.password
    input_md5 = hashlib.md5(input_pass.encode()).hexdigest()
    
    match_pass = (user.password and (user.password == input_pass or user.password.lower() == input_md5))
    match_passweb = (user.passweb and (user.passweb == input_pass or user.passweb.lower() == input_md5))
    
    if not (match_pass or match_passweb):
        raise HTTPException(status_code=401, detail="รหัสผ่าน HOSxP ไม่ถูกต้อง")
        
    return schemas.LoginResponse(
        username=user.loginname,
        name=user.name or user.loginname,
        role=user.entryposition or "เจ้าหน้าที่ปฏิบัติงาน",
        dept=user.groupname or "กลุ่มงานเภสัชกรรม",
        source="hosxp_db"
    )

@app.get("/api/officers", response_model=List[schemas.OfficerResponse])
def get_hosxp_officers(db: Session = Depends(get_db)):
    """ดึงรายชื่อเจ้าหน้าที่ทั้งหมดจากฐานข้อมูล HOSxP (opduser) สำหรับนำไปเลือกในเมนูตั้งค่าผู้ลงนาม"""
    users = db.query(models.HOSxPOpdUser).filter(
        models.HOSxPOpdUser.name != None,
        models.HOSxPOpdUser.name != ''
    ).order_by(models.HOSxPOpdUser.name.asc()).all()
    return users


@app.get("/api/positions", response_model=List[str])
def get_hosxp_positions(db: Session = Depends(get_db)):
    """ดึงตำแหน่งทางราชการทั้งหมดจากฐานข้อมูล HOSxP (opduser.entryposition) แบบไม่ซ้ำ"""
    positions = db.query(models.HOSxPOpdUser.entryposition).distinct().filter(
        models.HOSxPOpdUser.entryposition != None,
        models.HOSxPOpdUser.entryposition != ''
    ).order_by(models.HOSxPOpdUser.entryposition.asc()).all()
    return [p[0] for p in positions if p[0]]




def format_hn(hn: str) -> str:
    """แปลงและเติมเลข 0 หน้า HN ที่เป็นตัวเลขให้ครบ 7 หลักโดยอัตโนมัติ"""
    if not hn:
        return ""
    cleaned = hn.strip()
    if cleaned.isdigit() and len(cleaned) <= 7:
        return cleaned.zfill(7)
    return cleaned


@app.get("/api/patients/{hn}", response_model=schemas.PatientResponse)
def get_patient_profile(hn: str, db: Session = Depends(get_db)):
    """ค้นหาข้อมูลประวัติผู้ป่วยจาก HOSxP ด้วย HN (รองรับการเติม 0 ให้ครบ 7 หลักอัตโนมัติ)"""
    formatted_hn = format_hn(hn)
    patient = db.query(models.HOSxPPatient).filter(
        (models.HOSxPPatient.hn == hn.strip()) | (models.HOSxPPatient.hn == formatted_hn)
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลผู้ป่วยรายนี้ในระบบ HOSxP")
    return patient

@app.get("/api/drugs", response_model=List[schemas.DrugItemResponse])
def search_drugs(q: str = Query("", description="คำค้นหาชื่อยา"), db: Session = Depends(get_db)):
    """สืบค้นรายการยาและราคาพัสดุจากตาราง local หรือ HOSxP (s_drugitems) เพื่อให้คำค้นหาแนะนำยาได้ทันที"""
    query = db.query(models.DonatedLocalDrugItem)
    if q:
        query = query.filter(models.DonatedLocalDrugItem.name.like(f"%{q}%"))
    results = query.limit(30).all()
    
    # หากตาราง local ยังไม่มีข้อมูล ให้สืบค้นจากตาราง s_drugitems ของ HOSxP โดยตรง
    if not results:
        hos_query = db.query(models.HOSxPDrugItem)
        if q:
            hos_query = hos_query.filter(models.HOSxPDrugItem.name.like(f"%{q}%"))
        hos_items = hos_query.limit(30).all()
        results = [
            schemas.DrugItemResponse(
                icode=item.icode,
                name=item.name,
                unitcost=item.unitcost or 0.0,
                units=item.units or "เม็ด"
            ) for item in hos_items
        ]
    return results

@app.post("/api/drugs/sync")
def manual_sync_drugs(db: Session = Depends(get_db)):
    """สั่งซิงค์ราคายาและรายการยาจาก HOSxP (s_drugitems) ทันทีด้วยมือ (Manual Sync)"""
    from .scheduler import sync_hosxp_drugitems
    count = sync_hosxp_drugitems(db)
    return {"message": "ซิงค์ข้อมูลยากลางจาก HOSxP สำเร็จเรียบร้อย", "updated_count": count}


# =====================================================================
# 2. APIs บันทึกข้อมูลใบยินยอม (Patient Consent - Step 1)
# =====================================================================

def format_consent_response(consent, db: Session):
    """ฟังก์ชันช่วยเหลือสำหรับดึงรายการยาในใบยินยอมและ Join รายละเอียดชื่อยาและราคากลาง HOSxP พร้อมดึงประวัติล็อตล่าสุดมาพรีเซ็ตแนะนำ"""
    items = db.query(models.ConsentItem).filter(models.ConsentItem.consent_code == consent.print_reference_code).all()
    
    formatted_items = []
    for item in items:
        drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == item.icode).first()
        
        # ดึงล็อตล่าสุดที่คีย์สำเร็จเข้าคลังบริจาคมาพรีเซ็ตอัตโนมัติ (Lean Step)
        last_inv = db.query(models.DonatedInventory).filter(
            models.DonatedInventory.icode == item.icode
        ).order_by(models.DonatedInventory.received_date.desc()).first()
        
        preset_lot = last_inv.lot_number if last_inv else ""
        preset_exp = last_inv.expiration_date.strftime('%Y-%m-%d') if (last_inv and last_inv.expiration_date) else ""
        preset_brand = last_inv.brand_name if (last_inv and last_inv.brand_name) else ""
        
        formatted_items.append(schemas.ConsentItemResponse(
            item_id=item.item_id,
            consent_code=item.consent_code,
            icode=item.icode,
            drug_name=drug.name if drug else "ไม่พบรายการยา",
            quantity=item.quantity,
            units=drug.units if drug else "เม็ด",
            unitcost=drug.unitcost if drug else 0.0,
            preset_lot_number=preset_lot,
            preset_expiration_date=preset_exp,
            preset_brand_name=preset_brand
        ))
        
    resp = schemas.ConsentResponse.model_validate(consent)
    resp.items = formatted_items
    return resp


@app.post("/api/consents", response_model=schemas.ConsentResponse)
def create_patient_consent(consent: schemas.ConsentCreate, db: Session = Depends(get_db)):
    """สร้างหนังสือแสดงความยินยอม (Consent) และบันทึกรายการยาที่รับมอบ (ยังไม่ระบุ Lot/Exp) เพื่อพิมพ์บนฉลากความร้อน"""
    # ตรวจสอบคนไข้ก่อนเพื่อความถูกต้อง (รองรับ 7 หลักอัตโนมัติ)
    formatted_hn = format_hn(consent.hn)
    patient = db.query(models.HOSxPPatient).filter(
        (models.HOSxPPatient.hn == consent.hn.strip()) | (models.HOSxPPatient.hn == formatted_hn)
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="ไม่พบ HN ผู้ป่วยในระบบ HOSxP")
        
    # สุ่มรหัสพิมพ์สติ๊กเกอร์ความปลอดภัย (Format: PC-YYMMDD-XXXX)
    today_str = datetime.today().strftime('%y%m%d')
    random_num = random.randint(1000, 9999)
    print_code = f"PC-{today_str}-{random_num}"
    
    # ตรวจสอบเพื่อป้องกันการซ้ำซ้อน
    while db.query(models.PatientConsent).filter(models.PatientConsent.print_reference_code == print_code).first():
        random_num = random.randint(1000, 9999)
        print_code = f"PC-{today_str}-{random_num}"

    db_consent = models.PatientConsent(
        hn=formatted_hn,
        patient_name=consent.patient_name,
        officer_name=consent.officer_name,
        print_reference_code=print_code,
        status="pending_items" # รอการตรวจสอบสภาพคลังหลังบ้าน
    )
    db.add(db_consent)
    db.commit()
    db.refresh(db_consent)
    
    # บันทึกรายการยาลงตารางพักข้อมูลชั่วคราว
    for item in consent.items:
        db_item = models.ConsentItem(
            consent_code=print_code,
            icode=item.icode,
            quantity=item.quantity
        )
        db.add(db_item)
    db.commit()
    
    return format_consent_response(db_consent, db)

@app.get("/api/consents/pending", response_model=List[schemas.ConsentResponse])
def get_pending_consents(db: Session = Depends(get_db)):
    """ดึงรายการใบยินยอมที่เพิ่งสร้างหน้าต่างจ่ายยา และกำลังรอตรวจสอบและคัดกรอก Lot/Exp หลังบ้าน"""
    consents = db.query(models.PatientConsent).filter(models.PatientConsent.status == "pending_items").order_by(models.PatientConsent.consent_date.desc()).all()
    return [format_consent_response(c, db) for c in consents]

@app.get("/api/consents/{code}", response_model=schemas.ConsentResponse)
def get_consent_by_code(code: str, db: Session = Depends(get_db)):
    """ดึงข้อมูลใบยินยอมและรายการยาของใบนั้นตามรหัสอ้างอิงบนสติ๊กเกอร์"""
    consent = db.query(models.PatientConsent).filter(models.PatientConsent.print_reference_code == code).first()
    if not consent:
        raise HTTPException(status_code=404, detail="ไม่พบรหัสสติ๊กเกอร์ใบยินยอมนี้ในระบบ")
    return format_consent_response(consent, db)

@app.post("/api/consents/{code}/reconcile", response_model=List[schemas.InventoryResponse])
def reconcile_consent_bag(code: str, req_data: schemas.ConsentReconcileRequest, db: Session = Depends(get_db)):
    """จพ.เภสัช ตรวจเช็คสภาพและกรอก Lot/Exp ยาบริจาคในถุง เพื่อนำเข้าคลังจริงและทำลาย (Reconciliation)"""
    consent = db.query(models.PatientConsent).filter(
        models.PatientConsent.print_reference_code == code
    ).first()
    if not consent:
        raise HTTPException(status_code=404, detail="ไม่พบรหัสใบยินยอมอ้างอิง")
        
    if consent.status == "completed":
        raise HTTPException(status_code=400, detail="ใบยินยอมรหัสนี้ได้รับการตรวจสอบและคีย์รับเข้ารวมคลังไปเรียบร้อยแล้ว")
        
    response_items = []
    
    # วนลูปรายการยาที่ผ่านการคัดกรอง เติม Lot/Exp
    for item in req_data.items:
        drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == item.icode).first()
        if not drug:
            continue
            
        unit_price = drug.unitcost
        total_val = float(item.quantity) * unit_price
        
        # ค้นหาเพื่อสะสมรวมยอดตามล็อตหลัก (Upsert) ในคลังบริจาค (ตารางคลังหลัก)
        db_inv = db.query(models.DonatedInventory).filter(
            models.DonatedInventory.icode == item.icode,
            models.DonatedInventory.lot_number == item.lot_number,
            models.DonatedInventory.brand_name == item.brand_name,
            models.DonatedInventory.expiration_date == item.expiration_date,
            models.DonatedInventory.status == "pending_inspect"
        ).first()
        
        if db_inv:
            db_inv.quantity_received += item.quantity
            db_inv.quantity_remaining += item.quantity
            db_inv.total_value += total_val
            db_inv.inspector_name = req_data.inspector_name
            db_inv.inspected_at = datetime.utcnow()
            db_inv.print_reference_code = code
            db.commit()
            db.refresh(db_inv)
        else:
            db_inv = models.DonatedInventory(
                icode=item.icode,
                lot_number=item.lot_number,
                brand_name=item.brand_name,
                expiration_date=item.expiration_date,
                quantity_received=item.quantity,
                quantity_remaining=item.quantity,
                unit_price_at_receive=unit_price,
                total_value=total_val,
                source_type=req_data.source_type,
                status="pending_inspect",
                inspector_name=req_data.inspector_name,
                inspected_at=datetime.utcnow(),
                print_reference_code=code
            )
            db.add(db_inv)
            db.commit()
            db.refresh(db_inv)
            
        # บันทึก Stock Movement (ประเภทรับของ) แยกตามใบยินยอมคนไข้จริงเสมอ เพื่อทำเป็น Audit Trail สตง.
        db_move = models.StockMovement(
            inventory_id=db_inv.inventory_id,
            transaction_type="receive",
            quantity=item.quantity,
            value=total_val,
            performed_by=req_data.inspector_name,
            print_reference_code=code,
            remarks=f"ตรวจรับและคัดแยกเวชภัณฑ์เข้าคลังสะสมจากถุงอ้างอิง {code}"
        )
        db.add(db_move)
        db.commit()
        
        resp_item = schemas.InventoryResponse.model_validate(db_inv)
        resp_item.drug_name = drug.name
        resp_item.unit = drug.units
        response_items.append(resp_item)
        
    # อัปเดตสถานะใบยินยอมหลักเป็น completed
    consent.status = "completed"
    db.commit()
    
    return response_items



@app.get("/api/inventories", response_model=List[schemas.InventoryResponse])
def list_inventories(
    status: Optional[str] = None,
    limit: int = Query(50, le=100, description="จำนวนรายการสูงสุดต่อหน้า"),
    offset: int = Query(0, ge=0, description="จุดเริ่มต้นดึงข้อมูล"),
    db: Session = Depends(get_db)
):
    """ดึงรายการยาในคลังบริจาค พร้อมจำกัดจำนวนข้อมูล (Pagination) และ Batch Select เพื่อป้องกัน N+1 Query"""
    query = db.query(models.DonatedInventory).filter(models.DonatedInventory.deleted_at == None)
    if status:
        query = query.filter(models.DonatedInventory.status == status)
        
    results = query.order_by(models.DonatedInventory.received_date.desc()).offset(offset).limit(limit).all()
    
    # Batch Query HOSxPDrugItem เพื่อหลีกเลี่ยง N+1 Query Problem
    icodes = {inv.icode for inv in results if inv.icode}
    drug_map = {}
    if icodes:
        drugs = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode.in_(icodes)).all()
        drug_map = {d.icode: d for d in drugs}

    response_list = []
    for inv in results:
        resp_item = schemas.InventoryResponse.model_validate(inv)
        drug = drug_map.get(inv.icode)
        if drug:
            resp_item.drug_name = drug.name
            resp_item.unit = drug.units
        response_list.append(resp_item)
        
    return response_list


# =====================================================================
# 4. APIs โอนย้ายเข้าชั้นวาง และตัดจำหน่ายทำลายพัสดุ (Step 3 & สตง.)
# =====================================================================

@app.post("/api/inventories/{inv_id}/shelve", response_model=schemas.InventoryResponse)
def shelve_medicine(inv_id: str, req: schemas.InventoryShelveRequest, db: Session = Depends(get_db)):
    """ตัดยอดคลังบริจาค ย้ายขึ้นชั้นวางยาพร้อมจ่ายต่อ เพื่อให้ถูกต้องตามระเบียบพัสดุ"""
    inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="ไม่พบรายการยาบริจาครายการนี้")
        
    if req.quantity_to_shelve <= 0:
        raise HTTPException(status_code=400, detail="จำนวนที่จะโอนขึ้นชั้นวางต้องมากกว่า 0")
        
    if req.quantity_to_shelve > inv.quantity_remaining:
        raise HTTPException(status_code=400, detail=f"จำนวนที่ระบุเกินจำนวนยาคงเหลือในคลังบริจาค (คงเหลือ {inv.quantity_remaining})")
        
    # หักยอดคลังบริจาค
    inv.quantity_remaining -= req.quantity_to_shelve
    
    # หากโอนหมดแล้ว เปลี่ยนสถานะเป็น active
    if inv.quantity_remaining == 0:
        inv.status = "active"
    else:
        # หากทยอยย้าย ก็ให้อยู่สถานะกึ่งกลาง
        inv.status = "active" # หรือคงไว้ pending แล้วให้โอนต่อได้
        
    db.commit()
    
    # บันทึกการเคลื่อนไหว Stock Movement (ประเภทโอนขึ้นชั้น)
    move_val = float(req.quantity_to_shelve) * inv.unit_price_at_receive
    db_move = models.StockMovement(
        inventory_id=inv.inventory_id,
        transaction_type="shelve",
        quantity=req.quantity_to_shelve,
        value=move_val,
        performed_by=req.performed_by,
        doc_reference=req.doc_reference,
        remarks=req.remarks or "โอนย้ายเวชภัณฑ์เข้าชั้นวางยาคลังย่อยเพื่อจ่ายต่อ"
    )
    db.add(db_move)
    db.commit()
    db.refresh(inv)
    
    # ส่งผลกลับ
    drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
    resp = schemas.InventoryResponse.model_validate(inv)
    if drug:
        resp.drug_name = drug.name
        resp.unit = drug.units
    return resp

@app.post("/api/inventories/{inv_id}/dispose", response_model=schemas.InventoryResponse)
def dispose_medicine(inv_id: str, req: schemas.InventoryDisposeRequest, db: Session = Depends(get_db)):
    """ทำลายพัสดุเสื่อมสภาพ/หมดอายุ ตัดจำหน่ายบัญชีและแนบเลขอ้างอิงอนุมัติเสนอ สตง."""
    inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="ไม่พบรายการยาบริจาครายการนี้")
        
    if req.quantity_to_dispose <= 0:
        raise HTTPException(status_code=400, detail="จำนวนที่จะตัดทำลายต้องมากกว่า 0")
        
    if req.quantity_to_dispose > inv.quantity_remaining:
        raise HTTPException(status_code=400, detail=f"จำนวนที่ระบุเกินจำนวนยาคงเหลือ (คงเหลือ {inv.quantity_remaining})")
        
    # หักยอดคลัง
    inv.quantity_remaining -= req.quantity_to_dispose
    
    # หากหักจนหมด เปลี่ยนสถานะเป็น disposed
    if inv.quantity_remaining == 0:
        inv.status = "disposed"
        
    db.commit()
    
    # บันทึก Stock Movement (ประเภททำลายพัสดุ)
    move_val = float(req.quantity_to_dispose) * inv.unit_price_at_receive
    db_move = models.StockMovement(
        inventory_id=inv.inventory_id,
        transaction_type="dispose",
        quantity=req.quantity_to_dispose,
        value=move_val,
        performed_by=req.performed_by,
        doc_reference=req.doc_reference, # เลขที่อนุมัติทำลาย
        remarks=req.remarks or "ตัดทำลายเวชภัณฑ์เนื่องจากหมดอายุ/เสื่อมสภาพ"
    )
    db.add(db_move)
    db.commit()
    db.refresh(inv)
    
    # ส่งผลกลับ
    drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
    resp = schemas.InventoryResponse.model_validate(inv)
    if drug:
        resp.drug_name = drug.name
        resp.unit = drug.units
    return resp

@app.post("/api/inventories/bulk-shelve", response_model=List[schemas.InventoryResponse])
def bulk_shelve_medicines(req: schemas.BulkShelveRequest, db: Session = Depends(get_db)):
    """โอนย้ายยาขึ้นชั้นวางครั้งละหลายๆ รายการพร้อมกัน เพื่อประหยัดเวลาของเจ้าหน้าที่"""
    response_items = []
    
    for item in req.items:
        inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == item.inventory_id).first()
        if not inv:
            continue
            
        if item.quantity_to_shelve <= 0:
            continue
            
        if item.quantity_to_shelve > inv.quantity_remaining:
            raise HTTPException(status_code=400, detail=f"จำนวนที่ระบุของยาล็อต {inv.lot_number} เกินยอดคงเหลือ")
            
        # หักยอดคงคลังบริจาค
        inv.quantity_remaining -= item.quantity_to_shelve
        
        # ปรับสถานะเป็น active (เนื่องจากย้ายขึ้นชั้นพร้อมจ่ายแล้ว)
        inv.status = "active"
        db.commit()
        
        # บันทึก Stock Movement
        move_val = float(item.quantity_to_shelve) * inv.unit_price_at_receive
        db_move = models.StockMovement(
            inventory_id=inv.inventory_id,
            transaction_type="shelve",
            quantity=item.quantity_to_shelve,
            value=move_val,
            performed_by=req.performed_by,
            doc_reference=req.doc_reference,
            remarks=req.remarks or "โอนย้ายเวชภัณฑ์เข้าชั้นวางยาคลังย่อยเพื่อจ่ายต่อ (แบบกลุ่ม)"
        )
        db.add(db_move)
        db.commit()
        db.refresh(inv)
        
        # แมปส่งกลับ
        drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
        resp = schemas.InventoryResponse.model_validate(inv)
        if drug:
            resp.drug_name = drug.name
            resp.unit = drug.units
        response_items.append(resp)
        
    return response_items

@app.post("/api/inventories/bulk-dispose", response_model=List[schemas.InventoryResponse])
def bulk_dispose_medicines(req: schemas.BulkDisposeRequest, db: Session = Depends(get_db)):
    """ทำลายพัสดุหมดอายุ/เสื่อมสภาพ พร้อมกันหลายรายการในเอกสารอนุมัติชุดเดียวกัน"""
    response_items = []
    
    for item in req.items:
        inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == item.inventory_id).first()
        if not inv:
            continue
            
        if item.quantity_to_dispose <= 0:
            continue
            
        if item.quantity_to_dispose > inv.quantity_remaining:
            raise HTTPException(status_code=400, detail=f"จำนวนที่ระบุตัดทำลายของยาล็อต {inv.lot_number} เกินยอดคงเหลือ")
            
        # หักยอดคงคลัง
        inv.quantity_remaining -= item.quantity_to_dispose
        
        if inv.quantity_remaining == 0:
            inv.status = "disposed"
            
        db.commit()
        
        # บันทึก Stock Movement
        move_val = float(item.quantity_to_dispose) * inv.unit_price_at_receive
        db_move = models.StockMovement(
            inventory_id=inv.inventory_id,
            transaction_type="dispose",
            quantity=item.quantity_to_dispose,
            value=move_val,
            performed_by=req.performed_by,
            doc_reference=req.doc_reference,
            remarks=req.remarks or "ตัดทำลายเวชภัณฑ์เนื่องจากหมดอายุ/เสื่อมสภาพ (แบบกลุ่ม)"
        )
        db.add(db_move)
        db.commit()
        db.refresh(inv)
        
        # แมปส่งกลับ
        drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
        resp = schemas.InventoryResponse.model_validate(inv)
        if drug:
            resp.drug_name = drug.name
            resp.unit = drug.units
        response_items.append(resp)
        
    return response_items


# =====================================================================
# 5. APIs สำหรับ Dashboard (ฟังก์ชัน 4)
# =====================================================================

@app.get("/api/dashboard/summary", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """ดึงข้อมูลวิเคราะห์สถิติมูลค่ายารวมและเตือนภัยยาหมดอายุประจำคลัง"""
    # 1. มูลค่ารวมที่ได้รับคืนมาทั้งหมด
    total_val_recv = db.query(func.sum(models.DonatedInventory.total_value)).scalar() or 0.0
    
    # 2. มูลค่ารวมที่โอนขึ้นชั้นวางแล้ว (รวมจาก Stock Movement ชนิด 'shelve')
    total_val_shelved = db.query(func.sum(models.StockMovement.value)).filter(
        models.StockMovement.transaction_type == 'shelve'
    ).scalar() or 0.0
    
    # 3. มูลค่าคงเหลือรอจัดสรร (คำนวณจาก remaining * unit_price ของตารางคงคลัง)
    total_val_rem = db.query(func.sum(models.DonatedInventory.quantity_remaining * models.DonatedInventory.unit_price_at_receive)).scalar() or 0.0
    
    # 4. จำนวนรายการรอกรรมการตรวจ/โอน
    pending_cnt = db.query(models.DonatedInventory).filter(models.DonatedInventory.status == 'pending_inspect').count()
    
    # 5. จำนวนรายการที่โอนขึ้นชั้นแล้ว
    active_cnt = db.query(models.DonatedInventory).filter(models.DonatedInventory.status == 'active').count()
    
    # 6. รายการยาใกล้หมดอายุ (ภายใน 6 เดือนนับจากวันนี้)
    six_months_later = date.today() + timedelta(days=180)
    expired_warning_cnt = db.query(models.DonatedInventory).filter(
        models.DonatedInventory.expiration_date <= six_months_later,
        models.DonatedInventory.quantity_remaining > 0,
        models.DonatedInventory.status != 'disposed'
    ).count()
    
    return {
        "total_value_received": total_val_recv,
        "total_value_shelved": total_val_shelved,
        "total_value_remaining": total_val_rem,
        "total_items_pending": pending_cnt,
        "total_items_shelved": active_cnt,
        "total_items_expired_warning": expired_warning_cnt
    }

# =====================================================================
# 6. APIs รายงานความเคลื่อนไหว และส่งออกข้อมูล สตง. (Export CSV)
# =====================================================================

@app.get("/api/reports/stock-card", response_model=List[schemas.StockMovementResponse])
def get_stock_card_report(db: Session = Depends(get_db)):
    """ดึงรายงานประวัติความเคลื่อนไหวคลังยา (Stock Card Ledger) ทั้งหมด"""
    movements = db.query(models.StockMovement).order_by(models.StockMovement.action_date.desc()).all()
    
    response_list = []
    for mv in movements:
        # Join ข้อมูลรายละเอียดประกอบใบเคลื่อนไหว
        inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == mv.inventory_id).first()
        resp = schemas.StockMovementResponse.model_validate(mv)
        if inv:
            resp.icode = inv.icode
            resp.lot_number = inv.lot_number
            drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
            if drug:
                resp.drug_name = drug.name
        response_list.append(resp)
        
    return response_list

@app.get("/api/reports/stock-card/export")
def export_stock_card_csv(db: Session = Depends(get_db)):
    """ส่งออก Stock Card และความเคลื่อนไหวบัญชีบริจาคในรูปแบบ CSV เพื่อตรวจสอบภายใน/สตง."""
    movements = db.query(models.StockMovement).order_by(models.StockMovement.action_date.asc()).all()
    
    # สร้าง Buffer สำหรับเขียน CSV
    f = StringIO()
    # ป้อน BOM เพื่อให้เปิดภาษาไทยใน Excel ได้ทันทีโดยไม่เพี้ยน
    f.write('\ufeff')
    writer = csv.writer(f)
    
    # เขียน Header
    writer.writerow([
        "วันที่-เวลา", "รหัสยา", "รายการยา", "ล็อตผลิต", "ประเภทรายการ", 
        "จำนวน", "ราคา/หน่วย (บาท)", "มูลค่า (บาท)", "ผู้ดำเนินการ", "เลขอ้างอิงระเบียบ/ใบโอน", "หมายเหตุ"
    ])
    
    # เขียนรายละเอียดข้อมูล
    for mv in movements:
        inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == mv.inventory_id).first()
        drug_name = "ไม่ระบุ"
        icode = "ไม่ระบุ"
        lot = "ไม่ระบุ"
        unit_price = 0.0
        
        if inv:
            icode = inv.icode
            lot = inv.lot_number
            unit_price = inv.unit_price_at_receive
            drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
            if drug:
                drug_name = drug.name
                
        # แปลงข้อความประเภทรายการให้อ่านง่ายในรายงานราชการ
        type_th = {
            "receive": "รับคืนบริจาค",
            "inspect_approve": "อนุมัติตรวจรับเข้าคลัง",
            "shelve": "โอนเข้าชั้นวางจ่ายต่อ",
            "dispose": "ตัดจำหน่ายทำลายพัสดุ",
            "adjust_add": "ปรับปรุงบัญชี (บวก)",
            "adjust_sub": "ปรับปรุงบัญชี (หัก)"
        }.get(mv.transaction_type, mv.transaction_type)
        
        writer.writerow([
            mv.action_date.strftime('%Y-%m-%d %H:%M:%S'),
            icode,
            drug_name,
            lot,
            type_th,
            mv.quantity,
            f"{unit_price:.2f}",
            f"{mv.value:.2f}",
            mv.performed_by,
            mv.doc_reference or "-",
            mv.remarks or "-"
        ])
        
    f.seek(0)
    response = Response(content=f.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=Donated_Medicine_StockCard.csv"
    return response


# =====================================================================
# ระบบค้นหาและตรวจสอบเอกสารย้อนหลัง (Document Archive API)
# =====================================================================

@app.get("/api/documents")
def get_all_archived_documents(db: Session = Depends(get_db)):
    """ดึงรายการสรุปเอกสารโอนย้ายคลังและจำหน่ายทำลายย้อนหลังทั้งหมด"""
    movements = db.query(models.StockMovement)\
        .filter(models.StockMovement.doc_reference != None, models.StockMovement.doc_reference != "")\
        .order_by(models.StockMovement.action_date.desc()).all()
        
    # จัดกลุ่ม movements ตาม doc_reference และ transaction_type
    doc_map = {}
    for mv in movements:
        key = (mv.doc_reference, mv.transaction_type)
        if key not in doc_map:
            doc_map[key] = []
        doc_map[key].append(mv)
        
    documents = []
    for (doc_ref, tx_type), mvs in doc_map.items():
        first_mv = mvs[0]
        
        # คำนวณมูลค่ารวมและจำนวนรายการย่อย
        total_value = sum(mv.value for mv in mvs)
        total_qty = sum(mv.quantity for mv in mvs)
        
        # ค้นหาชื่อตัวยาแรกเป็นตัวแทนแสดงผลสรุป
        first_inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == first_mv.inventory_id).first()
        first_drug_name = "ไม่ระบุเวชภัณฑ์"
        if first_inv:
            drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == first_inv.icode).first()
            if drug:
                first_drug_name = drug.name
                
        summary_text = first_drug_name
        if len(mvs) > 1:
            summary_text += f" และรายการอื่นๆ รวม {len(mvs)} รายการ"
            
        documents.append({
            "doc_reference": doc_ref,
            "transaction_type": "requisition" if tx_type == "shelve" else ("disposal" if tx_type == "dispose" else tx_type),
            "date": first_mv.action_date.strftime('%Y-%m-%d'),
            "datetime": first_mv.action_date.strftime('%Y-%m-%d %H:%M:%S'),
            "performed_by": first_mv.performed_by,
            "remarks": first_mv.remarks,
            "total_items": len(mvs),
            "total_quantity": total_qty,
            "total_value": total_value,
            "summary_text": summary_text
        })
        
    return documents


@app.get("/api/documents/detail")
def get_document_details(doc_reference: str, db: Session = Depends(get_db)):
    """ดึงรายละเอียดรายการยาและเนื้อความทั้งหมดของเอกสารเพื่อพิมพ์ย้อนหลัง (รองรับเครื่องหมายสแลช /)"""
    mvs = db.query(models.StockMovement).filter(models.StockMovement.doc_reference == doc_reference).all()
    if not mvs:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารเลขอ้างอิงนี้")
        
    first_mv = mvs[0]
    tx_type = first_mv.transaction_type
    
    items = []
    for mv in mvs:
        inv = db.query(models.DonatedInventory).filter(models.DonatedInventory.inventory_id == mv.inventory_id).first()
        if not inv:
            continue
            
        drug = db.query(models.HOSxPDrugItem).filter(models.HOSxPDrugItem.icode == inv.icode).first()
        items.append({
            "drug_name": drug.name if drug else "ไม่ระบุยา",
            "lot_number": inv.lot_number,
            "expiration_date": inv.expiration_date,
            "quantity": mv.quantity,
            "unit_price": inv.unit_price_at_receive
        })
        
    dest_location = "ชั้นวางเวชภัณฑ์คลังยาบริจาค"
    receiver = "อัหลาม แคเม๊าะ"
    
    return {
        "doc_reference": doc_reference,
        "type": "requisition" if tx_type == "shelve" else ("disposal" if tx_type == "dispose" else tx_type),
        "dest_location": dest_location,
        "receiver": receiver,
        "date": first_mv.action_date.strftime('%Y-%m-%d'),
        "performed_by": first_mv.performed_by,
        "remarks": first_mv.remarks,
        "items": items
    }


@app.get("/api/drugs/{icode}/brands", response_model=List[str])
def get_drug_brands(icode: str, db: Session = Depends(get_db)):
    """ดึงรายการยี่ห้อที่ไม่ซ้ำกันที่เคยบันทึกในระบบสำหรับยากลางรหัสนี้ เพื่อนำไปทำเป็นตัวเลือก Auto-complete"""
    brands = db.query(models.DonatedInventory.brand_name).filter(
        models.DonatedInventory.icode == icode,
        models.DonatedInventory.brand_name != None,
        models.DonatedInventory.brand_name != ""
    ).distinct().all()
    return [b[0] for b in brands]


# =====================================================================
# Standalone Native Mode: ให้ Backend เสิร์ฟหน้าเว็บ Frontend (dist) ทันที
# ทำให้รันบน Windows ได้โดยตรง ไม่ต้องผ่าน Docker หรือ Nginx
# =====================================================================
import os
from fastapi.staticfiles import StaticFiles

dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")


if __name__ == "__main__":
    import sys
    import uvicorn

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    port = int(os.getenv("PORT", "80"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"============================================================")
    print(f" Donated Medicine Manager is running!")
    print(f" Access URL: http://localhost:{port}")
    print(f"============================================================")
    try:
        uvicorn.run(app, host=host, port=port)
    except OSError as e:
        if port == 80:
            fallback_port = 8000
            print(f"Port 80 might require Administrator privileges or is in use. Falling back to port {fallback_port}...")
            uvicorn.run(app, host=host, port=fallback_port)
        else:
            raise e

