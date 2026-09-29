import { registerSW } from 'virtual:pwa-register'
import { BOOKS } from './bible/books'
import { cleanupOldBibleCaches, createOfflineSync } from './bible/offline'
import { prefetchTranslation } from './bible/prefetch'
import type { TranslationId } from './bible/types'
import { createUpdateChecker } from './update-check'

const UPDATE_INTERVAL_MS = 60 * 60 * 1000

export const pwa = $state({
  needRefresh: false,
  dismissed: false,
  offlineSupported: typeof window !== 'undefined' && 'caches' in window,
  offlineDone: 0,
  offlineTotal: BOOKS.length,
})

let updateSW: ((reload?: boolean) => Promise<void>) | null = null
let checkForUpdate: () => void = () => {}
let wanted: TranslationId | null = null

const sync = createOfflineSync(
  (tr, onProgress) => prefetchTranslation(tr, onProgress),
  (tr, done) => {
    if (tr === wanted) pwa.offlineDone = done
  },
)

export function initPwa(): void {
  if ('serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh() {
        pwa.needRefresh = true
        pwa.dismissed = false
      },
      onRegisteredSW(_url, registration) {
        // App instalado costuma ficar dias aberto em segundo plano: procura versão nova ao voltar para ele.
        if (registration) checkForUpdate = createUpdateChecker(() => registration.update(), UPDATE_INTERVAL_MS)
      },
    })
  }
  if (pwa.offlineSupported) void cleanupOldBibleCaches().catch(() => {})
  // Pede ao navegador para não apagar os dados quando faltar espaço. Recusa não é erro.
  void navigator.storage?.persist?.().catch(() => false)
}

/** Chamado ao voltar para o app ou quando a conexão volta. */
export function onResume(): void {
  checkForUpdate()
  if (wanted) void sync.ensure(wanted)
}

export function applyUpdate(): void {
  // O registerSW só recarrega quando acha que a versão nova veio desta aba. Na primeira visita seguida de
  // atualização (ou versão achada por outra aba) ele não recarrega; a troca de controle cobre esses casos.
  navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  void updateSW?.(true)
}

export function dismissUpdate(): void {
  pwa.dismissed = true
}

/** Baixa em segundo plano todos os livros da tradução; livros que falharem são tentados de novo em onResume(). */
export function ensureOffline(tr: TranslationId): void {
  if (!pwa.offlineSupported) return
  if (wanted !== tr) pwa.offlineDone = 0
  wanted = tr
  void sync.ensure(tr)
}
