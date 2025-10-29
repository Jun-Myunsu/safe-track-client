import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/socket.io': {
          target: serverUrl,
          ws: true
        },
        '/api': {
          target: serverUrl,
          changeOrigin: true
        }
      }
    }
  }
})