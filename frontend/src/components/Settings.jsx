import React, { useState, useEffect } from 'react'
import { User, Users, Cog, Save, RefreshCw, Key, ShieldCheck } from 'lucide-react'

function Settings({ currentUser, onLogout }) {
  const [activeSubMenu, setActiveSubMenu] = useState('profile')

  // --- State สำหรับ Profile ---
  const [profileName, setProfileName] = useState(currentUser?.name || '')
  const [profileRole, setProfileRole] = useState(currentUser?.role || '')
  const [profileDept, setProfileDept] = useState(currentUser?.dept || '')
  
  // --- State สำหรับ Approvers, Officers & Committees (ชื่อ + ตำแหน่งทางราชการ) ---
  const [directorName, setDirectorName] = useState('')
  const [directorTitle, setDirectorTitle] = useState('')
  const [headOfPharmacy, setHeadOfPharmacy] = useState('')
  const [headOfPharmacyTitle, setHeadOfPharmacyTitle] = useState('')
  const [officerDispName, setOfficerDispName] = useState('')
  const [officerDispTitle, setOfficerDispTitle] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverTitle, setReceiverTitle] = useState('')

  const [committee1, setCommittee1] = useState('')
  const [committee1Title, setCommittee1Title] = useState('')
  const [committee2, setCommittee2] = useState('')
  const [committee2Title, setCommittee2Title] = useState('')
  const [committee3, setCommittee3] = useState('')
  const [committee3Title, setCommittee3Title] = useState('')

  // --- State สำหรับ App & Inventory Settings ---
  const [warningThreshold, setWarningThreshold] = useState('180')
  const [storageLocations, setStorageLocations] = useState('')
  const [hosxpIp, setHosxpIp] = useState('192.168.0.251')
  const [hosxpPort, setHosxpPort] = useState('3306')
  const [syncTime, setSyncTime] = useState('00:00')


  // --- State สำหรับ HOSxP Officers List & Positions ---
  const [hosxpOfficers, setHosxpOfficers] = useState([])
  const [hosxpPositions, setHosxpPositions] = useState([])

  // โหลดค่าดั้งเดิมจาก localStorage และดึงรายชื่อเจ้าหน้าที่จากฐาน HOSxP (opduser)
  useEffect(() => {
    fetch('/api/officers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setHosxpOfficers(data))
      .catch(() => {})

    fetch('/api/positions')
      .then(res => res.ok ? res.json() : [])
      .then(data => setHosxpPositions(data))
      .catch(() => {})

    setDirectorName(localStorage.getItem('setting_director') || '')
    setDirectorTitle(localStorage.getItem('setting_director_title') || '')
    setHeadOfPharmacy(localStorage.getItem('setting_head_pharmacy') || '')
    setHeadOfPharmacyTitle(localStorage.getItem('setting_head_pharmacy_title') || '')
    setOfficerDispName(localStorage.getItem('setting_officer_disp') || '')
    setOfficerDispTitle(localStorage.getItem('setting_officer_disp_title') || '')
    setReceiverName(localStorage.getItem('setting_receiver') || '')
    setReceiverTitle(localStorage.getItem('setting_receiver_title') || '')

    setCommittee1(localStorage.getItem('setting_committee_1') || '')
    setCommittee1Title(localStorage.getItem('setting_committee_1_title') || '')
    setCommittee2(localStorage.getItem('setting_committee_2') || '')
    setCommittee2Title(localStorage.getItem('setting_committee_2_title') || '')
    setCommittee3(localStorage.getItem('setting_committee_3') || '')
    setCommittee3Title(localStorage.getItem('setting_committee_3_title') || '')

    setWarningThreshold(localStorage.getItem('setting_warning_threshold') || '180')
    setStorageLocations(localStorage.getItem('setting_storage_locations') || 'ชั้นวางเวชภัณฑ์คลังยาบริจาค, คลังเย็นควบคุมอุณหภูมิ, ชั้นจ่ายยาผู้ป่วยนอก (OPD)')
  }, [])

  // ฟังก์ชันช่วยเหลือในการเลือกรายชื่อเจ้าหน้าที่ HOSxP และเติมตำแหน่งให้อัตโนมัติ
  const handleOfficerSelect = (nameVal, setNameState, setTitleState) => {
    setNameState(nameVal)
    if (nameVal && setTitleState) {
      const matched = hosxpOfficers.find(o => o.name === nameVal)
      if (matched && matched.entryposition) {
        setTitleState(matched.entryposition)
      }
    }
  }

  // รายชื่อตำแหน่งรวม (Preset + HOSxP entryposition)
  const allPositions = Array.from(new Set([
    "ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี",
    "หัวหน้ากลุ่มงานเภสัชกรรม",
    "เภสัชกรปฏิบัติงานคลังยาบริจาค",
    "เภสัชกรเชี่ยวชาญ",
    "เภสัชกรชำนาญการพิเศษ",
    "เภสัชกรชำนาญการ",
    "เภสัชกรปฏิบัติการ",
    "เจ้าพนักงานเภสัชกรรมชำนาญงาน",
    "เจ้าพนักงานเภสัชกรรมปฏิบัติงาน",
    "เจ้าพนักงานเภสัชกรรม",
    "เจ้าหน้าที่พัสดุชำนาญงาน",
    "เจ้าหน้าที่รับพัสดุคลังปลายทาง",
    "นักจัดการงานทั่วไปชำนาญการ",
    "พยาบาลวิชาชีพชำนาญการ",
    ...hosxpPositions
  ])).filter(Boolean)


  // บันทึกโปรไฟล์
  const handleSaveProfile = (e) => {
    e.preventDefault()
    const updatedUser = {
      ...currentUser,
      name: profileName,
      role: profileRole,
      dept: profileDept
    }
    localStorage.setItem('current_user', JSON.stringify(updatedUser))
    alert('บันทึกข้อมูลโปรไฟล์ส่วนตัวเรียบร้อยแล้ว (กรุณารีเฟรชเพื่อแสดงผลในหน้าอื่นๆ)')
  }

  // บันทึกรายชื่อผู้ลงนาม/ตำแหน่งทางราชการ/คณะกรรมการ
  const handleSaveStakeholders = (e) => {
    e.preventDefault()
    localStorage.setItem('setting_director', directorName)
    localStorage.setItem('setting_director_title', directorTitle)
    localStorage.setItem('setting_head_pharmacy', headOfPharmacy)
    localStorage.setItem('setting_head_pharmacy_title', headOfPharmacyTitle)
    localStorage.setItem('setting_officer_disp', officerDispName)
    localStorage.setItem('setting_officer_disp_title', officerDispTitle)
    localStorage.setItem('setting_receiver', receiverName)
    localStorage.setItem('setting_receiver_title', receiverTitle)

    localStorage.setItem('setting_committee_1', committee1)
    localStorage.setItem('setting_committee_1_title', committee1Title)
    localStorage.setItem('setting_committee_2', committee2)
    localStorage.setItem('setting_committee_2_title', committee2Title)
    localStorage.setItem('setting_committee_3', committee3)
    localStorage.setItem('setting_committee_3_title', committee3Title)
    alert('บันทึกรายชื่อผู้ลงนามและตำแหน่งทางราชการเรียบร้อยแล้ว!')
  }

  // บันทึกตั้งค่าระบบ
  const handleSaveSystemSettings = (e) => {
    e.preventDefault()
    localStorage.setItem('setting_warning_threshold', warningThreshold)
    localStorage.setItem('setting_storage_locations', storageLocations)
    alert('บันทึกการตั้งค่าระบบคลังและจำลอง HOSxP เรียบร้อยแล้ว!')
  }

  return (
    <div style={{ display: 'flex', gap: '28px', minHeight: '500px' }}>
      
      {/* ─────────────────────────────────────────────────────────────────
          Sidebar นำทางย่อยของการตั้งค่า (Settings Submenu)
          ───────────────────────────────────────────────────────────────── */}
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button 
          className={`tab-button ${activeSubMenu === 'profile' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          onClick={() => setActiveSubMenu('profile')}
        >
          <User size={16} />
          โปรไฟล์ผู้ใช้งาน
        </button>
        <button 
          className={`tab-button ${activeSubMenu === 'stakeholders' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          onClick={() => setActiveSubMenu('stakeholders')}
        >
          <Users size={16} />
          ตั้งค่าผู้ลงนามและกรรมการ
        </button>
        <button 
          className={`tab-button ${activeSubMenu === 'system' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          onClick={() => setActiveSubMenu('system')}
        >
          <Cog size={16} />
          ตั้งค่าคลังและฐานข้อมูล
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          เนื้อหาแสดงผลตามเมนูย่อยที่เลือก
          ───────────────────────────────────────────────────────────────── */}
      <div className="glossy-card" style={{ flex: 1, padding: '28px', background: '#FFFFFF' }}>
        
        {/* 1. โปรไฟล์ผู้ใช้ (User Profile) */}
        {activeSubMenu === 'profile' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--accent-color)' }} />
              โปรไฟล์เจ้าหน้าที่ผู้ปฏิบัติงาน
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              ข้อมูลของเจ้าหน้าที่ที่กำลังลงชื่อใช้งานระบบในปัจจุบัน ใช้สลักเป็นประวัติบน Stock Card และเอกสารขออนุมัติ
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12.5px' }}>ชื่อ-นามสกุลเจ้าหน้าที่</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12.5px' }}>ตำแหน่งวิชาชีพ</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="เช่น เภสัชกรชำนาญการ, เจ้าพนักงานเภสัชกรรม"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12.5px' }}>หน่วยงาน/ฝ่ายงานสังกัด</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={profileDept}
                  onChange={(e) => setProfileDept(e.target.value)}
                  placeholder="เช่น กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '12.5px' }}>สิทธิ์ระดับการใช้งานระบบ (Permission level)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0F5FA', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#1A4D80' }}>
                  <ShieldCheck size={16} />
                  <span>สิทธิ์การใช้งานปัจจุบัน: <strong>{currentUser?.username === 'dah' || currentUser?.username === 'head_pharm' ? 'ผู้บริหารคุมสต็อก / หัวหน้างาน' : 'เภสัชกรปฏิบัติการงานคลัง'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EEE', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ background: 'var(--danger-color)', padding: '8px 16px', fontSize: '12px' }}
                  onClick={onLogout}
                >
                  ออกจากระบบ (Logout)
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  <Save size={14} />
                  บันทึกข้อมูลโปรไฟล์
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. ตั้งค่ารายชื่อผู้ลงนามและตำแหน่งทางราชการ */}
        {activeSubMenu === 'stakeholders' && (
          <div>
            {/* Datalist ตัวเลือกเจ้าหน้าที่ที่ดึงจากฐานข้อมูล HOSxP opduser จริง */}
            <datalist id="hosxp-officer-list">
              {hosxpOfficers.map((off, idx) => (
                <option key={idx} value={off.name}>{off.name} ({off.entryposition || 'เจ้าหน้าที่ HOSxP'})</option>
              ))}
            </datalist>

            {/* Datalist ตัวเลือกตำแหน่งมาตรฐานและตำแหน่งจาก HOSxP opduser */}
            <datalist id="position-list">
              {allPositions.map((pos, idx) => (
                <option key={idx} value={pos} />
              ))}
            </datalist>


            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--accent-color)' }} />
              ตั้งค่ารายชื่อผู้ลงนามและตำแหน่งทางราชการ
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              กำหนดชื่อ-นามสกุล และตำแหน่งทางราชการของผู้มีอำนาจลงนามและคณะกรรมการ เพื่อนำไปเรนเดอร์ในเอกสารเสนอขอทำลายพัสดุ A4 และใบโอนย้ายคลังอัตโนมัติ (ดึงจาก HOSxP opduser ทั้งหมด {hosxpOfficers.length} รายชื่อ)
            </p>

            <form onSubmit={handleSaveStakeholders}>
              {/* กลุ่ม 1: ผู้บริหารและหัวหน้างาน */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '14px', color: '#1E293B' }}>
                  🏛️ ผู้บริหารและผู้ลงนามระดับหัวหน้างาน (Executive Approvers)
                </h4>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ผู้อำนวยการโรงพยาบาล (ผู้อนุมัติขั้นสุดท้าย)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={directorName}
                      onChange={(e) => handleOfficerSelect(e.target.value, setDirectorName, setDirectorTitle)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ตำแหน่งผู้อำนวยการ</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={directorTitle}
                      onChange={(e) => setDirectorTitle(e.target.value)}
                      placeholder="เช่น ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>หัวหน้ากลุ่มงานเภสัชกรรม (ผู้เสนอ/ผู้อนุมัติโอนคลัง)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={headOfPharmacy}
                      onChange={(e) => handleOfficerSelect(e.target.value, setHeadOfPharmacy, setHeadOfPharmacyTitle)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ตำแหน่งหัวหน้ากลุ่มงาน</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={headOfPharmacyTitle}
                      onChange={(e) => setHeadOfPharmacyTitle(e.target.value)}
                      placeholder="เช่น หัวหน้ากลุ่มงานเภสัชกรรม"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* กลุ่ม 2: เจ้าหน้าที่คลังและผู้รับมอบ */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '14px', color: '#1E293B' }}>
                  📦 เจ้าหน้าที่คลังยาบริจาคและผู้รับมอบพัสดุ (Operational Staff)
                </h4>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>เภสัชกรคลังยาบริจาค (ผู้เสนออนุมัติ/ผู้จ่ายพัสดุ)</label>
                      {currentUser?.name && (
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          onClick={() => {
                            setOfficerDispName(currentUser.name)
                            if (currentUser.role) setOfficerDispTitle(currentUser.role)
                          }}
                        >
                          ⚡ ใช้ชื่อผู้ใช้ปัจจุบัน
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={officerDispName}
                      onChange={(e) => handleOfficerSelect(e.target.value, setOfficerDispName, setOfficerDispTitle)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ตำแหน่งเภสัชกรคลัง</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={officerDispTitle}
                      onChange={(e) => setOfficerDispTitle(e.target.value)}
                      placeholder="เช่น เภสัชกรปฏิบัติงานคลังยาบริจาค"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>เจ้าหน้าที่ผู้รับมอบเวชภัณฑ์ปลายทาง (คลังย่อย)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={receiverName}
                      onChange={(e) => handleOfficerSelect(e.target.value, setReceiverName, setReceiverTitle)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>ตำแหน่งผู้รับมอบ</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={receiverTitle}
                      onChange={(e) => setReceiverTitle(e.target.value)}
                      placeholder="เช่น เจ้าหน้าที่รับพัสดุคลังปลายทาง"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* กลุ่ม 3: คณะกรรมการควบคุมการทำลายพัสดุ 3 ท่าน */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '14px', color: '#1E293B' }}>
                  📋 คณะกรรมการควบคุมการทำลายพัสดุ (ระเบียบราชการ ๓ คน)
                </h4>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>๑. ประธานกรรมการควบคุมทำลาย</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={committee1}
                      onChange={(e) => handleOfficerSelect(e.target.value, setCommittee1, setCommittee1Title)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ตำแหน่งประธานกรรมการ</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={committee1Title}
                      onChange={(e) => setCommittee1Title(e.target.value)}
                      placeholder="เช่น เภสัชกรชำนาญการ"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>๒. กรรมการควบคุมทำลายคนที่ ๑</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={committee2}
                      onChange={(e) => handleOfficerSelect(e.target.value, setCommittee2, setCommittee2Title)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ตำแหน่งกรรมการคนที่ ๑</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={committee2Title}
                      onChange={(e) => setCommittee2Title(e.target.value)}
                      placeholder="เช่น เภสัชกรปฏิบัติการ"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>๓. กรรมการควบคุมทำลายคนที่ ๒</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="hosxp-officer-list"
                      value={committee3}
                      onChange={(e) => handleOfficerSelect(e.target.value, setCommittee3, setCommittee3Title)}
                      placeholder="พิมพ์เพื่อค้นหาชื่อใน HOSxP opduser"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ตำแหน่งกรรมการคนที่ ๒</label>
                    <input 
                      type="text" 
                      className="form-input"
                      list="position-list"
                      value={committee3Title}
                      onChange={(e) => setCommittee3Title(e.target.value)}
                      placeholder="เช่น เจ้าหน้าที่พัสดุชำนาญงาน"
                      required
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #EEE', paddingTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '13px' }}>
                  <Save size={15} />
                  บันทึกรายชื่อผู้ลงนามและตำแหน่งทางราชการ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. ตั้งค่าระบบคลังและจำลอง HOSxP */}
        {activeSubMenu === 'system' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cog size={18} style={{ color: 'var(--accent-color)' }} />
              ตั้งค่าความปลอดภัยคลังยา & ข้อมูลเชื่อมโยงฐานข้อมูล
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              กำหนดเกณฑ์เตือนอายุคลังพัสดุบริจาค ข้อมูลชั้นวางทางกายภาพ และรายละเอียดการ sync ฐานข้อมูลกับ HOSxP ส่วนกลาง
            </p>

            <form onSubmit={handleSaveSystemSettings}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>เกณฑ์กำหนดแจ้งเตือนยาใกล้หมดอายุ (วัน)</label>
                <select 
                  className="form-input"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(e.target.value)}
                  style={{ background: '#FFFFFF' }}
                >
                  <option value="90">90 วัน (3 เดือน)</option>
                  <option value="180">180 วัน (6 เดือน - ค่าแนะนำ)</option>
                  <option value="270">270 วัน (9 เดือน)</option>
                  <option value="360">360 วัน (1 ปี)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#888' }}>ผลลัพธ์: ตัวยาที่มีวันหมดอายุน้อยกว่าค่านี้จะแสดงป้ายส้มเตือนในหน้าคลังหลัก</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 'bold' }}>รายชื่อชั้นวาง/ห้องจ่ายยาบริจาค (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
                <textarea 
                  className="form-input"
                  style={{ minHeight: '60px', padding: '8px 12px' }}
                  value={storageLocations}
                  onChange={(e) => setStorageLocations(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: '#888' }}>หน้าที่: นำไปเป็นข้อมูล Preset ตัวเลือกตอนที่ต้องการโอนย้ายยาบริจาคขึ้นชั้น</span>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid #EEE', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                  การตั้งค่าความปลอดภัยและการเชื่อมต่อฐานข้อมูล HOSxP
                </h4>
                
                <div className="grid-3" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Database Server IP Address</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={hosxpIp}
                      onChange={(e) => setHosxpIp(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11.5px' }}>MySQL Port</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={hosxpPort}
                      onChange={(e) => setHosxpPort(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11.5px' }}>เวลาซิงค์คลังยาอัตโนมัติ</label>
                    <input 
                      type="time" 
                      className="form-input"
                      value={syncTime}
                      onChange={(e) => setSyncTime(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#666', background: '#F8F9FA', padding: '10px 14px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  🚀 <strong>ระบบ Data Sync Pipeline เบื้องหลัง:</strong> จะทำการดาวน์โหลดราคากลางเวชภัณฑ์และ generic catalog จาก HOSxP มาอัปเดตลงตาราง `donated_local_drug_items` อัตโนมัติทุกๆ เวลา <strong>{syncTime} น.</strong> เพื่อความปลอดภัยสูงสุดและไม่รบกวนแบนด์วิธเครือข่ายของแผนกไอที รพ. ช่วงเวลาทำงานกลางวัน
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #EEE', paddingTop: '20px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  <Save size={14} />
                  บันทึกเกณฑ์คลังและ IP HOSxP
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

export default Settings
