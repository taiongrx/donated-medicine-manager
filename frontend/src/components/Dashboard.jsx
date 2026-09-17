import React, { useState, useEffect } from 'react'
import { TrendingUp, FolderCheck, Package, AlertTriangle, Download, RefreshCw } from 'lucide-react'

function Dashboard() {
  const [summary, setSummary] = useState({
    total_value_received: 0.0,
    total_value_shelved: 0.0,
    total_value_remaining: 0.0,
    total_items_pending: 0,
    total_items_shelved: 0,
    total_items_expired_warning: 0
  })
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = () => {
    setLoading(true)
    // ดึงข้อมูล Summary
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Error fetching summary:", err))

    // ดึงข้อมูล Stock Movement
    fetch('/api/reports/stock-card')
      .then(res => res.json())
      .then(data => {
        setMovements(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching stock card:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const [syncLoading, setSyncLoading] = useState(false)

  const handleSyncDrugPrices = () => {
    setSyncLoading(true)
    fetch('/api/drugs/sync', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert(`✅ ${data.message} (อัปเดต ${data.updated_count} รายการ)`)
        setSyncLoading(false)
        fetchDashboardData()
      })
      .catch(err => {
        alert(`❌ เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับ HOSxP: ${err.message}`)
        setSyncLoading(false)
      })
  }

  return (
    <div>
      {/* ส่วนควบคุมและปุ่มรายงาน */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>ภาพรวมมูลค่าและบัญชีสต็อก</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ข้อมูลอัปเดตแบบเรียลไทม์เพื่อตรวจสอบภายในและ สตง.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleSyncDrugPrices} disabled={syncLoading || loading}>
            <RefreshCw size={15} className={syncLoading ? "spin" : ""} />
            {syncLoading ? 'กำลังซิงค์ HOSxP...' : 'ซิงค์ราคายา HOSxP'}
          </button>
          <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            รีเฟรชข้อมูล
          </button>
          <a href="/api/reports/stock-card/export" download className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Download size={15} />
            ส่งออก Stock Card (CSV)
          </a>
        </div>
      </div>

      {/* Grid บอร์ดแสดงยอดสรุป (Apple Style KPI Cards) */}
      <div className="grid-3">
        {/* Card 1: มูลค่ายาคืนสะสม */}
        <div className="glossy-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>มูลค่ายาคืนสะสมทั้งหมด</span>
            <TrendingUp style={{ color: 'var(--accent-color)' }} size={20} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
            ฿{summary.total_value_received.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            คำนวณตามราคากลางพัสดุ รพ.
          </p>
        </div>

        {/* Card 2: มูลค่ายาที่โอนเข้าชั้นวางแล้ว */}
        <div className="glossy-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>โอนเข้าชั้นพร้อมใช้จริง</span>
            <FolderCheck style={{ color: 'var(--success-color)' }} size={20} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
            ฿{summary.total_value_shelved.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            โอนแล้ว {summary.total_items_shelved} รายการ (ตามระเบียบ สตง.)
          </p>
        </div>

        {/* Card 3: มูลค่ายาบริจาคคงเหลือรอโอน */}
        <div className="glossy-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>มูลค่าคงเหลือรอคัดกรอง</span>
            <Package style={{ color: 'var(--warning-color)' }} size={20} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
            ฿{summary.total_value_remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            ค้างตรวจรับ {summary.total_items_pending} ล็อตในคลังบริจาค
          </p>
        </div>
      </div>

      {/* คำเตือนยาหมดอายุ (Alert Center) */}
      {summary.total_items_expired_warning > 0 && (
        <div className="glossy-card" style={{ borderLeft: '4px solid var(--danger-color)', background: 'rgba(255, 59, 48, 0.03)', padding: '16px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle style={{ color: 'var(--danger-color)' }} size={20} />
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                พบบันทึกยาใกล้หมดอายุ/เสื่อมสภาพค้างอยู่ในคลังบริจาค ({summary.total_items_expired_warning} รายการ)
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                กรุณาตรวจสอบหน้าจัดการคลังเพื่อทำเรื่องอนุมัติตัดจ่ายทำลายพัสดุตามระเบียบพัสดุภาครัฐ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* บัญชีคุมการเคลื่อนไหว Stock Card (Audit Ledger) */}
      <div className="glossy-card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>ประวัติความเคลื่อนไหวสต็อก (Stock Card Audit Trail)</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>กำลังดึงข้อมูล...</div>
        ) : movements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>ไม่มีประวัติการทำรายการพัสดุ</div>
        ) : (
          <div className="table-container">
            <table className="apple-table">
              <thead>
                <tr>
                  <th>วันเวลาทำรายการ</th>
                  <th>รหัสยา</th>
                  <th>ชื่อเวชภัณฑ์</th>
                  <th>ล็อตผลิต</th>
                  <th>ประเภทรายการ</th>
                  <th style={{ textAlign: 'right' }}>จำนวน</th>
                  <th style={{ textAlign: 'right' }}>มูลค่า (บาท)</th>
                  <th>ผู้ดำเนินการ</th>
                  <th>เลขอ้างอิง/ใบโอน</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv) => {
                  // แปลงประเภทธุรกรรมให้อ่านง่าย
                  let typeBadgeClass = 'badge-pending';
                  let typeText = mv.transaction_type;
                  if (mv.transaction_type === 'receive') {
                    typeBadgeClass = 'badge-pending';
                    typeText = 'รับคืนบริจาค';
                  } else if (mv.transaction_type === 'shelve') {
                    typeBadgeClass = 'badge-active';
                    typeText = 'โอนเข้าชั้นวาง';
                  } else if (mv.transaction_type === 'dispose') {
                    typeBadgeClass = 'badge-disposed';
                    typeText = 'ตัดจำหน่ายทำลาย';
                  }

                  return (
                    <tr key={mv.movement_id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(mv.action_date).toLocaleString('th-TH', { 
                          year: '2-digit', month: 'short', day: '2-digit', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{mv.icode}</td>
                      <td style={{ fontWeight: 500 }}>{mv.drug_name || 'ไม่พบรายชื่อยา'}</td>
                      <td><span style={{ background: '#EFEFEF', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{mv.lot_number || '-'}</span></td>
                      <td>
                        <span className={`badge ${typeBadgeClass}`}>
                          {typeText}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{mv.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ฿{mv.value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '13px' }}>{mv.performed_by}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{mv.doc_reference || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
