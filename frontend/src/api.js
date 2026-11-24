/**
 * Utility สำหรับจัดการ Base Path ของ Sub-App ใต้ MEDUSA AI+
 * รองรับทั้ง Standalone (/) และ Sub-App Mount (เช่น /donated-medicine/)
 * โดยไม่ต้อง rebuild เมื่อเปลี่ยน path prefix
 */
export function getBasePath() {
  const envBase = import.meta.env.VITE_BASE_PATH
  if (envBase && envBase !== './' && envBase !== '/') {
    return envBase.replace(/\/+$/, '')
  }

  if (typeof window === 'undefined') return ''

  const pathname = window.location.pathname
    .replace(/\/index\.html$/i, '')
    .replace(/\/+$/, '')

  return pathname === '/' ? '' : pathname
}

export function apiUrl(endpoint) {
  const base = getBasePath()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${cleanEndpoint}`
}
