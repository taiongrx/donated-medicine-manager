import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// base: './' รองรับการ mount เป็น Sub-App ใต้ path ย่อยของ MEDUSA AI+ (เช่น /donated-medicine/) และแบบ standalone (/)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/healthz': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/readyz': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
