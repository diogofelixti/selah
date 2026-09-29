/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import { BIBLE_CACHE } from './src/lib/bible/cache-name'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Selah · Leitura bíblica',
        short_name: 'Selah',
        description: 'Leia a Bíblia com calma e acompanhe seu progresso.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f2ea',
        theme_color: '#f7f2ea',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
        // Bíblias entram pelo cache em tempo de execução; fontes de alfabetos que o app não usa ficam de fora.
        globIgnores: ['bibles/**', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/bibles/'),
            handler: 'CacheFirst',
            options: { cacheName: BIBLE_CACHE },
          },
        ],
      },
    }),
  ],
  // A API (npm run server:up) responde em /api, no mesmo endereço do app, como no frodo.
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  // Teste local pelo celular: rede de casa (IP) e Tailscale (bilbo-pc.<tailnet>.ts.net).
  preview: { host: true, port: 4173, strictPort: true, allowedHosts: ['.ts.net'], proxy: { '/api': 'http://127.0.0.1:8787' } },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev') },
  // Testes de componente montam o Svelte no jsdom, que precisa da versão de navegador do runtime.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
})
