import { registerSW } from 'virtual:pwa-register'
import { BOOKS } from './bible/books'
import { prefetchTranslation } from './bible/prefetch'
import type { TranslationId } from './bible/types'

export const pwa = $state({ needRefresh: false, offlineDone: 0, offlineTotal: BOOKS.length })

let updateSW: ((reload?: boolean) => Promise<void>) | null = null
let current: TranslationId | null = null

export function initPwa(): void {
  if ('serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh() {
        pwa.needRefresh = true
      },
    })
  }
  // Pede ao navegador para não apagar os dados quando faltar espaço. Recusa não é erro.
  void navigator.storage?.persist?.().catch(() => false)
}

export function applyUpdate(): void {
  void updateSW?.(true)
}

/** Baixa em segundo plano todos os livros da tradução. Trocar de idioma reinicia a contagem. */
export async function ensureOffline(tr: TranslationId): Promise<void> {
  if (!('caches' in window) || current === tr) return
  current = tr
  pwa.offlineDone = 0
  await prefetchTranslation(tr, (done) => {
    if (current === tr) pwa.offlineDone = done
  })
}
