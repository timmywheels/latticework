import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // the API/OG server; preview inherits this proxy too
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/og': 'http://localhost:8787',
    },
  },
})
