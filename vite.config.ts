import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// `vite build --mode artifact`: versão para abrir como página do claude.ai
// (caminhos relativos e sem service worker, que lá não é permitido).
export default defineConfig(({ mode }) => ({
  base: mode === 'artifact' ? './' : '/',
  build: mode === 'artifact' ? { outDir: 'dist-artifact' } : undefined,
  plugins: [
    react(),
    tailwindcss(),
    mode !== 'artifact' &&
    VitePWA({
      registerType: 'autoUpdate',
      // registro feito em main.tsx: no app para Mac o service worker fica desligado
      injectRegister: false,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'FretLab',
        short_name: 'FretLab',
        description: 'Teoria musical no braço da guitarra e do baixo',
        lang: 'pt-BR',
        theme_color: '#1c1310',
        background_color: '#1c1310',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,woff2,sf2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
