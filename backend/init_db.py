from datetime import datetime, date
from .database import engine, SessionLocal, Base
from . import models

def init_database():
    print("กำลังสร้างโครงสร้างตารางข้อมูลที่จำเป็นในฐานข้อมูล...")
    Base.metadata.create_all(bind=engine)

    # หากใช้ฐานข้อมูลจริง (MySQL/MariaDB) ไม่ต้องป้อนข้อมูลจำลองทับ HOSxP
    if not str(engine.url).startswith("sqlite"):
        print("เชื่อมต่อฐานข้อมูล HOSxP หลักเรียบร้อยแล้ว (ไม่ป้อน Mock Data)")
        return

    db = SessionLocal()
    try:
        # =====================================================================
        # 1. ป้อนข้อมูลผู้ป่วยจำลอง (HOSxP Mock Patient Data)
        # =====================================================================
        if db.query(models.HOSxPPatient).count() == 0:

            print("กำลังป้อนข้อมูลผู้ป่วยจำลองของ HOSxP...")
            mock_patients = [
                models.HOSxPPatient(hn="1-69-00123", fname="ใจดี", lname="รักสุขภาพ", sex="M", birthday=date(1980, 5, 12)),
                models.HOSxPPatient(hn="1-69-00124", fname="สมร", lname="พารวย", sex="F", birthday=date(1975, 10, 24)),
                models.HOSxPPatient(hn="1-69-00125", fname="อามีนะห์", lname="ดือราแม", sex="F", birthday=date(1992, 3, 15)),
                models.HOSxPPatient(hn="1-69-00126", fname="มะโซ๊ะ", lname="สะมะแอ", sex="M", birthday=date(1964, 8, 3)),
                models.HOSxPPatient(hn="1-69-00127", fname="รอมฎอน", lname="ยีมะเด็ง", sex="M", birthday=date(1988, 12, 1)),
                models.HOSxPPatient(hn="1-69-00128", fname="ปิยะมาศ", lname="แสนดี", sex="F", birthday=date(1990, 7, 19)),
                models.HOSxPPatient(hn="1-69-00129", fname="สมคิด", lname="จิตสว่าง", sex="M", birthday=date(1953, 11, 30)),
                models.HOSxPPatient(hn="1-69-00130", fname="ฟาติมะห์", lname="แวฮามะ", sex="F", birthday=date(2001, 2, 8)),
            ]
            db.add_all(mock_patients)
            db.commit()
            print(f"ป้อนข้อมูลผู้ป่วยเรียบร้อย {len(mock_patients)} ราย")

        # =====================================================================
        # 1.5. ป้อนข้อมูลผู้ใช้งาน HOSxP (HOSxP Mock opduser)
        # =====================================================================
        if db.query(models.HOSxPOpdUser).count() == 0:
            print("กำลังป้อนข้อมูลเจ้าหน้าที่ HOSxP (opduser)...")
            mock_opdusers = [
                models.HOSxPOpdUser(loginname="jaslan", name="ภก.ยัสลัน มายุดิน", password="123", passweb="123", entryposition="เภสัชกรชำนาญการ", groupname="กลุ่มงานเภสัชกรรม"),
                models.HOSxPOpdUser(loginname="Ahlam", name="อัหลาม แคเม๊าะ", password="123", passweb="123", entryposition="เจ้าพนักงานเภสัชกรรม", groupname="ห้องยา"),
                models.HOSxPOpdUser(loginname="dah", name="ภญ.วันฮามีดะห์ ปานากาเซ็ง", password="123", passweb="123", entryposition="หัวหน้ากลุ่มงานเภสัชกรรม", groupname="กลุ่มงานเภสัชกรรม"),
            ]
            db.add_all(mock_opdusers)
            db.commit()
            
        # =====================================================================
        # 2. ป้อนข้อมูลรายการยาพัสดุและราคากลาง (HOSxP Mock s_drugitems)
        # =====================================================================

        if db.query(models.HOSxPDrugItem).count() == 0:
            print("กำลังป้อนข้อมูลทะเบียนรายการยาพัสดุ HOSxP...")
            mock_drugs = [
                models.HOSxPDrugItem(icode="DRUG001", name="Paracetamol 500 mg tab (Sara)", strength="500 mg", units="เม็ด", unitcost=0.50, active="Y"),
                models.HOSxPDrugItem(icode="DRUG002", name="Metformin 500 mg tab (Glucophage)", strength="500 mg", units="เม็ด", unitcost=1.20, active="Y"),
                models.HOSxPDrugItem(icode="DRUG003", name="Amlodipine 5 mg tab (Norvasc)", strength="5 mg", units="เม็ด", unitcost=2.50, active="Y"),
                models.HOSxPDrugItem(icode="DRUG004", name="Losartan 50 mg tab (Cozaar)", strength="50 mg", units="เม็ด", unitcost=4.00, active="Y"),
                models.HOSxPDrugItem(icode="DRUG005", name="Atorvastatin 20 mg tab (Lipitor)", strength="20 mg", units="เม็ด", unitcost=8.50, active="Y"),
                models.HOSxPDrugItem(icode="DRUG006", name="Omeprazole 20 mg cap (Losec)", strength="20 mg", units="เม็ด", unitcost=1.80, active="Y"),
                models.HOSxPDrugItem(icode="DRUG007", name="Ibuprofen 400 mg tab (Gofen)", strength="400 mg", units="เม็ด", unitcost=2.00, active="Y"),
                models.HOSxPDrugItem(icode="DRUG008", name="Clopidogrel 75 mg tab (Plavix)", strength="75 mg", units="เม็ด", unitcost=6.00, active="Y"),
                models.HOSxPDrugItem(icode="DRUG009", name="Enalapril 5 mg tab (Renitec)", strength="5 mg", units="เม็ด", unitcost=1.50, active="Y"),
                models.HOSxPDrugItem(icode="DRUG010", name="Simvastatin 20 mg tab (Zocor)", strength="20 mg", units="เม็ด", unitcost=0.80, active="Y"),
                models.HOSxPDrugItem(icode="DRUG011", name="Gliclazide 80 mg tab (Diamicron)", strength="80 mg", units="เม็ด", unitcost=2.20, active="Y"),
                models.HOSxPDrugItem(icode="DRUG012", name="Salbutamol 100 mcg inhaler (Ventolin)", strength="100 mcg", units="หลอด", unitcost=120.0, active="Y"),
                models.HOSxPDrugItem(icode="DRUG013", name="Metoprolol 100 mg tab (Lopressor)", strength="100 mg", units="เม็ด", unitcost=3.00, active="Y"),
                models.HOSxPDrugItem(icode="DRUG014", name="Gemfibrozil 600 mg tab (Lopid)", strength="600 mg", units="เม็ด", unitcost=4.50, active="Y"),
                models.HOSxPDrugItem(icode="DRUG015", name="Domperidone 10 mg tab (Motilium)", strength="10 mg", units="เม็ด", unitcost=0.70, active="Y"),
            ]
            db.add_all(mock_drugs)
            db.commit()
            print(f"ป้อนข้อมูลยาสำเร็จ {len(mock_drugs)} รายการ")

        # =====================================================================
        # 3. ป้อนข้อมูลคลังยาบริจาคและประวัติทำรายการพัสดุจำนวนมาก
        # =====================================================================
        if db.query(models.DonatedInventory).count() == 0:
            print("กำลังป้อนข้อมูลคลังยาและเอกสารประวัติจำลอง...")

            # 3.1 บันทึกใบยินยอมจำลอง ( Completed & Pending )
            consents = [
                models.PatientConsent(hn="1-69-00123", patient_name="ใจดี รักสุขภาพ", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260510-1001", status="completed", consent_date=datetime(2026, 5, 10, 10, 00)),
                models.PatientConsent(hn="1-69-00124", patient_name="สมร พารวย", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260614-2002", status="completed", consent_date=datetime(2026, 6, 14, 11, 30)),
                models.PatientConsent(hn="1-69-00127", patient_name="รอมฎอน ยีมะเด็ง", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260701-3003", status="completed", consent_date=datetime(2026, 7, 1, 14, 00)),
                models.PatientConsent(hn="1-69-00128", patient_name="ปิยะมาศ แสนดี", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260710-4004", status="completed", consent_date=datetime(2026, 7, 10, 9, 15)),
                
                # ถุงยาค้าง Reconcile สำหรับทดสอบเครื่องสแกนบาร์โค้ดปืนยิงหลังบ้าน!
                models.PatientConsent(hn="1-69-00125", patient_name="อามีนะห์ ดือราแม", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260718-0001", status="pending_items", consent_date=datetime(2026, 7, 18, 8, 30)),
                models.PatientConsent(hn="1-69-00126", patient_name="มะโซ๊ะ สะมะแอ", officer_name="ภก.ยัสลัน มายุดิน", print_reference_code="PC-260718-0002", status="pending_items", consent_date=datetime(2026, 7, 18, 9, 10))
            ]
            db.add_all(consents)
            db.commit()

            # บันทึก ConsentItem ค้าง Reconcile
            items_pending = [
                models.ConsentItem(consent_code="PC-260718-0001", icode="DRUG001", quantity=100),
                models.ConsentItem(consent_code="PC-260718-0002", icode="DRUG002", quantity=200),
                models.ConsentItem(consent_code="PC-260718-0002", icode="DRUG003", quantity=150)
            ]
            db.add_all(items_pending)
            db.commit()

            # 3.2 รายการยาคงเหลือในคลังหลัก
            inv_items = [
                # คลังชุดที่ 1: โอนไปชั้นแล้วบางส่วน
                models.DonatedInventory(
                    inventory_id="INV-001", icode="DRUG001", brand_name="Sara", lot_number="LOT-PA69A", expiration_date=date(2027, 5, 20),
                    quantity_received=500, quantity_remaining=200, unit_price_at_receive=0.50, total_value=250.00,
                    received_date=date(2026, 5, 10), source_type="คืนจากผู้ป่วย", status="active",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 5, 10, 11, 0), print_reference_code="PC-260510-1001"
                ),
                models.DonatedInventory(
                    inventory_id="INV-002", icode="DRUG002", brand_name="Glucophage", lot_number="LOT-ME69B", expiration_date=date(2027, 8, 15),
                    quantity_received=300, quantity_remaining=50, unit_price_at_receive=1.20, total_value=360.00,
                    received_date=date(2026, 5, 10), source_type="คืนจากผู้ป่วย", status="active",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 5, 10, 11, 0), print_reference_code="PC-260510-1001"
                ),
                
                # คลังชุดที่ 2: ขออนุมัติทำลายพัสดุหมดอายุแล้ว
                models.DonatedInventory(
                    inventory_id="INV-003", icode="DRUG007", brand_name="Gofen", lot_number="LOT-IB-EXP", expiration_date=date(2026, 2, 10),
                    quantity_received=150, quantity_remaining=0, unit_price_at_receive=2.00, total_value=300.00,
                    received_date=date(2026, 6, 14), source_type="คืนจากผู้ป่วย", status="disposed",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 6, 14, 13, 0), print_reference_code="PC-260614-2002"
                ),
                models.DonatedInventory(
                    inventory_id="INV-004", icode="DRUG010", brand_name="Zocor", lot_number="LOT-SI-EXP", expiration_date=date(2026, 3, 1),
                    quantity_received=500, quantity_remaining=0, unit_price_at_receive=0.80, total_value=400.00,
                    received_date=date(2026, 6, 14), source_type="คืนจากผู้ป่วย", status="disposed",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 6, 14, 13, 0), print_reference_code="PC-260614-2002"
                ),
                
                # คลังชุดที่ 3: โอนไปชั้นตึกยา
                models.DonatedInventory(
                    inventory_id="INV-005", icode="DRUG004", brand_name="Cozaar", lot_number="LOT-LO70C", expiration_date=date(2027, 12, 1),
                    quantity_received=250, quantity_remaining=100, unit_price_at_receive=4.00, total_value=1000.00,
                    received_date=date(2026, 7, 1), source_type="คืนจากผู้ป่วย", status="active",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 7, 1, 15, 0), print_reference_code="PC-260701-3003"
                ),
                models.DonatedInventory(
                    inventory_id="INV-006", icode="DRUG006", brand_name="Losec", lot_number="LOT-OM70D", expiration_date=date(2027, 10, 10),
                    quantity_received=100, quantity_remaining=0, unit_price_at_receive=1.80, total_value=180.00,
                    received_date=date(2026, 7, 1), source_type="คืนจากผู้ป่วย", status="active",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 7, 1, 15, 0), print_reference_code="PC-260701-3003"
                ),

                # คลังชุดที่ 4: ยารอจำหน่ายทำลายล่วงหน้า (ล็อตใหญ่)
                models.DonatedInventory(
                    inventory_id="INV-007", icode="DRUG008", brand_name="Plavix", lot_number="LOT-CL71E", expiration_date=date(2026, 6, 1),
                    quantity_received=200, quantity_remaining=0, unit_price_at_receive=6.00, total_value=1200.00,
                    received_date=date(2026, 7, 10), source_type="คืนจากผู้ป่วย", status="disposed",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 7, 10, 10, 0), print_reference_code="PC-260710-4004"
                ),
                models.DonatedInventory(
                    inventory_id="INV-008", icode="DRUG012", brand_name="Ventolin", lot_number="LOT-SA71F", expiration_date=date(2026, 6, 15),
                    quantity_received=10, quantity_remaining=0, unit_price_at_receive=120.00, total_value=1200.00,
                    received_date=date(2026, 7, 10), source_type="คืนจากผู้ป่วย", status="disposed",
                    inspector_name="อัหลาม แคเม๊าะ", inspected_at=datetime(2026, 7, 10, 10, 0), print_reference_code="PC-260710-4004"
                )
            ]
            db.add_all(inv_items)
            db.commit()

            # 3.3 บันทึกประวัติความเคลื่อนไหว Stock Movement (เชื่อมต่อเข้าเป็นเอกสารประวัติย้อนหลัง)
            movements = [
                # --- ใบเอกสารโอนที่ 1: เลขที่ โอน-๒๕๖๙/๐๑ (10 พ.ค. 2569) ---
                models.StockMovement(
                    inventory_id="INV-001", transaction_type="receive", quantity=500, value=250.00,
                    action_date=datetime(2026, 5, 10, 11, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260510-1001"
                ),
                models.StockMovement(
                    inventory_id="INV-002", transaction_type="receive", quantity=300, value=360.00,
                    action_date=datetime(2026, 5, 10, 11, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260510-1001"
                ),
                models.StockMovement(
                    inventory_id="INV-001", transaction_type="shelve", quantity=300, value=150.00,
                    action_date=datetime(2026, 5, 12, 14, 0), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="โอน-๒๕๖๙/๐๑", remarks="โอนย้ายยาบริจาคเข้าสู่ชั้นวางยาเบอร์ 1"
                ),
                models.StockMovement(
                    inventory_id="INV-002", transaction_type="shelve", quantity=250, value=300.00,
                    action_date=datetime(2026, 5, 12, 14, 0), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="โอน-๒๕๖๙/๐๑", remarks="โอนย้ายยาบริจาคเข้าสู่ชั้นวางยาเบอร์ 2"
                ),

                # --- ใบอนุมัติทำลายที่ 1: เลขที่ สย.๐๐๓๒.๑/๑๒ (15 มิ.ย. 2569) ---
                models.StockMovement(
                    inventory_id="INV-003", transaction_type="receive", quantity=150, value=300.00,
                    action_date=datetime(2026, 6, 14, 13, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260614-2002"
                ),
                models.StockMovement(
                    inventory_id="INV-004", transaction_type="receive", quantity=500, value=400.00,
                    action_date=datetime(2026, 6, 14, 13, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260614-2002"
                ),
                models.StockMovement(
                    inventory_id="INV-003", transaction_type="dispose", quantity=150, value=300.00,
                    action_date=datetime(2026, 6, 15, 16, 0), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="สย.๐๐๓๒.๑/๑๒", remarks="ยาหมดอายุเสื่อมสภาพ ดำเนินการคัดทิ้งตามระเบียบพัสดุฯ"
                ),
                models.StockMovement(
                    inventory_id="INV-004", transaction_type="dispose", quantity=500, value=400.00,
                    action_date=datetime(2026, 6, 15, 16, 0), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="สย.๐๐๓๒.๑/๑๒", remarks="ยาหมดอายุเสื่อมสภาพ ดำเนินการคัดทิ้งตามระเบียบพัสดุฯ"
                ),

                # --- ใบเอกสารโอนที่ 2: เลขที่ โอน-๒๕๖๙/๐๒ (02 ก.ค. 2569) ---
                models.StockMovement(
                    inventory_id="INV-005", transaction_type="receive", quantity=250, value=1000.00,
                    action_date=datetime(2026, 7, 1, 15, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260701-3003"
                ),
                models.StockMovement(
                    inventory_id="INV-006", transaction_type="receive", quantity=100, value=180.00,
                    action_date=datetime(2026, 7, 1, 15, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260701-3003"
                ),
                models.StockMovement(
                    inventory_id="INV-005", transaction_type="shelve", quantity=150, value=600.00,
                    action_date=datetime(2026, 7, 2, 10, 30), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="โอน-๒๕๖๙/๐๒", remarks="โอนเข้าคลังยาผู้ป่วยในชั้น 3"
                ),
                models.StockMovement(
                    inventory_id="INV-006", transaction_type="shelve", quantity=100, value=180.00,
                    action_date=datetime(2026, 7, 2, 10, 30), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="โอน-๒๕๖๙/๐๒", remarks="โอนเข้าคลังยาผู้ป่วยในชั้น 3"
                ),

                # --- ใบอนุมัติทำลายที่ 2: เลขที่ สย.๐๐๓๒.๑/๑๕ (11 ก.ค. 2569) ---
                models.StockMovement(
                    inventory_id="INV-007", transaction_type="receive", quantity=200, value=1200.00,
                    action_date=datetime(2026, 7, 10, 10, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260710-4004"
                ),
                models.StockMovement(
                    inventory_id="INV-008", transaction_type="receive", quantity=10, value=1200.00,
                    action_date=datetime(2026, 7, 10, 10, 0), performed_by="อัหลาม แคเม๊าะ", remarks="ตรวจรับถุงยา PC-260710-4004"
                ),
                models.StockMovement(
                    inventory_id="INV-007", transaction_type="dispose", quantity=200, value=1200.00,
                    action_date=datetime(2026, 7, 11, 15, 30), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="สย.๐๐๓๒.๑/๑๕", remarks="เวชภัณฑ์ชำรุดจากการขนส่ง ดำเนินการคัดตัดจ่ายบัญชี"
                ),
                models.StockMovement(
                    inventory_id="INV-008", transaction_type="dispose", quantity=10, value=1200.00,
                    action_date=datetime(2026, 7, 11, 15, 30), performed_by="ภก.ยัสลัน มายุดิน",
                    doc_reference="สย.๐๐๓๒.๑/๑๕", remarks="เวชภัณฑ์ชำรุดจากการขนส่ง ดำเนินการคัดตัดจ่ายบัญชี"
                )
            ]
            db.add_all(movements)
            db.commit()
            print("ป้อนข้อมูลสต็อกและประวัติความเคลื่อนไหวชุดใหม่สำเร็จ!")
            
        print("ฐานข้อมูลเริ่มต้นจำลองได้รับการอัปเกรดสำเร็จ!")
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการป้อนข้อมูล: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
