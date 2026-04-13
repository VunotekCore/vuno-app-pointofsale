import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const isElectron = typeof window !== 'undefined' && !!window.electronAPI
<<<<<<< HEAD

export default defineConfig({
  base: isElectron ? './' : '/',
  plugins: [
    vue(),
    tailwindcss()
    // VitePWA deshabilitado porque causa problemas con Electron (service worker falla en entorno empaquetado)
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'icons/*.svg'],
    //   manifest: false
    // })
  ],
=======
const isNetlifyBuild = process.env.CONTEXT === 'production'

const plugins = [
  vue(),
  tailwindcss()
]

if (!isElectron && isNetlifyBuild) {
  plugins.push(VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'icons/*.svg'],
    manifest: {
      name: 'Vuno POS',
      short_name: 'VunoPOS',
      description: 'Sistema de punto de venta',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        }
      ]
    }
  }))
}

export default defineConfig({
  base: isElectron ? './' : '/',
  plugins,
>>>>>>> platform
  server: {
    port: 5174,
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['@tailwindcss/vite']
  }
})
