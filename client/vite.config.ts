import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
      server: {
        port: 3000,
        host: true,
        proxy: {
          '/api': {
            target: env.API_BASE_URL,
            changeOrigin: true,
          },
        },
      }
  }
})
