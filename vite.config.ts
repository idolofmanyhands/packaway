import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'PackAway - Board Game Save Point',
        short_name: 'PackAway',
        description: 'Local-first game state tracking for tabletop sessions.',
        theme_color: '#0D1109',
        background_color: '#0D1109',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        // Tells Android/Chrome to open in-scope links inside the PWA, not browser
        handle_links: 'preferred',
        launch_handler: {
          client_mode: ['focus-existing', 'navigate-new']
        },
        protocol_handlers: [
          {
            protocol: 'web+packaway',
            url: '/#/import/%s'
          }
        ],
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      } as any
    })
  ]
})