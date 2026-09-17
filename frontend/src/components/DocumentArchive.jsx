import React, { useState, useEffect } from 'react'
import { Search, Printer, FileText, Calendar, RefreshCw } from 'lucide-react'

function DocumentArchive({ onSelectPrintSlip }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const fetchDocuments = () => {
    setLoading(true)
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  // เรียกพิมพ์เอกสารใบนั้นๆ ย้อนหลัง
  const handleOpenPrint = (docRef) => {
    fetch(`/api/documents/detail?doc_reference=${encodeURIComponent(docRef)}`)
      .then(res => {
        if (!res.ok) throw new Error("ไม่พบรายละเอียดเอกสารที่สุ่มตรวจ")
        return res.json()
      })
      .then(data => {
        onSelectPrintSlip(data)
      })
      .catch(err => alert(err.message))
  }

  // กรองตามการสืบค้นและประเภท
  const filteredDocs = documents.filter(doc => {
    const matchSearch = doc.doc_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.summary_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.performed_by.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filterType === 'all') return matchSearch
    return matchSearch && doc.transaction_type === filterType
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>ระบบสืบค้นเอกสารประวัติคลังย้อนหลัง (Document Archive)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            ค้นหา ตรวจสอบ และสั่งพิมพ์ใบโอนย้ายคลังพัสดุ หรือใบบันทึกข้อความอนุมัติทำลายพัสดุราชการย้อนหลัง เพื่อยื่นขอสอบบัญชี สตง.
          </p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={fetchDocuments}
          style={{ fontSize: '12px', padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          รีเฟรชประวัติ
        </button>
      </div>

      {/* ค้นหาและตัวกรอง */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder="ค้นเลขที่เอกสาร, ผู้ร่าง, หรือชื่อยา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className="form-input"
          style={{ width: '200px', fontSize: '13px', background: '#FFFFFF' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">แสดงเอกสารทั้งหมด</option>
          <option value="requisition">ใบเบิกและโอนย้ายคลัง (Transfer)</option>
          <option value="disposal">ใบบันทึกข้อความทำลายยา (Disposal)</option>
        </select>
      </div>

      {/* ตารางประวัติเอกสาร */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>กำลังโหลดประวัติคลังเอกสาร...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="glossy-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          {searchQuery ? 'ไม่พบเอกสารตามเงื่อนไขที่สืบค้น' : 'ยังไม่เคยมีการออกเอกสารโอนย้ายหรือขอทำลายพัสดุในระบบคลัง'}
        </div>
      ) : (
        <div className="table-container">
          <table className="apple-table">
            <thead>
              <tr>
                <th>ประเภทเอกสาร</th>
                <th>เลขที่เอกสารอ้างอิง</th>
                <th>วันที่ทำรายการ</th>
                <th>ผู้ดำเนินการคลัง</th>
                <th>สรุปรายการเวชภัณฑ์</th>
                <th style={{ textAlign: 'right' }}>จำนวนรวม</th>
                <th style={{ textAlign: 'right' }}>มูลค่าประเมินรวม</th>
                <th style={{ textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, idx) => (
                <tr key={idx}>
                  <td>
                    <span 
                      className={`badge ${doc.transaction_type === 'requisition' ? 'badge-active' : 'badge-pending'}`}
                      style={doc.transaction_type === 'disposal' ? { background: 'rgba(255, 59, 48, 0.08)', color: 'var(--danger-color)' } : {}}
                    >
                      {doc.transaction_type === 'requisition' ? 'ใบโอนย้ายคลัง' : 'ใบบันทึกขอทำลาย'}
                    </span>
                  </td>
                  <td><strong>{doc.doc_reference}</strong></td>
                  <td style={{ fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
                      {new Date(doc.date).toLocaleDateString('th-TH')}
                    </div>
                  </td>
                  <td>{doc.performed_by}</td>
                  <td style={{ fontSize: '12.5px', color: '#444' }}>{doc.summary_text}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{doc.total_quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ฿{doc.total_value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => handleOpenPrint(doc.doc_reference)}
                    >
                      <Printer size={12} style={{ marginRight: '4px' }} />
                      พิมพ์ใหม่ (Print)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DocumentArchive
