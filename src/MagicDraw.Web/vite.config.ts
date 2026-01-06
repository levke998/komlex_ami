import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: parseInt(process.env.PORT ?? "5173"),
    proxy: {
      '/api': {
        target: process.env.services__api__https__0 || process.env.services__api__http__0 || 'https://localhost:7251',
        changeOrigin: true,
        secure: false, // Allow self-signed certs
        rewrite: (path) => path // Don't verify rewrite for now, usually /api is preserved
      }
    }
  }
})
