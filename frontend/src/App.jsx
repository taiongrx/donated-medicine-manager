import React, { useState, useEffect } from 'react'
import { Activity, ShieldAlert, FileText, ClipboardList, Settings as SettingsIcon, LogIn, Lock, UserCheck, FileSpreadsheet, Printer, X } from 'lucide-react'
import Dashboard from './components/Dashboard'
import ReceiveForm from './components/ReceiveForm'
import ShelvingManager from './components/ShelvingManager'
import Settings from './components/Settings'
import DocumentArchive from './components/DocumentArchive'

// คอมโพเนนต์สำหรับเจนเนอเรตบาร์โค้ด Code 39 แบบ SVG ออฟไลน์ (Lean Step 2)
function Code39Barcode({ value }) {
  const Code39Patterns = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100011000', '9': '001011000', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
    '+': '010001010', '/': '010101000', '%': '000101010'
  };

  const formattedValue = `*${value.toUpperCase()}*`;
  let result = '';
  
  for (let i = 0; i < formattedValue.length; i++) {
    const char = formattedValue[i];
    const pattern = Code39Patterns[char];
    if (pattern) {
      result += pattern + '0';
    }
  }

  let x = 0;
  const bars = [];
  
  for (let i = 0; i < formattedValue.length; i++) {
    const char = formattedValue[i];
    const pattern = Code39Patterns[char];
    if (!pattern) continue;
    
    for (let j = 0; j < 9; j++) {
      const isWide = pattern[j] === '1';
      const width = isWide ? 2.5 : 0.8;
      const isBlack = j % 2 === 0;
      
      if (isBlack) {
        bars.push(<rect key={`${i}-${j}`} x={x} y={0} width={width} height={20} fill="#000" />);
      }
      x += width;
    }
    x += 0.8;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '6px' }}>
      <svg width={x} height={20} style={{ display: 'block' }}>
        {bars}
      </svg>
      <span style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '2px', letterSpacing: '2px', fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // สั่งพิมพ์
  const [activePrintSticker, setActivePrintSticker] = useState(null)
  const [activePrintSlip, setActivePrintSlip] = useState(null) // { type: 'requisition'|'disposal', doc_reference, performed_by, date, items: [...] }

  const [dbStatus, setDbStatus] = useState('connecting')

  // บัญชีผู้ใช้งานระบบจำลองสำรองกรณีออฟไลน์
  const mockUsers = [
    { username: 'jaslan', password: '123', name: 'ภก.ยัสลัน มายุดิน', role: 'เภสัชกรชำนาญการ', dept: 'กลุ่มงานเภสัชกรรม' },
    { username: 'Ahlam', password: '123', name: 'อัหลาม แคเม๊าะ', role: 'เจ้าพนักงานเภสัชกรรม', dept: 'ห้องยา' },
    { username: 'dah', password: '123', name: 'ภญ.วันฮามีดะห์ ปานากาเซ็ง', role: 'หัวหน้ากลุ่มงานเภสัชกรรม', dept: 'กลุ่มงานเภสัชกรรม' }
  ]

  useEffect(() => {
    // 1. ตรวจสอบสถานะ Backend & Database
    fetch('/healthz')
      .then(res => res.json())
      .then(data => {
        if (data.db_mode === 'local_sqlite_fallback') {
          setDbStatus('offline_fallback')
        } else {
          setDbStatus('connected')
        }
      })
      .catch(() => {
        // ลอง fallback ไปดู dashboard/summary
        fetch('/api/dashboard/summary')
          .then(res => {
            if (res.ok) setDbStatus('connected')
            else setDbStatus('error')
          })
          .catch(() => setDbStatus('error'))
      })

    // 2. ตรวจสอบสถานะ Login
    const savedUser = localStorage.getItem('current_user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }

    // 3. กำหนดค่าเริ่มต้นผู้ลงนามราชการจริงจากฐานข้อมูล HOSxP
    if (!localStorage.getItem('setting_director')) localStorage.setItem('setting_director', 'นพ.อัยรัฐ ระมัญบากา')
    if (!localStorage.getItem('setting_director_title')) localStorage.setItem('setting_director_title', 'ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี')

    if (!localStorage.getItem('setting_head_pharmacy')) localStorage.setItem('setting_head_pharmacy', 'ภญ.วันฮามีดะห์ ปานากาเซ็ง')
    if (!localStorage.getItem('setting_head_pharmacy_title')) localStorage.setItem('setting_head_pharmacy_title', 'หัวหน้ากลุ่มงานเภสัชกรรม')

    if (!localStorage.getItem('setting_officer_disp')) localStorage.setItem('setting_officer_disp', 'ภก.ยัสลัน มายุดิน')
    if (!localStorage.getItem('setting_officer_disp_title')) localStorage.setItem('setting_officer_disp_title', 'เภสัชกรปฏิบัติงานคลังยาบริจาค')

    if (!localStorage.getItem('setting_receiver')) localStorage.setItem('setting_receiver', 'อัหลาม แคเม๊าะ')
    if (!localStorage.getItem('setting_receiver_title')) localStorage.setItem('setting_receiver_title', 'เจ้าพนักงานเภสัชกรรม')

    if (!localStorage.getItem('setting_committee_1')) localStorage.setItem('setting_committee_1', 'ภก.กฤษฎา โปจีน')
    if (!localStorage.getItem('setting_committee_1_title')) localStorage.setItem('setting_committee_1_title', 'เภสัชกรชำนาญการ')

    if (!localStorage.getItem('setting_committee_2')) localStorage.setItem('setting_committee_2', 'ภญ.อลิษา โต๊ะเปาะ')
    if (!localStorage.getItem('setting_committee_2_title')) localStorage.setItem('setting_committee_2_title', 'เภสัชกร')

    if (!localStorage.getItem('setting_committee_3')) localStorage.setItem('setting_committee_3', 'ฟาตีเมาะ วามิง')
    if (!localStorage.getItem('setting_committee_3_title')) localStorage.setItem('setting_committee_3_title', 'เจ้าพนักงานเภสัชกรรมชำนาญงาน')
  }, [])

  // ฟังก์ชันล็อกอินผ่าน API / ฐานข้อมูล HOSxP opduser
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
        localStorage.setItem('current_user', JSON.stringify(data))
        setLoginUsername('')
        setLoginPassword('')
      } else {
        const errData = await res.json()
        const msg = errData?.error?.message || errData?.detail || 'รหัสผู้ใช้งานหรือรหัสผ่าน HOSxP ไม่ถูกต้อง'
        setLoginError(`❌ ${msg}`)
      }
    } catch (err) {
      // Fallback local check
      const found = mockUsers.find(
        u => u.username === loginUsername.toLowerCase().trim() && u.password === loginPassword
      )
      if (found) {
        setCurrentUser(found)
        localStorage.setItem('current_user', JSON.stringify(found))
        setLoginUsername('')
        setLoginPassword('')
      } else {
        setLoginError('❌ ไม่สามารถเชื่อมต่อระบบยืนยันตัวตน HOSxP หรือรหัสผ่านไม่ถูกต้อง')
      }
    }
  }


  // ออกจากระบบ
  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบคลังยาบริจาคใช่หรือไม่?')) {
      setCurrentUser(null)
      localStorage.removeItem('current_user')
      setActiveTab('dashboard')
    }
  }

  // พิมพ์สติกเกอร์ยาความร้อน 8x5 ซม.
  const handlePrintSticker = (stickerData) => {
    setActivePrintSticker(stickerData)
    setActivePrintSlip(null) // เคลียร์ตัวเบิกจ่ายเพื่อไม่ให้รบกวน :has()
    setTimeout(() => {
      window.print()
    }, 200);
  }

  // พิมพ์ใบโอนย้าย/ใบทำลาย A4
  const handleOpenPrintSlip = (slipData) => {
    setActivePrintSlip(slipData)
    setActivePrintSticker(null) // เคลียร์สติกเกอร์เพื่อไม่ให้รบกวน :has()
    setTimeout(() => {
      window.print()
    }, 200);
  }

  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #F5F7FA 0%, #E4E8F0 100%)',
        fontFamily: 'var(--font-text)',
        padding: '20px'
      }}>
        <div className="glossy-card" style={{ 
          width: '420px', 
          padding: '40px', 
          background: 'rgba(255, 255, 255, 0.75)', 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px', 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: 'var(--accent-color)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              margin: '0 auto 16px auto',
              boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)'
            }}>
              <ClipboardList style={{ color: '#FFFFFF', width: '32px', height: '32px' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>ระบบคลังยาบริจาค</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>โรงพยาบาลสมเด็จพระยุพราชสายบุรี</p>
          </div>

          {loginError && (
            <div style={{ 
              background: 'rgba(255, 59, 48, 0.08)', 
              borderLeft: '4px solid var(--danger-color)', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              color: 'var(--danger-color)', 
              marginBottom: '20px' 
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>รหัสพนักงาน/Username</label>
              <div style={{ position: 'relative' }}>
                <LogIn size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '38px', fontSize: '14px' }}
                  placeholder="เช่น jaslan, Ahlam, dah"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>รหัสผ่านความปลอดภัย/Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '38px', fontSize: '14px' }}
                  placeholder="รหัสผ่าน HOSxP ของท่าน"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>
              ลงชื่อเข้าใช้งานคลังยา
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>💡 ลงชื่อเข้าใช้ด้วยบัญชี HOSxP ของท่าน:</p>
            <ul style={{ paddingLeft: '14px', margin: 0 }}>
              <li>ใช้ <strong>Username</strong> และ <strong>รหัสผ่าน HOSxP</strong> เดียวกับที่ใช้เข้าระบบจ่ายยา</li>
              <li>หากลืมรหัสผ่าน กรุณาติดต่อ <strong>ศูนย์ IT</strong> หรือผู้ดูแลระบบสารสนเทศ</li>
              <li>ระบบจะเข้าสู่โหมดสำรอง (Offline) หากไม่สามารถเชื่อมต่อ HOSxP ได้</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* ส่วนหัวของแอปพลิเคชัน (Apple Web Style Header) */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon-wrapper">
            <ClipboardList className="logo-icon" />
          </div>
          <div>
            <h1>คลังยาบริจาค</h1>
            <p>โรงพยาบาลสมเด็จพระยุพราชสายบุรี</p>
          </div>
        </div>

        {/* แถบนำทางหลัก (Main Navigation Controls) */}
        <nav className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={16} />
            ภาพรวมคลัง
          </button>
          <button 
            className={`tab-button ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => setActiveTab('receive')}
          >
            <FileText size={16} />
            คีย์รับยาบริจาค
          </button>
          <button 
            className={`tab-button ${activeTab === 'shelving' ? 'active' : ''}`}
            onClick={() => setActiveTab('shelving')}
          >
            <ShieldAlert size={16} />
            จัดการคลัง & ตัดจ่าย
          </button>
          <button 
            className={`tab-button ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <FileSpreadsheet size={16} />
            สืบค้นเอกสารย้อนหลัง
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={16} />
            ตั้งค่าระบบ
          </button>
        </nav>

        {/* แสดงเจ้าหน้าที่ล็อกอินปัจจุบัน */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }} className="user-login-info">
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '10px' }}>เข้าใช้โดย</span>
            <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name}</strong>
          </div>
          <div style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '50%', 
            background: 'rgba(0,122,255,0.1)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            color: 'var(--accent-color)'
          }}>
            <UserCheck size={16} />
          </div>
        </div>
      </header>

      {dbStatus === 'offline_fallback' && (
        <div className="glossy-card" style={{ borderLeft: '4px solid var(--warning-color)', padding: '14px 18px', marginBottom: '20px', background: 'rgba(255, 149, 0, 0.06)' }}>
          <p style={{ color: 'var(--warning-color)', fontWeight: 600, fontSize: '13px' }}>
            💡 โหมดสำรองออฟไลน์ (Offline BCP Mode): ขณะนี้ระบบทำงานบนฐานข้อมูลในเครื่อง (Local Storage) ข้อมูลถูกบันทึกอย่างปลอดภัย และพร้อมจ่ายยาตามปกติ
          </p>
        </div>
      )}

      {dbStatus === 'error' && (
        <div className="glossy-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '16px', marginBottom: '20px' }}>
          <p style={{ color: 'var(--danger-color)', fontWeight: 600, fontSize: '14px' }}>
            ⚠️ ไม่สามารถเชื่อมต่อกับ Python Backend ได้ กรุณาตรวจสอบว่าหน้าต่างรันระบบยังเปิดอยู่
          </p>
        </div>
      )}

      {/* สลับหน้าแสดงผลตามแท็บหลัก */}
      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'receive' && <ReceiveForm onPrintConsent={handlePrintSticker} />}
        {activeTab === 'shelving' && <ShelvingManager activePrintSlip={activePrintSlip} setActivePrintSlip={setActivePrintSlip} />}
        {activeTab === 'archive' && <DocumentArchive onSelectPrintSlip={handleOpenPrintSlip} />}
        {activeTab === 'settings' && <Settings currentUser={currentUser} onLogout={handleLogout} />}
      </main>

      {/* ─────────────────────────────────────────────────────────────────
          Modal 3: แสดงผลและพิมพ์ใบสรุปเบิก/ทำลาย ย้อนหลัง/ทันที (Print Slip Modal Screen)
          ───────────────────────────────────────────────────────────────── */}
      {activePrintSlip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
          <div className="glossy-card" style={{ width: '600px', background: '#FFFFFF', padding: '24px', textAlign: 'center' }}>
            <Printer size={48} style={{ color: 'var(--accent-color)', margin: '0 auto 16px auto', opacity: 0.8 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>เอกสารพร้อมจัดพิมพ์ทางระบบ</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              เลขที่เอกสาร: <strong>{activePrintSlip.doc_reference}</strong> | คุณสามารถสั่งพิมพ์เอกสารหลักฐานลงกระดาษ A4 เพื่อเก็บเข้าแฟ้มพัสดุ
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleOpenPrintSlip(activePrintSlip)}
              >
                <Printer size={14} />
                สั่งพิมพ์เอกสาร (A4 Print)
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setActivePrintSlip(null)}
              >
                <X size={14} />
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
         1. Print Container สำหรับฉลากความร้อน ขนาด 8x5 ซม. (จะแสดงเฉพาะตอนสั่งพิมพ์)
         ===================================================================== */}
      {activePrintSticker && (
        <div className="print-sticker-container">
          <div className="sticker-header">
            ใบยินยอมส่งคืนเวชภัณฑ์ รพ.สมเด็จพระยุพราชสายบุรี
          </div>
          <div className="sticker-meta">
            <span><strong>เลขที่:</strong> {activePrintSticker.print_reference_code}</span>
            <span><strong>วันที่:</strong> {new Date(activePrintSticker.consent_date || new Date()).toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' })}</span>
          </div>
          <div className="sticker-meta" style={{ marginBottom: '2px' }}>
            <span><strong>HN:</strong> {activePrintSticker.hn}</span>
            <span><strong>ผู้ส่งมอบ:</strong> {activePrintSticker.patient_name}</span>
          </div>
          
          <div style={{ fontSize: '7px', borderTop: '0.5px dashed #000', borderBottom: '0.5px dashed #000', paddingTop: '2px', paddingBottom: '2px', marginBottom: '2px', maxHeight: '16mm', overflow: 'hidden' }}>
            {activePrintSticker.items && activePrintSticker.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', lineHeight: 1.1 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '58mm' }}>
                  {idx+1}. {item.drug_name.split(' (')[0]}
                </span>
                <span>{item.quantity_received} {item.units}</span>
              </div>
            ))}
          </div>

          <div className="sticker-body" style={{ fontSize: '7px', lineHeight: 1.1, marginBottom: '2px' }}>
            ข้าพเจ้ายินยอมส่งมอบยาข้างต้นให้ รพ.สมเด็จพระยุพราชสายบุรี ตรวจรับและจัดการตามระเบียบพัสดุฯ
          </div>
          <div className="sticker-sign" style={{ marginTop: '2px' }}>
            <span>ลงชื่อ......................................................ผู้ยินยอม</span>
          </div>
          {/* เจนเนอเรตบาร์โค้ดใต้ใบยินยอมตามคำสั่งแพทย์/เภสัชกร (Lean Step 2) */}
          <Code39Barcode value={activePrintSticker.print_reference_code} />
        </div>
      )}

      {/* =====================================================================
         2. Print Container สำหรับกระดาษ A4 (ใบโอนย้ายคลัง/ใบบันทึกขอทำลาย)
         ===================================================================== */}
      {activePrintSlip && (
        <div className="print-slip-container" style={{ padding: '10px', fontFamily: 'Sarabun, sans-serif' }}>
          {activePrintSlip.type === 'disposal' ? (
            /* =====================================================================
               1. บันทึกข้อความราชการ ขออนุมัติจำหน่ายทำลายเวชภัณฑ์ (ถูกต้องตามระเบียบพัสดุ)
               ===================================================================== */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>บันทึกข้อความ</span>
              </div>
              
              <div style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '15px' }}>
                <p><strong>ส่วนราชการ:</strong> กลุ่มงานเภสัชกรรม โรงพยาบาลสมเด็จพระยุพราชสายบุรี โทร. ๐๗๓-๔๑๑๐๑๑</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>ที่:</strong> {activePrintSlip.doc_reference}</span>
                  <span><strong>วันที่:</strong> {activePrintSlip.date}</span>
                </div>
                <p><strong>เรื่อง:</strong> ขออนุมัติจำหน่ายเวชภัณฑ์บริจาคเสื่อมสภาพ/หมดอายุโดยวิธีทำลาย และขออนุมัติแต่งตั้งคณะกรรมการควบคุมการทำลาย</p>
              </div>

              <div style={{ fontSize: '13px', marginBottom: '15px', borderTop: '1px solid #000', paddingTop: '10px' }}>
                <strong>เรียน</strong> ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี
              </div>

              <div style={{ fontSize: '13px', textIndent: '2.5em', textAlign: 'justify', lineHeight: 1.6, marginBottom: '15px' }}>
                ด้วย กลุ่มงานเภสัชกรรม ได้ทำการสำรวจเวชภัณฑ์บริจาคสะสมในคลังยาบริจาค พบเวชภัณฑ์เสื่อมสภาพ/หมดอายุ ไม่สามารถจ่ายใช้งานให้เกิดความปลอดภัยแก่ผู้ป่วยได้แล้ว จำนวน {activePrintSlip.items.length} รายการ มูลค่าประเมินรวมทั้งสิ้น <strong>฿{activePrintSlip.items.reduce((sum, x) => sum + (x.quantity * x.unit_price), 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> บาท รายละเอียดปรากฏตามบัญชีแนบท้าย (บัญชีหางว่าว) นี้
              </div>

              <div style={{ fontSize: '13px', textIndent: '2.5em', textAlign: 'justify', lineHeight: 1.6, marginBottom: '15px' }}>
                เพื่อให้เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ หมวด ๔ ส่วนที่ ๔ การจำหน่ายพัสดุ กลุ่มงานเภสัชกรรมจึงใคร่ขออนุมัติจำหน่ายทำลายเวชภัณฑ์ดังกล่าว โดยเสนอแต่งตั้งคณะกรรมการควบคุมการทำลายพัสดุ ประกอบด้วยรายนามต่อไปนี้:
              </div>

              <div style={{ fontSize: '13px', paddingLeft: '5em', lineHeight: 1.6, marginBottom: '15px' }}>
                ๑. {localStorage.getItem('setting_committee_1') || 'ภก.กฤษฎา โปจีน'} ({localStorage.getItem('setting_committee_1_title') || 'เภสัชกรชำนาญการ'}) — ประธานกรรมการ<br />
                ๒. {localStorage.getItem('setting_committee_2') || 'ภญ.อลิษา โต๊ะเปาะ'} ({localStorage.getItem('setting_committee_2_title') || 'เภสัชกร'}) — กรรมการ<br />
                ๓. {localStorage.getItem('setting_committee_3') || 'ฟาตีเมาะ วามิง'} ({localStorage.getItem('setting_committee_3_title') || 'เจ้าพนักงานเภสัชกรรมชำนาญงาน'}) — กรรมการ
              </div>

              <div style={{ fontSize: '13px', textIndent: '2.5em', lineHeight: 1.6, marginBottom: '15px' }}>
                โดยคณะกรรมการดังกล่าวจะดำเนินการควบคุมการทำลายเวชภัณฑ์เสื่อมสภาพเหล่านี้ โดยวิธีเผาทำลายในเตาเผาขยะติดเชื้อของโรงพยาบาลอย่างถูกสุขลักษณะ และรายงานผลการทำลายให้ทราบต่อไป
              </div>

              <div style={{ fontSize: '13px', textIndent: '2.5em', marginBottom: '20px' }}>
                จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
              </div>

              {/* ส่วนลงชื่อเสนอเรื่องและอนุมัติ ผอ. (หน้า 1) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '12px', pageBreakInside: 'avoid', borderBottom: '1px dashed #ccc', paddingBottom: '30px' }}>
                <div style={{ textAlign: 'center', width: '45%' }}>
                  <p style={{ marginBottom: '40px' }}>เสนอเพื่อโปรดพิจารณาอนุมัติ</p>
                  <p>ลงชื่อ......................................................ผู้เสนออนุมัติ</p>
                  <p style={{ marginTop: '8px' }}>({activePrintSlip.performed_by})</p>
                  <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_officer_disp_title') || 'เภสัชกรปฏิบัติงานคลังยาบริจาค'}</p>
                </div>
                
                <div style={{ textAlign: 'left', width: '45%', border: '1px solid #000', padding: '15px', borderRadius: '5px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>คำสั่งผู้อำนวยการโรงพยาบาล</p>
                  <p style={{ margin: '6px 0' }}>[  ] อนุมัติตามเสนอ และแต่งตั้งคณะกรรมการควบคุมการทำลายตามรายนามข้างต้น</p>
                  <p style={{ margin: '6px 0' }}>[  ] ไม่อนุมัติ เนื่องจาก...............................................................................</p>
                  <p style={{ marginTop: '35px', textAlign: 'center' }}>ลงชื่อ......................................................ผู้อนุมัติ</p>
                  <p style={{ marginTop: '8px', textAlign: 'center' }}>( {localStorage.getItem('setting_director') || 'นพ.อัยรัฐ ระมัญบากา'} )</p>
                  <p style={{ marginTop: '2px', textAlign: 'center', color: '#555' }}>{localStorage.getItem('setting_director_title') || 'ผู้อำนวยการโรงพยาบาลสมเด็จพระยุพราชสายบุรี'}</p>
                </div>
              </div>
              {/* ═══ ตัดขึ้นหน้า 2: บัญชีรายการแนบท้ายเวชภัณฑ์ขอจำหน่ายทำลาย ═══ */}
              <div style={{ pageBreakBefore: 'page', breakBefore: 'page', pageBreakAfter: 'avoid', marginTop: '0' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14px' }}>บัญชีรายการแนบท้ายเวชภัณฑ์ขอจำหน่ายทำลาย</strong><br />
                  <span style={{ fontSize: '11px', color: '#555' }}>แนบหนังสือเลขที่ {activePrintSlip.doc_reference} ลงวันที่ {activePrintSlip.date}</span>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', fontWeight: 'bold' }}>
                      <th style={{ textAlign: 'left', padding: '6px 0', width: '6%' }}>ลำดับ</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', width: '44%' }}>รายการเวชภัณฑ์บริจาค</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', width: '12%' }}>เลขล็อต</th>
                      <th style={{ textAlign: 'left', padding: '6px 0', width: '13%' }}>วันหมดอายุ</th>
                      <th style={{ textAlign: 'right', padding: '6px 0', width: '10%' }}>จำนวน</th>
                      <th style={{ textAlign: 'right', padding: '6px 0', width: '15%' }}>ราคา/หน่วย</th>
                      <th style={{ textAlign: 'right', padding: '6px 0', width: '15%' }}>มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePrintSlip.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '0.5px solid #ddd' }}>
                        <td style={{ padding: '6px 0' }}>{idx + 1}</td>
                        <td style={{ padding: '6px 0' }}><strong>{item.drug_name}</strong></td>
                        <td style={{ padding: '6px 0' }}>{item.lot_number}</td>
                        <td style={{ padding: '6px 0' }}>{new Date(item.expiration_date).toLocaleDateString('th-TH')}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>฿{item.unit_price.toFixed(2)}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>฿{(item.quantity * item.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '1px solid #000', borderBottom: '1px double #000', fontWeight: 'bold' }}>
                      <td colSpan={4} style={{ padding: '8px 0', textAlign: 'right' }}>ยอดมูลค่าบริจาครวมที่ขอทำลายทั้งสิ้น</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{activePrintSlip.items.reduce((sum, x) => sum + x.quantity, 0)}</td>
                      <td style={{ padding: '8px 0' }}></td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--danger-color)' }}>
                        ฿{activePrintSlip.items.reduce((sum, x) => sum + (x.quantity * x.unit_price), 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* ส่วนลงชื่อของคณะกรรมการควบคุมการทำลายพัสดุ (หน้า 2) */}
                <div style={{ marginTop: '40px', paddingBottom: '20px', pageBreakInside: 'avoid' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'left' }}>
                    คณะกรรมการควบคุมการทำลายพัสดุ ได้ตรวจสอบและร่วมเป็นพยานในการทำลายพัสดุยาข้างต้นเรียบร้อยแล้ว:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '11px', textAlign: 'center' }}>
                    <div>
                      <p>ลงชื่อ......................................................ประธานกรรมการ</p>
                      <p style={{ marginTop: '8px' }}>({localStorage.getItem('setting_committee_1') || 'ภก.กฤษฎา โปจีน'})</p>
                      <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_committee_1_title') || 'เภสัชกรชำนาญการ'}</p>
                    </div>
                    <div>
                      <p>ลงชื่อ......................................................กรรมการ</p>
                      <p style={{ marginTop: '8px' }}>({localStorage.getItem('setting_committee_2') || 'ภญ.อลิษา โต๊ะเปาะ'})</p>
                      <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_committee_2_title') || 'เภสัชกร'}</p>
                    </div>
                    <div>
                      <p>ลงชื่อ......................................................กรรมการ</p>
                      <p style={{ marginTop: '8px' }}>({localStorage.getItem('setting_committee_3') || 'ฟาตีเมาะ วามิง'})</p>
                      <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_committee_3_title') || 'เจ้าพนักงานเภสัชกรรมชำนาญงาน'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =====================================================================
               2. ใบส่งมอบเวชภัณฑ์คัดแยกเข้าชั้นวางพัสดุ (Requisition Slip)
               ===================================================================== */
            <div>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>ใบเบิกพัสดุและโอนย้ายเวชภัณฑ์คลังย่อย (Stock Transfer Document)</h2>
                <h3 style={{ fontSize: '13px', margin: 0 }}>โรงพยาบาลสมเด็จพระยุพราชสายบุรี</h3>
                <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                  <strong>เลขอ้างอิงใบโอน:</strong> {activePrintSlip.doc_reference} | <strong>วันที่ส่งมอบ:</strong> {activePrintSlip.date}
                </p>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '12px', lineHeight: 1.6, borderBottom: '1px solid #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>คลังต้นทาง:</strong> คลังพักยาบริจาคหลัก (Main Donated Stock)</span>
                  <span><strong>คลังปลายทาง/ชั้นวาง:</strong> {activePrintSlip.dest_location || 'ชั้นวางเวชภัณฑ์คลังยาบริจาค'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span><strong>เจ้าหน้าที่ผู้ส่งมอบ:</strong> {activePrintSlip.performed_by}</span>
                  <span><strong>เจ้าหน้าที่ผู้รับพัสดุปลายทาง:</strong> {activePrintSlip.receiver || 'อัหลาม แคเม๊าะ'}</span>
                </div>
                <p style={{ marginTop: '4px' }}><strong>หมายเหตุเพิ่มเติม:</strong> {activePrintSlip.remarks}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', fontWeight: 'bold' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', width: '6%' }}>ลำดับ</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', width: '44%' }}>รายการเวชภัณฑ์บริจาค</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', width: '12%' }}>เลขล็อต</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', width: '13%' }}>วันหมดอายุ</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', width: '10%' }}>จำนวน</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', width: '15%' }}>ราคา/หน่วย</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', width: '15%' }}>มูลค่ารวม</th>
                  </tr>
                </thead>
                <tbody>
                  {activePrintSlip.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '0.5px solid #eee' }}>
                      <td style={{ padding: '6px 0' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 0' }}><strong>{item.drug_name}</strong></td>
                      <td style={{ padding: '6px 0' }}>{item.lot_number}</td>
                      <td style={{ padding: '6px 0' }}>{new Date(item.expiration_date).toLocaleDateString('th-TH')}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>฿{item.unit_price.toFixed(2)}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>฿{(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid #000', borderBottom: '1px double #000', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ padding: '8px 0', textAlign: 'right' }}>ยอดรวมมูลค่าประเมินนำเข้าชั้นวางยาคลังย่อย</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{activePrintSlip.items.reduce((sum, x) => sum + x.quantity, 0)}</td>
                    <td style={{ padding: '8px 0' }}></td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--success-color)' }}>
                      ฿{activePrintSlip.items.reduce((sum, x) => sum + (x.quantity * x.unit_price), 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '50px', fontSize: '11px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p>ลงชื่อ......................................................ผู้จ่ายพัสดุ/ผู้ส่งมอบ</p>
                    <p style={{ marginTop: '8px' }}>({activePrintSlip.performed_by})</p>
                    <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_officer_disp_title') || 'เภสัชกรคลังเวชภัณฑ์บริจาค'}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p>ลงชื่อ......................................................ผู้รับมอบเวชภัณฑ์</p>
                    <p style={{ marginTop: '8px' }}>({activePrintSlip.receiver || localStorage.getItem('setting_receiver') || 'อัหลาม แคเม๊าะ'})</p>
                    <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_receiver_title') || 'เจ้าพนักงานเภสัชกรรม'}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <p>ลงชื่อ......................................................ผู้อนุมัติการโอนย้ายคลัง</p>
                  <p style={{ marginTop: '8px' }}>({localStorage.getItem('setting_head_pharmacy') || 'ภญ.วันฮามีดะห์ ปานากาเซ็ง'})</p>
                  <p style={{ marginTop: '2px', color: '#555' }}>ตำแหน่ง {localStorage.getItem('setting_head_pharmacy_title') || 'หัวหน้ากลุ่มงานเภสัชกรรม'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
