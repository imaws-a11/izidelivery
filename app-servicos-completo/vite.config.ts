import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5174,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    allowedHosts: 'all',
  }
})
