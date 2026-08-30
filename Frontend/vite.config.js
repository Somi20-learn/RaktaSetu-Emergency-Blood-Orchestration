import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the Express backend so the app can use same-origin "/api/..."
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
