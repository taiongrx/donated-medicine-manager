import React, { useState, useEffect, useRef } from 'react'
import { Search, Printer, Plus, Trash2, CheckCircle2, FileSpreadsheet, Package, UserCheck, Key } from 'lucide-react'

// รายการยาสามัญ NCDs และพาราที่พบบ่อยสำหรับทำปุ่มด่วนหน้าต่างจ่ายยา (Lean Grid)
const COMMON_DRUGS = [
  { icode: 'DRUG001', name: 'Paracetamol 500 mg tab', unitcost: 0.50 },
  { icode: 'DRUG002', name: 'Metformin 500 mg tab', unitcost: 1.20 },
  { icode: 'DRUG003', name: 'Amlodipine 5 mg tab', unitcost: 2.50 },
  { icode: 'DRUG004', name: 'Losartan 50 mg tab', unitcost: 4.00 },
  { icode: 'DRUG005', name: 'Atorvastatin 20 mg tab', unitcost: 8.50 },
  { icode: 'DRUG006', name: 'Omeprazole 20 mg cap', unitcost: 1.80 },
]

function ReceiveForm({ onPrintConsent }) {
  // แท็บหลักภายในหน้ารับยา: 'front_desk' (เภสัชกรหน้าต่าง) หรือ 'back_desk' (จพ.คลังเคลียร์ Lot/Exp)
  const [subTab, setSubTab] = useState('front_desk')

  // =====================================================================
  // 1. STATES สำหรับแท็บ 1: เภสัชกรหน้าต่างจ่ายยา (Front Desk)
  // =====================================================================
  const [hnInput, setHnInput] = useState('')
  const [patientName, setPatientName] = useState('')
  const [officerName, setOfficerName] = useState(() => localStorage.getItem('setting_officer_disp') || 'ภก.ยัสลัน มายุดิน')
  const [patientLoading, setPatientLoading] = useState(false)
  
  // คีย์ตัวยา
  const [drugSearchQuery, setDrugSearchQuery] = useState('')
  const [drugSearchResults, setDrugSearchResults] = useState([])
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [frontItemsList, setFrontItemsList] = useState([])
  const [frontSaveLoading, setFrontSaveLoading] = useState(false)
  const [frontSuccessData, setFrontSuccessData] = useState(null)
  const [patientPrescriptions, setPatientPrescriptions] = useState([])
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false)

  const frontQtyInputRef = useRef(null)
  const drugSearchInputRef = useRef(null)

  // =====================================================================
  // 2. STATES สำหรับแท็บ 2: เจ้าหน้าที่คลังยาหลังบ้าน (Back Desk Reconcile)
  // =====================================================================
  const [pendingBags, setPendingBags] = useState([])
  const [bagsLoading, setBagsLoading] = useState(false)
  const [selectedBagCode, setSelectedBagCode] = useState('')
  const [activeBagData, setActiveBagData] = useState(null)
  const [reconcileItems, setReconcileItems] = useState([]) // ลิสต์ยารอเติม Lot/Exp
  const [inspectorName, setInspectorName] = useState(() => localStorage.getItem('setting_receiver') || 'อัหลาม แคเม๊าะ')
  const [hosxpOfficers, setHosxpOfficers] = useState([])

  useEffect(() => {
    fetch('/api/officers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setHosxpOfficers(data))
      .catch(() => {})
  }, [])

  const [sourceType, setSourceType] = useState('คืนจากผู้ป่วยเนื่องจากเหลือใช้ที่บ้าน')
  const [reconcileLoading, setReconcileLoading] = useState(false)
  const [reconcileSuccess, setReconcileSuccess] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [suggestedBrands, setSuggestedBrands] = useState({})
  const barcodeInputRef = useRef(null)

  // Focus ไปที่ช่องปืนยิงสแกนเนอร์เมื่อเปลี่ยนเข้าแท็บหลังบ้าน
  useEffect(() => {
    if (subTab === 'back_desk' && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current.focus()
      }, 300)
    }
  }, [subTab])

  const handleBarcodeScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const code = barcodeInput.trim()
      if (!code) return
      
      const found = pendingBags.some(bag => bag.print_reference_code.toLowerCase() === code.toLowerCase())
      if (found) {
        handleSelectBag(code.toUpperCase())
        setBarcodeInput('')
      } else {
        alert(`❌ ไม่พบถุงยาเลขที่ ${code} ในรายการที่รอคัดแยก`)
        setBarcodeInput('')
      }
    }
  }


  // ดึงรายการถุงรอตรวจสอบทั้งหมด
  const fetchPendingBags = () => {
    setBagsLoading(true)
    fetch('/api/consents/pending')
      .then(res => res.json())
      .then(data => {
        setPendingBags(data)
        setBagsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setBagsLoading(false)
      })
  }

  useEffect(() => {
    // ดึงชื่อเจ้าหน้าที่ที่เข้าใช้งานระบบปัจจุบันมาพรีเซ็ตลงฟอร์มโดยอัตโนมัติ
    const savedUser = localStorage.getItem('current_user')
    if (savedUser) {
      const userObj = JSON.parse(savedUser)
      setOfficerName(userObj.name)
      setInspectorName(userObj.name)
    }

    if (subTab === 'back_desk') {
      fetchPendingBags()
      setActiveBagData(null)
      setReconcileSuccess(false)
    }
  }, [subTab])

  // ดึงรายละเอียดของถุงยาเมื่อเลือกในตาราง
  const handleSelectBag = (code) => {
    setSelectedBagCode(code)
    setReconcileSuccess(false)
    fetch(`/api/consents/${code}`)
      .then(res => {
        if (!res.ok) throw new Error("ไม่พบถุงยานี้")
        return res.json()
      })
      .then(data => {
        setActiveBagData(data)
        // ตั้งค่าเริ่มต้นสำหรับการคีย์ Lot/Exp
        setReconcileItems(data.items.map(item => ({
          icode: item.icode,
          drug_name: item.drug_name,
          quantity: item.quantity,
          units: item.units,
          lot_number: item.preset_lot_number || '',
          expiration_date: item.preset_expiration_date || '',
          brand_name: item.preset_brand_name || ''
        })))

        // ดึงยี่ห้อที่เคยคีย์สำเร็จสำหรับยาแต่ละตัว (Lean brand auto-suggest)
        data.items.forEach(item => {
          fetch(`/api/drugs/${item.icode}/brands`)
            .then(res => res.json())
            .then(brands => {
              setSuggestedBrands(prev => ({
                ...prev,
                [item.icode]: brands
              }))
            })
            .catch(err => console.error(err))
        })
      })
      .catch(err => alert(err.message))
  }

  // แปลงและเติมเลข 0 หน้า HN ที่เป็นตัวเลขให้ครบ 7 หลักโดยอัตโนมัติ
  const formatHN = (val) => {
    if (!val) return ''
    const trimmed = val.trim()
    if (/^\d+$/.test(trimmed) && trimmed.length <= 7) {
      return trimmed.padStart(7, '0')
    }
    return trimmed
  }

  // เภสัชหน้าต่างสืบค้นผู้ป่วย
  const handleSearchPatient = () => {
    const formattedHN = formatHN(hnInput)
    if (!formattedHN) return
    setHnInput(formattedHN)
    setPatientLoading(true)
    setPatientName('')
    setFrontSuccessData(null)
    setPatientPrescriptions([])
    
    fetch(`/api/patients/${encodeURIComponent(formattedHN)}`)
      .then(res => {
        if (!res.ok) throw new Error("ไม่พบ HN นี้ในระบบ HOSxP")
        return res.json()
      })
      .then(data => {
        setPatientName(`${data.fname} ${data.lname}`)
        setPatientLoading(false)

        // ดึงรายการยาในประวัติการรักษาล่าสุด (HOSxP Visit)
        setPrescriptionsLoading(true)
        fetch(`/api/patients/${encodeURIComponent(formattedHN)}/prescriptions`)
          .then(res => res.ok ? res.json() : [])
          .then(visits => {
            setPatientPrescriptions(visits)
            setPrescriptionsLoading(false)
          })
          .catch(() => {
            setPatientPrescriptions([])
            setPrescriptionsLoading(false)
          })
      })
      .catch(err => {
        alert(err.message)
        setPatientLoading(false)
        setPrescriptionsLoading(false)
      })
  }

  // เพิ่มยาจากประวัติ Visit เข้าถุงยา
  const handleAddPrescriptionItem = (item) => {
    const existingIndex = frontItemsList.findIndex(x => x.icode === item.icode)
    if (existingIndex >= 0) {
      const updated = [...frontItemsList]
      updated[existingIndex].quantity += (item.qty || 1)
      updated[existingIndex].total_value = updated[existingIndex].quantity * (item.unitprice || 0)
      setFrontItemsList(updated)
    } else {
      setFrontItemsList([...frontItemsList, {
        icode: item.icode,
        drug_name: item.drug_name,
        units: item.units || 'เม็ด',
        quantity: item.qty || 1,
        unitcost: item.unitprice || 0,
        total_value: (item.qty || 1) * (item.unitprice || 0)
      }])
    }
  }

  // เพิ่มยาทั้งหมดใน Visit นั้นเข้าถุงยา
  const handleAddAllFromVisit = (visitItems) => {
    let updated = [...frontItemsList]
    visitItems.forEach(item => {
      const existingIndex = updated.findIndex(x => x.icode === item.icode)
      if (existingIndex >= 0) {
        updated[existingIndex].quantity += (item.qty || 1)
        updated[existingIndex].total_value = updated[existingIndex].quantity * (item.unitprice || 0)
      } else {
        updated.push({
          icode: item.icode,
          drug_name: item.drug_name,
          units: item.units || 'เม็ด',
          quantity: item.qty || 1,
          unitcost: item.unitprice || 0,
          total_value: (item.qty || 1) * (item.unitprice || 0)
        })
      }
    })
    setFrontItemsList(updated)
  }

  // ฟังก์ชันลบถุงยา
  const handleDeleteBag = (bagCode, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบถุงยา ${bagCode}?\nรายการยาในถุงนี้จะถูกยกเลิกทั้งหมด`)) {
      return
    }
    
    fetch(`/api/consents/${encodeURIComponent(bagCode)}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error("ไม่สามารถลบถุงยาได้")
        return res.json()
      })
      .then(() => {
        alert(`ลบถุงยา ${bagCode} สำเร็จเรียบร้อย`)
        if (selectedBagCode === bagCode) {
          setSelectedBagCode('')
          setActiveBagData(null)
          setReconcileItems([])
        }
        fetchPendingBags()
      })
      .catch(err => alert(err.message))
  }

  const [showDrugDropdown, setShowDrugDropdown] = useState(false)

  // ค้นหายาสืบค้นจากฐานข้อมูล HOSxP
  const handleSearchDrugs = (q) => {
    setDrugSearchQuery(q)
    setShowDrugDropdown(true)
    fetch(`/api/drugs?q=${encodeURIComponent(q.trim())}`)
      .then(res => res.json())
      .then(data => setDrugSearchResults(data))
      .catch(err => console.error("Error searching drugs:", err))
  }

  const handleDrugInputFocus = () => {
    setShowDrugDropdown(true)
    if (drugSearchResults.length === 0) {
      handleSearchDrugs(drugSearchQuery)
    }
  }

  const handleSelectDrug = (drug) => {
    setSelectedDrug(drug)
    setDrugSearchQuery(drug.name)
    setDrugSearchResults([])
    setShowDrugDropdown(false)
    setTimeout(() => frontQtyInputRef.current?.focus(), 100)
  }

  // เพิ่มยาลงลิสต์ชั่วคราว (ไม่ต้องกรอก Lot/Exp)
  const handleAddDrugToFrontList = () => {
    if (!selectedDrug || !quantity) {
      alert("กรุณากรอกข้อมูลยาและจำนวนชิ้น")
      return
    }
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      alert("จำนวนยาต้องเป็นตัวเลขมากกว่า 0")
      return
    }

    const newItem = {
      icode: selectedDrug.icode,
      drug_name: selectedDrug.name,
      units: selectedDrug.units || 'เม็ด',
      quantity: qty,
      unitcost: selectedDrug.unitcost,
      total_value: qty * selectedDrug.unitcost
    }

    setFrontItemsList([...frontItemsList, newItem])
    setSelectedDrug(null)
    setDrugSearchQuery('')
    setQuantity('')
    setDrugSearchResults([])
    setShowDrugDropdown(false)
    setTimeout(() => drugSearchInputRef.current?.focus(), 100)
  }

  const handleRemoveFrontItem = (index) => {
    const updated = [...frontItemsList]
    updated.splice(index, 1)
    setFrontItemsList(updated)
  }

  // หน้าต่างบันทึกและออกสติกเกอร์ยินยอม
  const handleSaveFrontConsent = (e) => {
    e.preventDefault()
    if (!hnInput.trim() || !patientName || !officerName) {
      alert("กรุณากรอกข้อมูลและสืบค้นคนไข้ก่อน")
      return
    }
    if (frontItemsList.length === 0) {
      alert("กรุณาเพิ่มรายการยาที่คนไข้บริจาคอย่างน้อย 1 รายการ")
      return
    }

    setFrontSaveLoading(true)
    setFrontSuccessData(null)

    fetch('/api/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hn: hnInput.trim(),
        patient_name: patientName,
        officer_name: officerName,
        items: frontItemsList.map(item => ({
          icode: item.icode,
          drug_name: item.drug_name,
          units: item.units,
          quantity: item.quantity
        }))
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการบันทึกยินยอม")
        return res.json()
      })
      .then(result => {
        setFrontSuccessData(result)
        setFrontSaveLoading(false)
        
        // ส่งพิมพ์สติกเกอร์ความร้อนที่มีรายการยาเรียงสลวยครบถ้วน
        onPrintConsent({
          ...result,
          items: frontItemsList.map(item => ({
            drug_name: item.drug_name,
            quantity_received: item.quantity,
            units: item.units
          }))
        })

        // ล้างข้อมูลเพื่อบริการคนไข้คิวถัดไป
        setHnInput('')
        setPatientName('')
        setPatientPrescriptions([])
        setFrontItemsList([])
      })
      .catch(err => {
        alert(err.message)
        setFrontSaveLoading(false)
      })
  }

  // จัดการพิมพ์ Lot ในช่องตาราง Reconcile
  const handleUpdateReconcileItem = (index, key, val) => {
    const updated = [...reconcileItems]
    updated[index][key] = val
    setReconcileItems(updated)
  }

  // ยืนยัน Reconcile คลังหลังบ้าน เติม Lot/Exp
  const handleConfirmReconcile = (e) => {
    e.preventDefault()
    if (!activeBagData) return

    // ตรวจทานว่ากรอก Lot และ Exp ครบทุกช่องหรือไม่
    for (let i = 0; i < reconcileItems.length; i++) {
      const item = reconcileItems[i]
      if (!item.lot_number.trim() || !item.expiration_date) {
        alert(`กรุณากรอกล็อตผลิต (Lot) และวันหมดอายุ (Exp) ของยา ${item.drug_name} ให้ครบถ้วน`)
        return
      }
    }

    setReconcileLoading(true)
    setReconcileSuccess(false)

    fetch(`/api/consents/${activeBagData.print_reference_code}/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspector_name: inspectorName,
        source_type: sourceType,
        items: reconcileItems.map(item => ({
          icode: item.icode,
          lot_number: item.lot_number,
          brand_name: item.brand_name || '',
          expiration_date: item.expiration_date,
          quantity: item.quantity
        }))
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการ Reconcile คลังสะสม")
        return res.json()
      })
      .then(() => {
        setReconcileLoading(false)
        setReconcileSuccess(true)
        setActiveBagData(null)
        setReconcileItems([])
        fetchPendingBags() // ดึงรายการถุงยาคงเหลือในคลังจำลองขึ้นมาใหม่
      })
      .catch(err => {
        alert(err.message)
        setReconcileLoading(false)
      })
  }

  return (
    <div>
      <datalist id="hosxp-officer-list">
        {hosxpOfficers.map((off, idx) => (
          <option key={idx} value={off.name}>{off.name} ({off.entryposition || 'เจ้าหน้าที่ HOSxP'})</option>
        ))}
      </datalist>
      {/* ─────────────────────────────────────────────────────────────────
          แถบเลือกบทบาทบทงานย่อย (Sub Tabs)
          ───────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.02)', padding: '5px', borderRadius: '10px', width: 'fit-content' }}>
        <button 
          type="button" 
          className={`btn ${subTab === 'front_desk' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
          onClick={() => setSubTab('front_desk')}
        >
          <UserCheck size={14} style={{ marginRight: '6px' }} />
          1. เภสัชกรหน้าต่างจ่ายยา (รับยา & ออกใบยินยอม)
        </button>
        <button 
          type="button" 
          className={`btn ${subTab === 'back_desk' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
          onClick={() => setSubTab('back_desk')}
        >
          <Package size={14} style={{ marginRight: '6px' }} />
          2. คลังยาบริจาคหลังบ้าน (กรอก Lot/Exp สะสมคลัง)
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          แท็บ 1: เภสัชกรหน้าต่างจ่ายยา (Front Desk - คีย์ชื่อ + จำนวน)
          ───────────────────────────────────────────────────────────────── */}
      {subTab === 'front_desk' && (
        <div className="grid-2">
          {/* คีย์ข้อมูล */}
          <div className="glossy-card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              หน้างานคีย์รับยาบริจาค (สืบค้น HN และรายการเวชภัณฑ์)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              พิมพ์ HN ของคนไข้ → กรอกชื่อยาและจำนวนชิ้นที่คนไข้คืน (ข้ามการกรอก Lot/Exp เพื่อความสะดวกรวดเร็ว)
            </p>

            <div className="form-group">
              <label className="form-label">รหัสผู้ป่วย (HN)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="กรอก HN (7 หลัก) เช่น 0012345 หรือ 123"
                  value={hnInput}
                  onChange={(e) => setHnInput(e.target.value)}
                  onBlur={() => setHnInput(prev => formatHN(prev))}
                  disabled={frontSaveLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchPatient()
                  }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleSearchPatient}
                  disabled={frontSaveLoading || patientLoading}
                >
                  {patientLoading ? 'กำลังค้น...' : 'ค้นหา'}
                </button>
              </div>
            </div>

            {patientName && (
              <div className="form-group" style={{ padding: '12px', background: 'rgba(0, 113, 227, 0.04)', borderRadius: '8px', border: '1px solid rgba(0, 113, 227, 0.1)', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ผู้ป่วย HOSxP:</span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-color)' }}>{patientName}</p>
              </div>
            )}

            {patientName && prescriptionsLoading && (
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                กำลังดึงประวัติการสั่งยาจาก HOSxP...
              </div>
            )}

            {patientName && !prescriptionsLoading && patientPrescriptions.length > 0 && (
              <div style={{ marginBottom: '20px', background: 'rgba(0, 113, 227, 0.03)', border: '1px solid rgba(0, 113, 227, 0.15)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--accent-color)' }}>
                    📋 รายการยาใน Visit ล่าสุดของผู้ป่วย (คลิกเลือกเข้าถุงยาได้ทันที)
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    พบ {patientPrescriptions.length} ครั้งตรวจ
                  </span>
                </div>
                {patientPrescriptions.map((visit, vIdx) => (
                  <div key={vIdx} style={{ marginBottom: '8px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        🗓️ วันที่ {visit.vstdate} {visit.vn ? `(VN: ${visit.vn})` : ''}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px' }}
                        onClick={() => handleAddAllFromVisit(visit.items)}
                      >
                        + เพิ่มยาทั้งหมดใน Visit นี้
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {visit.items.map((item, iIdx) => (
                        <button
                          key={`${item.icode}-${iIdx}`}
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: 'rgba(0, 113, 227, 0.07)',
                            color: 'var(--accent-color)',
                            border: '1px solid rgba(0, 113, 227, 0.2)',
                            borderRadius: '16px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleAddPrescriptionItem(item)}
                          title="คลิกเพื่อเลือกยานี้เข้าถุงบริจาค"
                        >
                          + {item.drug_name} ({item.qty} {item.units})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {patientName && (
              <div style={{ background: 'rgba(0,0,0,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>ระบุรายการยาที่ส่งคืน</h5>
                
                {/* ค้นหายา */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">ชื่อยา (ค้นหาและเลือกจากฐานข้อมูล HOSxP)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      ref={drugSearchInputRef}
                      type="text" 
                      className="form-input" 
                      placeholder="พิมพ์ชื่อยา หรือรหัสยา เพื่อสืบค้น..."
                      value={drugSearchQuery}
                      onChange={(e) => handleSearchDrugs(e.target.value)}
                      onFocus={handleDrugInputFocus}
                      onBlur={() => setTimeout(() => setShowDrugDropdown(false), 200)}
                    />
                    {showDrugDropdown && drugSearchResults.length > 0 && (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          background: '#FFFFFF', 
                          border: '1px solid var(--accent-color)', 
                          borderRadius: '8px', 
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
                          zIndex: 100, 
                          maxHeight: '260px', 
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}
                      >
                        <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-secondary)', background: '#F8F9FA', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: 600 }}>
                          พบรายการยาในฐานข้อมูล ({drugSearchResults.length} รายการ)
                        </div>
                        {drugSearchResults.map(drug => (
                          <div 
                            key={drug.icode}
                            style={{ 
                              padding: '10px 14px', 
                              borderBottom: '1px solid rgba(0,0,0,0.04)', 
                              cursor: 'pointer', 
                              fontSize: '13px'
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelectDrug(drug)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{drug.name}</strong>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px', fontFamily: 'monospace' }}>[{drug.icode}]</span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-color)', background: 'rgba(0,112,243,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                                ฿{drug.unitcost.toFixed(2)} / {drug.units || 'เม็ด'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ปุ่มด่วน NCDs */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {COMMON_DRUGS.map(d => (
                      <button 
                        key={d.icode} 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '20px' }}
                        onClick={() => handleSelectDrug({ icode: d.icode, name: d.name, unitcost: d.unitcost, units: 'เม็ด' })}
                      >
                        + {d.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDrug && (
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,113,227,0.15)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-color)' }}>{selectedDrug.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ราคากลาง: ฿{selectedDrug.unitcost.toFixed(2)} ต่อ {selectedDrug.units || 'เม็ด'}</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">จำนวนเม็ด/ขวด</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="ระบุจำนวนชิ้น เช่น 30, 60"
                    ref={frontQtyInputRef}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddDrugToFrontList()
                    }}
                  />
                </div>

                <button 
                  type="button" 
                  className="btn btn-success" 
                  style={{ width: '100%' }}
                  onClick={handleAddDrugToFrontList}
                  disabled={!selectedDrug}
                >
                  <Plus size={16} />
                  เพิ่มยาลงถุง
                </button>
              </div>
            )}
          </div>

          {/* รายการในถุงและปุ่มพิมพ์ */}
          <div className="glossy-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                รายการเวชภัณฑ์บริจาคในถุงนี้
              </h3>

              {frontItemsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
                  <FileSpreadsheet size={48} style={{ opacity: 0.15, margin: '0 auto 16px auto' }} />
                  <p style={{ fontSize: '14px' }}>ยังไม่มีรายการยาบริจาคในถุง</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    {patientName ? 'กรุณากรอกและเพิ่มรายการยาด้านซ้าย' : 'กรุณาสืบค้นประวัติผู้ป่วยก่อน'}
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="apple-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>ชื่อยา</th>
                        <th style={{ textAlign: 'right' }}>จำนวน</th>
                        <th style={{ textAlign: 'right' }}>มูลค่าประเมิน</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {frontItemsList.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.drug_name}</strong></td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} {item.units}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{item.total_value.toFixed(2)}</td>
                          <td>
                            <button 
                              type="button" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                              onClick={() => handleRemoveFrontItem(idx)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {frontItemsList.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <div className="form-group">
                  <label className="form-label">เภสัชกรผู้รับเรื่อง</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    list="hosxp-officer-list"
                    value={officerName} 
                    onChange={(e) => setOfficerName(e.target.value)}
                    disabled={frontSaveLoading}
                    placeholder="พิมพ์เพื่อค้นหาชื่อเจ้าหน้าที่ใน HOSxP"
                  />
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleSaveFrontConsent}
                  disabled={frontSaveLoading || !patientName}
                >
                  <Printer size={16} style={{ marginRight: '6px' }} />
                  {frontSaveLoading ? 'กำลังบันทึก...' : 'พิมพ์ Consent Sticker (8x5 ซม.)'}
                </button>
              </div>
            )}

            {frontSuccessData && (
              <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(52, 199, 89, 0.08)', border: '1px solid rgba(52, 199, 89, 0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <CheckCircle2 style={{ color: 'var(--success-color)', margin: '0 auto 8px auto' }} size={20} />
                <h4 style={{ fontSize: '13px', fontWeight: 600 }}>บันทึกและจัดพิมพ์ยินยอมสำเร็จ!</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  รหัสอ้างอิง: <strong>{frontSuccessData.print_reference_code}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          แท็บ 2: เจ้าหน้าที่คลังยาหลังบ้าน (Back Desk - ดึงถุงเติม Lot/Exp)
          ───────────────────────────────────────────────────────────────── */}
      {subTab === 'back_desk' && (
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* ตารางถุงยาค้าง Reconcile */}
          <div className="glossy-card">
            
            {/* 🔥 ช่องสแกนบาร์โค้ดด้วยปืนยิง เพื่อลดเวลาทำงาน (Lean Step 1) */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <input 
                ref={barcodeInputRef}
                type="text"
                placeholder="📟 ยิงปืนสแกนเนอร์บาร์โค้ดที่ถุงยาที่นี่..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeScanKeyDown}
                className="form-control"
                style={{ 
                  width: '100%', 
                  paddingLeft: '36px', 
                  fontSize: '13px', 
                  borderColor: barcodeInput ? 'var(--accent-color)' : 'var(--glass-border)',
                  boxShadow: barcodeInput ? '0 0 0 3px rgba(0,122,255,0.15)' : 'none',
                  borderRadius: '6px',
                  height: '36px'
                }}
              />
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '14px' }}>
                📟
              </div>
            </div>
            
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
              ถุงยาค้างคัดกรอง ({pendingBags.length} ถุง)
            </h3>
            
            {bagsLoading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>กำลังโหลดข้อมูลถุงยาค้างตรวจ...</p>
            ) : pendingBags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                ไม่มีถุงยาบริจาคค้างคัดแยกในระบบ
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {pendingBags.map(bag => (
                  <div 
                    key={bag.print_reference_code}
                    className={`glossy-card ${selectedBagCode === bag.print_reference_code ? 'active' : ''}`}
                    style={{ 
                      padding: '12px', 
                      marginBottom: '10px', 
                      cursor: 'pointer', 
                      border: selectedBagCode === bag.print_reference_code ? '1.5px solid var(--accent-color)' : '1px solid var(--glass-border)',
                      background: selectedBagCode === bag.print_reference_code ? 'rgba(0,113,227,0.03)' : '#FFFFFF'
                    }}
                    onClick={() => handleSelectBag(bag.print_reference_code)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--accent-color)' }}>{bag.print_reference_code}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(bag.consent_date).toLocaleDateString('th-TH', { month: '2-digit', day: '2-digit' })}
                        </span>
                        <button
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger-color)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.7
                          }}
                          title="ลบถุงยานี้"
                          onClick={(e) => handleDeleteBag(bag.print_reference_code, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      <strong>HN:</strong> {bag.hn} | <strong>ผู้บริจาค:</strong> {bag.patient_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      เวชภัณฑ์ค้างเติมล็อต: {bag.items ? bag.items.length : 0} รายการ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ฟอร์มคีย์ Lot/Exp สำหรับถุงที่เลือก */}
          <div className="glossy-card">
            {reconcileSuccess && (
              <div style={{ padding: '20px', background: 'rgba(52, 199, 89, 0.08)', border: '1px solid rgba(52, 199, 89, 0.2)', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                <CheckCircle2 style={{ color: 'var(--success-color)', margin: '0 auto 8px auto' }} size={24} />
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>ตรวจรับนำเข้าคลังสะสมเสร็จเรียบร้อย!</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ระบบทำการอัปเดตยอดคงคลัง (Upsert ตามล็อต) และบันทึก Stock Movement เป็นที่เรียบร้อย
                </p>
              </div>
            )}

            {!activeBagData ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
                <Key size={48} style={{ opacity: 0.15, margin: '0 auto 16px auto' }} />
                <p style={{ fontSize: '14px' }}>กรุณาเลือกถุงยาด้านซ้าย</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>เพื่อนำมาเปิดตรวจสภาพและกรอกข้อมูลล็อต/หมดอายุ</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmReconcile} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-color)' }}>
                        คัดแยกถุงยาอ้างอิง: {activeBagData.print_reference_code}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <strong>ผู้บริจาค:</strong> {activeBagData.patient_name} (HN: {activeBagData.hn}) | <strong>ผู้รับหน้าต่าง:</strong> {activeBagData.officer_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                      onClick={() => handleDeleteBag(activeBagData.print_reference_code)}
                      title="ลบถุงยาและรายการในถุงนี้ออกจากระบบ"
                    >
                      <Trash2 size={13} />
                      ลบถุงยานี้
                    </button>
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                    กรอกข้อมูล Lot ผลิต และวันหมดอายุ (Exp) ของเวชภัณฑ์
                  </h4>

                  <div className="table-container" style={{ overflowX: 'visible' }}>
                    <table className="apple-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>ชื่อยาบริจาค</th>
                          <th style={{ textAlign: 'right', width: '10%' }}>จำนวน</th>
                          <th style={{ width: '20%' }}>ยี่ห้อ (Brand)</th>
                          <th style={{ width: '20%' }}>ล็อตผลิต (Lot)</th>
                          <th style={{ width: '20%' }}>วันหมดอายุ (Exp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconcileItems.map((item, idx) => (
                          <tr key={`${item.icode}-${idx}`}>
                            <td>
                              <strong>{item.drug_name}</strong>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {item.quantity} {item.units}
                            </td>
                            <td>
                              <input 
                                list={`brands-${item.icode}`}
                                type="text" 
                                className="form-input" 
                                style={{ padding: '6px 8px', fontSize: '12px' }}
                                placeholder="ยี่ห้อ (เช่น Sara, Gofen)"
                                value={item.brand_name || ''}
                                onChange={(e) => handleUpdateReconcileItem(idx, 'brand_name', e.target.value)}
                              />
                              <datalist id={`brands-${item.icode}`}>
                                {(suggestedBrands[item.icode] || []).map(b => (
                                  <option key={b} value={b} />
                                ))}
                              </datalist>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '6px 8px', fontSize: '12px' }}
                                placeholder="เลขล็อต"
                                value={item.lot_number}
                                onChange={(e) => handleUpdateReconcileItem(idx, 'lot_number', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input 
                                type="date" 
                                className="form-input" 
                                style={{ padding: '6px 8px', fontSize: '12px' }}
                                value={item.expiration_date}
                                onChange={(e) => handleUpdateReconcileItem(idx, 'expiration_date', e.target.value)}
                                required
                              />
                              {item.expiration_date && (() => {
                                const exp = new Date(item.expiration_date)
                                const today = new Date()
                                today.setHours(0,0,0,0)
                                const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
                                if (diffDays < 0) {
                                  return (
                                    <span style={{ fontSize: '10px', color: 'var(--danger-color)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                                      ❌ หมดอายุแล้ว ({Math.abs(diffDays)} วันก่อน)
                                    </span>
                                  )
                                } else if (diffDays <= 90) {
                                  return (
                                    <span style={{ fontSize: '10px', color: 'var(--warning-color)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                                      ⚠️ ใกล้หมดอายุ ({diffDays} วัน)
                                    </span>
                                  )
                                } else {
                                  return (
                                    <span style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                                      ✅ ปกติ ({diffDays} วัน)
                                    </span>
                                  )
                                }
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                  <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>ผู้ตรวจคัดกรอง (จพ.คลัง)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        list="hosxp-officer-list"
                        value={inspectorName} 
                        onChange={(e) => setInspectorName(e.target.value)}
                        placeholder="พิมพ์เพื่อค้นหาชื่อเจ้าหน้าที่ใน HOSxP"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>แหล่งที่มาพัสดุ</label>
                      <select 
                        className="form-input"
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                      >
                        <option value="คืนจากผู้ป่วยเนื่องจากเหลือใช้ที่บ้าน">คืนจากผู้ป่วยเนื่องจากเหลือใช้ที่บ้าน</option>
                        <option value="รับบริจาคทั่วไป">รับบริจาคทั่วไป</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    disabled={reconcileLoading}
                  >
                    {reconcileLoading ? 'กำลังทำรายการ...' : 'ยืนยันการตรวจสอบและรับเข้าคลังสะสม (Upsert)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiveForm
