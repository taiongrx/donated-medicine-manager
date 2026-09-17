import time
import threading
from datetime import datetime, time as dt_time, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models

def sync_hosxp_drugitems(db: Session):
    """
    ฟังก์ชันสำหรับซิงค์ข้อมูลรายการยากลางและราคายาจาก HOSxP (s_drugitems) 
    มาบันทึกเก็บไว้ในตารางสำเนาภายในระบบ (donated_local_drugitems)
    """
    print(f"[{datetime.now()}] เริ่มต้นกระบวนการซิงค์ข้อมูลยากลางจาก HOSxP...")
    try:
        # ดึงยาที่มีรหัสและชื่อยาจาก HOSxP s_drugitems
        hosxp_drugs = db.query(models.HOSxPDrugItem).filter(
            models.HOSxPDrugItem.name != None,
            models.HOSxPDrugItem.name != ''
        ).all()
        print(f"พบรายการยากลางใน HOSxP ทั้งหมด {len(hosxp_drugs)} รายการ")
        
        sync_count = 0
        for drug in hosxp_drugs:
            # ค้นหาว่าในตารางสำเนามีรหัสยานี้อยู่แล้วหรือยัง
            local_drug = db.query(models.DonatedLocalDrugItem).filter(models.DonatedLocalDrugItem.icode == drug.icode).first()
            
            if local_drug:
                # อัปเดตข้อมูลหากราคาหรือชื่อเปลี่ยน
                local_drug.name = drug.name
                local_drug.strength = drug.strength
                local_drug.units = drug.units
                local_drug.unitcost = drug.unitcost
                local_drug.last_sync = datetime.utcnow()
            else:
                # เพิ่มรายการยาใหม่เข้าระบบ
                new_local_drug = models.DonatedLocalDrugItem(
                    icode=drug.icode,
                    name=drug.name,
                    strength=drug.strength,
                    units=drug.units,
                    unitcost=drug.unitcost,
                    last_sync=datetime.utcnow()
                )
                db.add(new_local_drug)
                
            sync_count += 1
            # Commit ทุกๆ 50 รายการเพื่อไม่ให้บอร์ดฐานข้อมูลทำงานหนักเกิน
            if sync_count % 50 == 0:
                db.commit()
                
        db.commit()
        print(f"[{datetime.now()}] เสร็จสิ้นกระบวนการซิงค์! อัปเดตรายการยาทั้งหมด {sync_count} รายการลงตารางสำเนาสำเร็จ")
        return sync_count
    except Exception as e:
        db.rollback()
        print(f"[{datetime.now()}] ❌ เกิดข้อผิดพลาดในการซิงค์ข้อมูลยากลาง HOSxP: {e}")
        return 0

def run_daily_sync_job():
    """Background Thread วนลูปทำงานซิงค์ข้อมูลยาอัตโนมัติทุกวันตอนเที่ยงคืน"""
    print("ระบบ Data Sync Pipeline (Background Thread) เริ่มทำงานแล้ว...")
    
    # รันซิงค์ครั้งแรกตอนสตาร์ทระบบ 1 รอบทันทีเพื่อให้ฐานข้อมูลสำเนามีข้อมูลพร้อมใช้งาน
    db = SessionLocal()
    try:
        sync_hosxp_drugitems(db)
    finally:
        db.close()
        
    while True:
        try:
            # คำนวณเวลาที่เหลือจนถึงเที่ยงคืนของวันถัดไป
            now = datetime.now()
            tomorrow = now + timedelta(days=1)
            target_time = datetime.combine(tomorrow.date(), dt_time(0, 0, 0)) # เที่ยงคืนตรง
            seconds_to_wait = (target_time - now).total_seconds()
            
            print(f"Data Sync Pipeline จะทำงานซิงค์รอบถัดไปในอีก {seconds_to_wait/3600:.2f} ชั่วโมง (เวลา {target_time})")
            
            # นอนรอจนกว่าจะถึงเวลาเป้าหมาย
            time.sleep(seconds_to_wait)
            
            # เมื่อถึงเวลาเที่ยงคืน ทำการซิงค์ข้อมูล
            db = SessionLocal()
            try:
                sync_hosxp_drugitems(db)
            finally:
                db.close()
                
        except Exception as e:
            print(f"เกิดข้อผิดพลาดในการทำงานของ Scheduler: {e}")
            time.sleep(60) # หากล้มเหลว รอ 1 นาทีแล้วลองคำนวณรันใหม่

def start_sync_scheduler():
    """ฟังก์ชันหลักสำหรับสตาร์ทท่อส่งข้อมูล (Data Sync Pipeline) ใน Thread เบื้องหลัง"""
    thread = threading.Thread(target=run_daily_sync_job, daemon=True)
    thread.start()
    return thread
