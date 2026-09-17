import React, { useState, useEffect } from 'react'
import { FolderUp, ShieldAlert, Check, Ban, CheckSquare, Square, RefreshCw, Printer, Search, X } from 'lucide-react'

function ShelvingManager({ activePrintSlip, setActivePrintSlip }) {
  const [inventories, setInventories] = useState([])
  const [loading, setLoading] = useState(true)
  const [mainSearch, setMainSearch] = useState('')

  // States สำหรับ Bulk Shelve Modal
  const [bulkShelveOpen, setBulkShelveOpen] = useState(false)
  const [shelveItems, setShelveItems] = useState([])
  const [shelveSearch, setShelveSearch] = useState('')
  const [shelveUser, setShelveUser] = useState('ภก.ยัสลัน มายุดิน')
  const [shelveDestLocation, setShelveDestLocation] = useState('ชั้นวางเวชภัณฑ์คลังยาบริจาค')
  const [shelveReceiver, setShelveReceiver] = useState('อัหลาม แคเม๊าะ')
  const [shelveRefDoc, setShelveRefDoc] = useState('')
  const [shelveRemarks, setShelveRemarks] = useState('')
  const [shelveSubmitLoading, setShelveSubmitLoading] = useState(false)

  // States สำหรับ Bulk Dispose Modal
  const [bulkDisposeOpen, setBulkDisposeOpen] = useState(false)
  const [disposeItems, setDisposeItems] = useState([])
  const [disposeSearch, setDisposeSearch] = useState('')
  const [disposeUser, setDisposeUser] = useState('ภก.ยัสลัน มายุดิน')
  const [disposeRefDoc, setDisposeRefDoc] = useState('')
  const [disposeRemarks, setDisposeRemarks] = useState('พบยาเสื่อมสภาพ/หมดอายุ ดำเนินการคัดทิ้งและทำลายตามเกณฑ์ความปลอดภัย')
  const [disposeSubmitLoading, setDisposeSubmitLoading] = useState(false)
  const [hosxpOfficers, setHosxpOfficers] = useState([])

  useEffect(() => {
    fetch('/api/officers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setHosxpOfficers(data))
      .catch(() => {})
  }, [])

  const fetchInventoryData = () => {
    setLoading(true)
    fetch('/api/inventories')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(item => item.quantity_remaining > 0 && item.status !== 'disposed')
        setInventories(filtered)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  // --- เตรียมรายการสำหรับ Modal ---
  const openBulkShelve = () => {
    const items = inventories.map(item => ({
      inventory_id: item.inventory_id,
      drug_name: item.drug_name,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      qty_remaining: item.quantity_remaining,
      selected: false,
      qty_to_process: ''
    }))
    setShelveItems(items)
    setShelveSearch('')
    
    // ดึงชื่อผู้ใช้งานปัจจุบันมาพรีเซ็ต
    const savedUser = localStorage.getItem('current_user')
    const userObj = savedUser ? JSON.parse(savedUser) : null
    setShelveUser(userObj?.name || localStorage.getItem('setting_officer_disp') || 'ภก.ยัสลัน มายุดิน')
    
    // ดึงคลังปลายทางและผู้รับมอบเริ่มต้น
    const storageLocationsStr = localStorage.getItem('setting_storage_locations') || 'ชั้นวางเวชภัณฑ์คลังยาบริจาค, คลังเย็นควบคุมอุณหภูมิ, ชั้นจ่ายยาผู้ป่วยนอก (OPD)'
    const locations = storageLocationsStr.split(',').map(x => x.trim())
    setShelveDestLocation(locations[0] || 'ชั้นวางเวชภัณฑ์คลังยาบริจาค')
    setShelveReceiver(localStorage.getItem('setting_receiver') || 'อัหลาม แคเม๊าะ')

    setShelveRefDoc(`โอน-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth()+1).padStart(2, '0')}01`)
    setShelveRemarks('')
    setBulkShelveOpen(true)
  }

  const openBulkDispose = () => {
    const items = inventories.map(item => ({
      inventory_id: item.inventory_id,
      drug_name: item.drug_name,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      qty_remaining: item.quantity_remaining,
      selected: false,
      qty_to_process: ''
    }))
    setDisposeItems(items)
    setDisposeSearch('')
    
    // ดึงชื่อผู้ใช้งานปัจจุบันมาพรีเซ็ต
    const savedUser = localStorage.getItem('current_user')
    const userObj = savedUser ? JSON.parse(savedUser) : null
    setDisposeUser(userObj?.name || localStorage.getItem('setting_officer_disp') || 'ภก.ยัสลัน มายุดิน')
    
    setDisposeRefDoc('')
    setDisposeRemarks('พบยาเสื่อมสภาพ/หมดอายุ ดำเนินการคัดทิ้งและทำลายตามเกณฑ์ความปลอดภัย')
    setBulkDisposeOpen(true)
  }

  // --- เลือกไอเท็มเดี่ยวใน Modal ---
  const handleToggleSelectItem = (itemsState, setItemsState, id) => {
    const updated = itemsState.map(item => {
      if (item.inventory_id === id) {
        const nextSelected = !item.selected
        return {
          ...item,
          selected: nextSelected,
          qty_to_process: nextSelected ? item.qty_remaining.toString() : ''
        }
      }
      return item
    })
    setItemsState(updated)
  }

  // --- ตั้ง Preset รายตัว ---
  const handlePresetItem = (itemsState, setItemsState, id) => {
    const updated = itemsState.map(item => {
      if (item.inventory_id === id) {
        return {
          ...item,
          selected: true,
          qty_to_process: item.qty_remaining.toString()
        }
      }
      return item
    })
    setItemsState(updated)
  }

  // --- ตั้ง Preset เลือกและกรอกทั้งหมด (Select & Fill All) ---
  const handlePresetAll = (itemsState, setItemsState, filterQuery) => {
    // กรองและอัปเดตเฉพาะชุดที่ตรงตามคำค้นหา ณ ขณะนั้น (เพื่อไม่ให้ไปกระทบตัวอื่นโดยไม่ได้ตั้งใจ หรือเลือกทั้งหมดเลยตามความสะดวก)
    const updated = itemsState.map(item => {
      const matchSearch = item.drug_name.toLowerCase().includes(filterQuery.toLowerCase())
      if (matchSearch) {
        return {
          ...item,
          selected: true,
          qty_to_process: item.qty_remaining.toString()
        }
      }
      return item
    })
    setItemsState(updated)
  }

  // --- ยื่นขอโอนย้ายชั้นวางแบบกลุ่ม (Bulk Shelve) ---
  const submitBulkShelve = (e) => {
    e.preventDefault()
    
    const selected = shelveItems.filter(item => item.selected && parseInt(item.qty_to_process) > 0)
    if (selected.length === 0) {
      alert("กรุณาเลือกรายการเวชภัณฑ์บริจาคและใส่จำนวนที่จะโอนอย่างน้อย 1 รายการ")
      return
    }

    if (!shelveUser) {
      alert("กรุณากรอกผู้ทำรายการโอนย้าย")
      return
    }

    setShelveSubmitLoading(true)

    fetch('/api/inventories/bulk-shelve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performed_by: shelveUser,
        doc_reference: shelveRefDoc,
        remarks: shelveRemarks || "โอนย้ายเวชภัณฑ์เข้าชั้นวางยาคลังย่อยเพื่อจ่ายต่อ (แบบกลุ่ม)",
        items: selected.map(item => ({
          inventory_id: item.inventory_id,
          quantity_to_shelve: parseInt(item.qty_to_process)
        }))
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการโอนย้ายแบบกลุ่ม")
        return res.json()
      })
      .then(data => {
        setShelveSubmitLoading(false)
        setBulkShelveOpen(false)
        
        // บันทึกเปิดตัว Slip แสดงใบเบิกพัสดุ
        setActivePrintSlip({
          type: 'requisition',
          doc_reference: shelveRefDoc || "โอนคลังย่อยประจำวัน",
          performed_by: shelveUser,
          dest_location: shelveDestLocation,
          receiver: shelveReceiver,
          date: new Date().toLocaleDateString('th-TH'),
          remarks: shelveRemarks || "โอนย้ายเวชภัณฑ์เข้าชั้นวางยาคลังย่อยเพื่อจ่ายต่อ",
          items: selected.map(item => ({
            drug_name: item.drug_name,
            lot_number: item.lot_number,
            expiration_date: item.expiration_date,
            quantity: parseInt(item.qty_to_process),
            unit_price: inventories.find(x => x.inventory_id === item.inventory_id)?.unit_price_at_receive || 0.0
          }))
        })
        fetchInventoryData()
      })
      .catch(err => {
        alert(err.message)
        setShelveSubmitLoading(false)
      })
  }

  // --- ยืนยันตัดทำลายแบบกลุ่ม (Bulk Dispose) ---
  const submitBulkDispose = (e) => {
    e.preventDefault()

    const selected = disposeItems.filter(item => item.selected && parseInt(item.qty_to_process) > 0)
    if (selected.length === 0) {
      alert("กรุณาเลือกรายการเวชภัณฑ์บริจาคและใส่จำนวนที่ต้องการทำลายอย่างน้อย 1 รายการ")
      return
    }

    if (!disposeUser || !disposeRefDoc.trim() || !disposeRemarks.trim()) {
      alert("⚠️ ระเบียบตรวจสอบพัสดุ: จำเป็นต้องระบุเลขที่หนังสือสั่งอนุมัติและเหตุผลทำลายสำหรับคุมสต็อก")
      return
    }

    setDisposeSubmitLoading(true)

    fetch('/api/inventories/bulk-dispose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performed_by: disposeUser,
        doc_reference: disposeRefDoc.trim(),
        remarks: disposeRemarks.trim(),
        items: selected.map(item => ({
          inventory_id: item.inventory_id,
          quantity_to_dispose: parseInt(item.qty_to_process)
        }))
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการตัดทำลายแบบกลุ่ม")
        return res.json()
      })
      .then(data => {
        setDisposeSubmitLoading(false)
        setBulkDisposeOpen(false)
        
        // บันทึกเปิดตัว Slip แสดงใบทำลายพัสดุ
        setActivePrintSlip({
          type: 'disposal',
          doc_reference: disposeRefDoc.trim(),
          performed_by: disposeUser,
          date: new Date().toLocaleDateString('th-TH'),
          remarks: disposeRemarks.trim(),
          items: selected.map(item => ({
            drug_name: item.drug_name,
            lot_number: item.lot_number,
            expiration_date: item.expiration_date,
            quantity: parseInt(item.qty_to_process),
            unit_price: inventories.find(x => x.inventory_id === item.inventory_id)?.unit_price_at_receive || 0.0
          }))
        })
        fetchInventoryData()
      })
      .catch(err => {
        alert(err.message)
        setDisposeSubmitLoading(false)
      })
  }

  // สั่งพิมพ์ด้วยเบราว์เซอร์
  const handlePrintSlip = () => {
    window.print()
  }

  // --- กรองและจัดเรียงตารางหลักตามหลัก FEFO (First Expire, First Out) ---
  const filteredInventories = inventories
    .filter(item => 
      item.drug_name.toLowerCase().includes(mainSearch.toLowerCase()) ||
      item.icode.toLowerCase().includes(mainSearch.toLowerCase()) ||
      item.lot_number.toLowerCase().includes(mainSearch.toLowerCase())
    )
    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))

  // --- กรองรายการใน Modals ---
  const filteredShelveItems = shelveItems.filter(item =>
    item.drug_name.toLowerCase().includes(shelveSearch.toLowerCase()) ||
    item.icode?.toLowerCase().includes(shelveSearch.toLowerCase())
  )

  const filteredDisposeItems = disposeItems.filter(item =>
    item.drug_name.toLowerCase().includes(disposeSearch.toLowerCase()) ||
    item.icode?.toLowerCase().includes(disposeSearch.toLowerCase())
  )

  return (
    <div>
      {/* ─────────────────────────────────────────────────────────────────
          แถบหัวเรื่องหลักและ Action Buttons มุมขวาบน
          ───────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>จัดการชั้นวางเวชภัณฑ์ & ตัดจำหน่ายทำลายยาบริจาค</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            รายการยาในคลังคัดแยกสะสมปัจจุบัน เลือกดำเนินการขึ้นชั้นหรือตัดจ่ายทำลายพร้อมกันทีละหลายล็อตเพื่อความสะดวกรวดเร็ว
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className="btn btn-success"
            style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
            onClick={openBulkShelve}
            disabled={inventories.length === 0}
          >
            <FolderUp size={15} style={{ marginRight: '6px' }} />
            เบิกเข้าชั้นวาง (Bulk Shelve)
          </button>
          <button 
            type="button" 
            className="btn btn-danger"
            style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
            onClick={openBulkDispose}
            disabled={inventories.length === 0}
          >
            <ShieldAlert size={15} style={{ marginRight: '6px' }} />
            ตัดจำหน่ายทำลาย (Bulk Dispose)
          </button>
        </div>
      </div>

      {/* กล่องค้นหาหน้าหลัก */}
      <div className="form-group" style={{ maxWidth: '350px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder="ค้นหาชื่อยา รหัส หรือเลขล็อต..."
            value={mainSearch}
            onChange={(e) => setMainSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ตารางรายการยาบริจาคแบบจำลอง (การแสดงผลแบบเดิมที่คุ้นเคย)
          ───────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>กำลังโหลดรายการคลัง...</div>
      ) : filteredInventories.length === 0 ? (
        <div className="glossy-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          {mainSearch ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ไม่มีรายการยารอจัดเข้าชั้นวางในขณะนี้'}
        </div>
      ) : (
        <div className="table-container">
          <table className="apple-table">
            <thead>
              <tr>
                <th>วันที่รับ</th>
                <th>รหัสยา</th>
                <th>ชื่อเวชภัณฑ์</th>
                <th>ล็อต (Lot)</th>
                <th>หมดอายุ (Exp)</th>
                <th style={{ textAlign: 'right' }}>รับคืน</th>
                <th style={{ textAlign: 'right' }}>เหลือค้างคลัง</th>
                <th>ราคา/หน่วย</th>
                <th style={{ textAlign: 'right' }}>มูลค่าคงเหลือ</th>
                <th>สถานะ</th>
                <th>รหัสสติกเกอร์</th>
                <th>ผู้คัดกรอง</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventories.map((item) => {
                const expDate = new Date(item.expiration_date)
                const today = new Date()
                const diffTime = expDate - today
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const isNearExpired = diffDays <= 180 

                return (
                  <tr key={item.inventory_id} style={isNearExpired ? { background: 'rgba(255, 149, 0, 0.02)' } : {}}>
                    <td style={{ fontSize: '12px' }}>{new Date(item.received_date).toLocaleDateString('th-TH')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.icode}</td>
                    <td style={{ fontWeight: 500 }}>
                      {item.drug_name}
                      {isNearExpired && (
                        <span style={{ marginLeft: '8px', background: 'var(--warning-color)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                          Exp ใน {diffDays} วัน
                        </span>
                      )}
                    </td>
                    <td><span style={{ background: '#EFEFEF', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{item.lot_number}</span></td>
                    <td style={{ fontWeight: 500, color: isNearExpired ? 'var(--warning-color)' : 'inherit' }}>
                      {new Date(item.expiration_date).toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.quantity_received}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-color)' }}>{item.quantity_remaining}</td>
                    <td>฿{item.unit_price_at_receive.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ฿{(item.quantity_remaining * item.unit_price_at_receive).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'pending_inspect' ? 'badge-pending' : 'badge-active'}`}>
                        {item.status === 'pending_inspect' ? 'รอตรวจสภาพ' : 'ตรวจแล้ว'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.print_reference_code}</td>
                    <td style={{ fontSize: '12px' }}>{item.inspector_name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          Modal 1: เบิกเข้าชั้นวางแบบกลุ่ม (Bulk Shelve Modal)
          ───────────────────────────────────────────────────────────────── */}
      {bulkShelveOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glossy-card" style={{ width: '800px', background: '#FFFFFF', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderUp style={{ color: 'var(--success-color)' }} />
              ทำรายการเบิกยาบริจาคเข้าชั้นวาง (Bulk Shelve)
            </h3>
            
            {/* กล่องค้นหาใน Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '6px 10px 6px 30px', fontSize: '12px' }}
                  placeholder="ค้นหาชื่อยาในหน้านี้..."
                  value={shelveSearch}
                  onChange={(e) => setShelveSearch(e.target.value)}
                />
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => handlePresetAll(shelveItems, setShelveItems, shelveSearch)}
              >
                <RefreshCw size={12} style={{ marginRight: '4px' }} />
                เลือกทั้งหมดเพื่อโอนย้าย (Preset Match)
              </button>
            </div>

            <form onSubmit={submitBulkShelve}>
              <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
                <table className="apple-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%', textAlign: 'center' }}>เลือก</th>
                      <th style={{ width: '40%' }}>ชื่อยาเวชภัณฑ์</th>
                      <th style={{ width: '15%' }}>ล็อต (Lot)</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>รอจัดเก็บ</th>
                      <th style={{ width: '25%', textAlign: 'center' }}>จำนวนที่ต้องการโอน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShelveItems.map((item) => {
                      // หาลำดับดั้งเดิมใน array หลัก
                      const originalIdx = shelveItems.findIndex(x => x.inventory_id === item.inventory_id)
                      return (
                        <tr key={item.inventory_id} style={item.selected ? { background: 'rgba(52, 199, 89, 0.03)' } : {}}>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              onClick={() => handleToggleSelectItem(shelveItems, setShelveItems, item.inventory_id)}
                            >
                              {item.selected ? <CheckSquare size={18} style={{ color: 'var(--success-color)' }} /> : <Square size={18} style={{ color: 'var(--text-secondary)' }} />}
                            </button>
                          </td>
                          <td><strong>{item.drug_name}</strong></td>
                          <td>{item.lot_number}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.qty_remaining}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '12px', width: '90px', textAlign: 'right' }}
                                placeholder="จำนวน"
                                value={item.qty_to_process}
                                onChange={(e) => {
                                  const updated = [...shelveItems]
                                  updated[originalIdx].selected = true
                                  updated[originalIdx].qty_to_process = e.target.value
                                  setShelveItems(updated)
                                }}
                                max={item.qty_remaining}
                                min={1}
                              />
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handlePresetItem(shelveItems, setShelveItems, item.inventory_id)}
                              >
                                ทั้งหมด
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ข้อมูลใบนำส่งและใบโอนย้ายคลัง */}
              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ผู้เบิกจ่าย / ผู้โอนย้ายพัสดุ (ต้นทาง)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={shelveUser}
                    onChange={(e) => setShelveUser(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ผู้รับมอบเวชภัณฑ์ (ปลายทาง)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    list="receiver-options-list"
                    value={shelveReceiver}
                    onChange={(e) => setShelveReceiver(e.target.value)}
                    placeholder="พิมพ์ หรือเลือกชื่อผู้รับมอบ"
                    required
                  />
                  <datalist id="receiver-options-list">
                    <option value={localStorage.getItem('setting_receiver') || 'อัหลาม แคเม๊าะ'} />
                    <option value={localStorage.getItem('setting_officer_disp') || 'ภก.ยัสลัน มายุดิน'} />
                    <option value={localStorage.getItem('setting_head_pharmacy') || 'ภญ.วันฮามีดะห์ ปานากาเซ็ง'} />
                    <option value={localStorage.getItem('setting_committee_1') || 'ภก.กฤษฎา โปจีน'} />
                    <option value={localStorage.getItem('setting_committee_2') || 'ภญ.อลิษา โต๊ะเปาะ'} />
                    <option value={localStorage.getItem('setting_committee_3') || 'ฟาตีเมาะ วามิง'} />
                    {hosxpOfficers.map((off, idx) => (
                      <option key={idx} value={off.name}>{off.name} ({off.entryposition || 'เจ้าหน้าที่ HOSxP'})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid-3" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>คลังปลายทาง / ชั้นวางย่อย</label>
                  <select 
                    className="form-input"
                    value={shelveDestLocation}
                    onChange={(e) => setShelveDestLocation(e.target.value)}
                    style={{ background: '#FFFFFF' }}
                  >
                    {(localStorage.getItem('setting_storage_locations') || 'ชั้นวางเวชภัณฑ์คลังยาบริจาค, คลังเย็นควบคุมอุณหภูมิ, ชั้นจ่ายยาผู้ป่วยนอก (OPD)')
                      .split(',')
                      .map(x => x.trim())
                      .map((loc, i) => (
                        <option key={i} value={loc}>{loc}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>เอกสารใบโอน (ถ้ามี)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={shelveRefDoc}
                    onChange={(e) => setShelveRefDoc(e.target.value)}
                    placeholder="เช่น โอน-69001"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>หมายเหตุประกอบ</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={shelveRemarks}
                    onChange={(e) => setShelveRemarks(e.target.value)}
                    placeholder="เช่น โอนเข้าห้องจ่ายยากลาง"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkShelveOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-success" disabled={shelveSubmitLoading}>
                  <Check size={14} style={{ marginRight: '4px' }} />
                  {shelveSubmitLoading ? 'กำลังบันทึก...' : 'ยืนยันโอนขึ้นชั้นวาง (Bulk)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          Modal 2: ขออนุมัติตัดจำหน่ายทำลายแบบกลุ่ม (Bulk Dispose Modal)
          ───────────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────
          Modal 2: ขออนุมัติตัดจำหน่ายทำลายแบบกลุ่ม (Bulk Dispose Modal - ฟอร์มบันทึกข้อความราชการภายใน)
          ───────────────────────────────────────────────────────────────── */}
      {bulkDisposeOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glossy-card" style={{ width: '850px', background: '#F9FBFD', padding: '32px', maxHeight: '95vh', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.1)' }}>
            
            {/* ส่วนหัวจำลองกระดาษบันทึกข้อความราชการ */}
            <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Sarabun, sans-serif', color: '#000000', border: '1px solid #E1E6EB' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px' }}>บันทึกข้อความ</span>
              </div>

              {/* หัวตารางจดหมายราชการ */}
              <div style={{ fontSize: '13px', lineHeight: 1.8, marginBottom: '20px', borderBottom: '1.5px solid #000', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <span style={{ width: '90px', fontWeight: 'bold' }}>ส่วนราชการ:</span>
                  <span style={{ borderBottom: '1px dotted #ccc', flex: 1 }}>กลุ่มงานเภสัชกรรม โรงพยาบาลสมเด็จพระยุพราชสายบุรี โทร. ๐๗๓-๔๑๑๐๑๑</span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flex: 1 }}>
                    <span style={{ width: '45px', fontWeight: 'bold' }}>ที่:</span>
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ height: '24px', padding: '2px 8px', fontSize: '12px', border: 'none', borderBottom: '1px dotted #888', background: 'transparent', borderRadius: 0 }}
                      required
                      value={disposeRefDoc}
                      onChange={(e) => setDisposeRefDoc(e.target.value)}
                      placeholder="เช่น รพ.สย.๐๐๓๒.๑/๖๙ (ระบุหนังสือสั่งการทำลาย)"
                    />
                  </div>
                  <div style={{ display: 'flex', width: '220px' }}>
                    <span style={{ width: '50px', fontWeight: 'bold' }}>วันที่:</span>
                    <span style={{ borderBottom: '1px dotted #ccc', flex: 1 }}>{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <span style={{ width: '90px', fontWeight: 'bold' }}>เรื่อง:</span>
                  <span style={{ borderBottom: '1px dotted #ccc', flex: 1 }}>ขออนุมัติจำหน่ายเวชภัณฑ์บริจาคเสื่อมสภาพ/หมดอายุโดยวิธีทำลาย และขออนุมัติแต่งตั้งคณะกรรมการควบคุมการทำลาย</span>
                </div>

                <div style={{ display: 'flex', marginTop: '14px' }}>
                  <span style={{ width: '90px', fontWeight: 'bold' }}>เรียน:</span>
                  <span>ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี</span>
                </div>
              </div>

              {/* ข้อความราชการจำลอง */}
              <div style={{ fontSize: '13px', lineHeight: 1.6, textAlign: 'justify', marginBottom: '16px' }}>
                <p style={{ textIndent: '2.5em', margin: '0 0 10px 0' }}>
                  ด้วย กลุ่มงานเภสัชกรรม ได้ทำการสำรวจเวชภัณฑ์บริจาคสะสมในคลังยาบริจาคที่รับมาจากกระบวนการยินยอมของผู้ป่วย พบรายการเวชภัณฑ์บริจาคที่มีการเสื่อมสภาพ หมดอายุ หรือชำรุดเสียหาย จนไม่สามารถนำมาจ่ายเพื่อการรักษาพยาบาลได้อย่างปลอดภัยแก่ผู้ป่วย จำนวน {disposeItems.filter(x => x.selected && parseInt(x.qty_to_process) > 0).length} รายการ ดังปรากฏรายละเอียดในบัญชีแนบท้าย (บัญชีหางว่าว) ที่แสดงรายการและจำนวนเพื่อเลือกทำลายดังนี้:
                </p>
              </div>

              {/* ─────────────────────────────────────────────────────────────────
                  กล่องสืบค้นและคัดเลือกยาที่จะทำลาย (ฝังอยู่ในบันทึกข้อความ)
                  ───────────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '6px', border: '1px solid #E9ECEF', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '6px 10px 6px 30px', fontSize: '12px', background: '#FFFFFF' }}
                      placeholder="ค้นหาชื่อยาในบัญชีหางว่าว..."
                      value={disposeSearch}
                      onChange={(e) => setDisposeSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', background: '#EAECEF' }}
                    onClick={() => handlePresetAll(disposeItems, setDisposeItems, disposeSearch)}
                  >
                    <RefreshCw size={12} style={{ marginRight: '4px' }} />
                    เลือกทั้งหมดและกรอก Max ของที่ค้นหา (Preset Match)
                  </button>
                </div>

            {/* ตารางเลือกรายการยาสำหรับทำลาย */}
            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="apple-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>เลือก</th>
                    <th style={{ width: '45%' }}>ชื่อยาเวชภัณฑ์บริจาค</th>
                    <th style={{ width: '15%' }}>ล็อต (Lot)</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>สต็อกคงเหลือ</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>จำนวนที่ต้องการทำลาย</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisposeItems.map((item) => {
                    const originalIdx = disposeItems.findIndex(x => x.inventory_id === item.inventory_id)
                    return (
                      <tr key={item.inventory_id} style={item.selected ? { background: 'rgba(255, 59, 48, 0.03)' } : {}}>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => handleToggleSelectItem(disposeItems, setDisposeItems, item.inventory_id)}
                          >
                            {item.selected ? <CheckSquare size={18} style={{ color: 'var(--danger-color)' }} /> : <Square size={18} style={{ color: 'var(--text-secondary)' }} />}
                          </button>
                        </td>
                        <td><strong>{item.drug_name}</strong></td>
                        <td>{item.lot_number}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.qty_remaining}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ padding: '2px 6px', fontSize: '11px', width: '70px', textAlign: 'right', background: item.selected ? '#FFF5F5' : '#FFFFFF' }}
                              placeholder="จำนวน"
                              value={item.qty_to_process}
                              onChange={(e) => {
                                const updated = [...disposeItems]
                                updated[originalIdx].selected = true
                                updated[originalIdx].qty_to_process = e.target.value
                                setDisposeItems(updated)
                              }}
                              max={item.qty_remaining}
                              min={1}
                            />
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '24px' }}
                              onClick={() => handlePresetItem(disposeItems, setDisposeItems, item.inventory_id)}
                            >
                              Max
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* สรุปจำนวนตัวยาที่เลือกและมูลค่าประเมินรวมเพื่อตรวจสอบ */}
            <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>เลือกทำลายสะสม: {disposeItems.filter(x => x.selected).length} รายการ</span>
              <span style={{ color: 'var(--danger-color)' }}>
                มูลค่าทำลายรวมโดยประมาณ: ฿{
                  disposeItems.filter(x => x.selected && parseInt(x.qty_to_process) > 0)
                    .reduce((sum, item) => {
                      const orig = inventories.find(x => x.inventory_id === item.inventory_id)
                      const price = orig ? orig.unit_price_at_receive : 0.0
                      return sum + (parseInt(item.qty_to_process) * price)
                    }, 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </span>
            </div>
          </div>

            {/* ข้อความราชการท่อนล่างและฟิลด์เหตุผล */}
            <div style={{ fontSize: '13px', lineHeight: 1.6, textAlign: 'justify', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', width: '210px' }}>กระบวนการทำลายและเหตุผลเพิ่มเติม:</span>
                <input 
                  type="text" 
                  className="form-input"
                  style={{ height: '28px', padding: '4px 8px', fontSize: '12.5px', border: 'none', borderBottom: '1px dotted #888', background: 'transparent', borderRadius: 0, flex: 1 }}
                  required
                  value={disposeRemarks}
                  onChange={(e) => setDisposeRemarks(e.target.value)}
                  placeholder="ระบุเหตุผลทำลาย เช่น เสื่อมสภาพหมดอายุ ดำเนินการทำลายเคมี"
                />
              </div>
              
              <p style={{ textIndent: '2.5em', margin: '0 0 10px 0' }}>
                เพื่อให้เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ หมวด ๔ ส่วนที่ ๔ การจำหน่ายพัสดุ กลุ่มงานเภสัชกรรมจึงใคร่ขออนุมัติจำหน่ายทำลายเวชภัณฑ์ดังกล่าว โดยเสนอแต่งตั้งคณะกรรมการควบคุมการทำลายพัสดุ จำนวน ๓ ท่านเพื่อเป็นพยานในการทำลายและจัดทำเอกสารรับรองต่อไป
              </p>
            </div>

            {/* เสนอรายชื่อคณะกรรมการควบคุมทำลาย (เสนอชื่ออัตโนมัติตามระเบียบ) */}
            <div style={{ fontSize: '13px', paddingLeft: '4em', lineHeight: 1.6, marginBottom: '24px', color: '#333' }}>
              ๑. <strong>{localStorage.getItem('setting_committee_1') || 'ภก.กฤษฎา โปจีน'}</strong> ({localStorage.getItem('setting_committee_1_title') || 'เภสัชกรชำนาญการ'}) — ประธานกรรมการควบคุมทำลาย<br />
              ๒. <strong>{localStorage.getItem('setting_committee_2') || 'ภญ.อลิษา โต๊ะเปาะ'}</strong> ({localStorage.getItem('setting_committee_2_title') || 'เภสัชกร'}) — กรรมการควบคุมทำลาย<br />
              ๓. <strong>{localStorage.getItem('setting_committee_3') || 'ฟาตีเมาะ วามิง'}</strong> ({localStorage.getItem('setting_committee_3_title') || 'เจ้าพนักงานเภสัชกรรมชำนาญงาน'}) — กรรมการควบคุมทำลาย
            </div>

            {/* ส่วนลงชื่อผู้เสนอขออนุมัติ */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '40px', fontSize: '13px' }}>
              <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>
              <div style={{ textAlign: 'center', marginTop: '24px', width: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <span style={{ width: '45px' }}>ลงชื่อ:</span>
                  <input 
                    type="text" 
                    className="form-input"
                    list="receiver-options-list"
                    style={{ height: '24px', padding: '2px 8px', fontSize: '12px', border: 'none', borderBottom: '1px dotted #888', background: 'transparent', textAlign: 'center', borderRadius: 0 }}
                    required
                    value={disposeUser}
                    onChange={(e) => setDisposeUser(e.target.value)}
                  />
                </div>
                <p style={{ margin: 0 }}>({disposeUser})</p>
                <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>ตำแหน่ง {localStorage.getItem('setting_officer_disp_title') || 'เภสัชกรปฏิบัติงานคลังยาบริจาค'}</p>
              </div>
            </div>

            {/* ปุ่มตกลง/ยกเลิกด้านล่างการ์ดกระดาษบันทึกข้อความ */}
            <form onSubmit={submitBulkDispose} style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkDisposeOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-danger" disabled={disposeSubmitLoading}>
                  <Ban size={14} style={{ marginRight: '4px' }} />
                  {disposeSubmitLoading ? 'กำลังส่งคำขอบันทึกข้อความ...' : 'ลงนามส่งบันทึกขออนุมัติทำลายพัสดุ (Bulk Dispose)'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default ShelvingManager
