import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const readPort = (value: string | undefined, fallback: number) => {
  if (!value) return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const readEnv = (key: string) => process.env[key] ?? fileEnv[key]

  const runtimeMode = (readEnv('VITE_RUNTIME_MODE') ?? 'local').trim().toLowerCase()
  const devHost = readEnv('VITE_DEV_HOST') ?? '127.0.0.1'
  const devPort = readPort(readEnv('VITE_DEV_PORT'), 5173)
  const apiProxyTarget = readEnv('VITE_API_PROXY_TARGET')
  const useLocalProxy = command === 'serve' && runtimeMode === 'local'

  if (useLocalProxy && !apiProxyTarget) {
    throw new Error('VITE_API_PROXY_TARGET is required for local development. Check frontend/.env.development.')
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: devHost,
      port: devPort,
      strictPort: true,
      proxy: useLocalProxy
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    preview: {
      host: devHost,
      port: 4173,
      strictPort: true,
    },
  }
})
