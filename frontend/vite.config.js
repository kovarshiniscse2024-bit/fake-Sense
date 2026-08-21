import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/verify': 'http://127.0.0.1:8000',
      '/history': 'http://127.0.0.1:8000',
      '/dashboard': 'http://127.0.0.1:8000',
      '/compare': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
    }
  }
})
