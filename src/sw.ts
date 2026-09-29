/// <reference lib="webworker" />
// Service worker do Selah: o mesmo cache offline de antes, mais as notificações do lembrete diário.
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { BIBLE_CACHE } from './lib/bible/cache-name'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
// Navegação offline abre o app; a API nunca cai no fallback.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }))
// Bíblias entram no cache ao serem lidas ou baixadas para uso offline.
registerRoute(({ url }) => url.pathname.startsWith('/bibles/'), new CacheFirst({ cacheName: BIBLE_CACHE }))

// Versão nova só assume quando a pessoa aceita o aviso de atualização.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})
clientsClaim()
