import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseTarget = env.VITE_SUPABASE_URL?.replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: supabaseTarget
        ? {
            '/api/supabase': {
              target: supabaseTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api\/supabase/, ''),
            },
          }
        : undefined,
    },
  }
})
