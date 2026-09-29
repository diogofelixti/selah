/// <reference lib="webworker" />
// Service worker do Selah: o mesmo cache offline de antes, mais as notificações do lembrete diário.
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { BIBLE_CACHE } from './lib/bible/cache-name'
import { resolveLanguage } from './lib/i18n/lang'
import { reminderNotification } from './lib/reminder-text'
import { readForReminder } from './lib/storage/sw-read'

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

// Lembrete diário: o servidor manda só { type: 'reminder' }; o texto sai do que está neste aparelho.
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload: { type?: string; lang?: string } = {}
      try {
        payload = event.data?.json() ?? {}
      } catch {
        // mensagem sem JSON: trata como lembrete
      }
      if (payload.type && payload.type !== 'reminder') return
      const data = await readForReminder().catch(() => null)
      const lang = resolveLanguage(data?.language ?? 'auto', self.navigator.language)
      const note = reminderNotification(data ?? { readings: [], state: { lastPosition: null, activePlan: null } }, lang)
      await self.registration.showNotification(note.title, {
        body: note.body,
        icon: '/pwa-192x192.png',
        tag: 'selah-lembrete',
        lang: lang === 'pt' ? 'pt-BR' : 'en',
        data: { url: note.url },
      })
    })(),
  )
})

// Tocar na notificação: usa a janela do app que já estiver aberta; senão, abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data as { url?: string } | null)?.url ?? '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (open) {
        // Foco primeiro (alguns navegadores só aceitam logo após o toque); se não der para navegar
        // nessa janela (não controlada pelo service worker), abre uma nova no lugar certo.
        const focused = await open.focus().catch(() => open)
        const moved = await focused.navigate(url).catch(() => null)
        if (!moved) await self.clients.openWindow(url)
      } else {
        await self.clients.openWindow(url)
      }
    })(),
  )
})
