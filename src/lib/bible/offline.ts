import { BOOKS } from './books'
import { BIBLE_CACHE } from './cache-name'
import type { TranslationId } from './types'

type Prefetch = (tr: TranslationId, onProgress: (done: number, total: number) => void) => Promise<void>
type Report = (tr: TranslationId, done: number, total: number) => void

/**
 * Garante o download offline de uma tradução. Uma tradução completa não é baixada de novo;
 * uma incompleta (sem rede, erro no cache) pode ser tentada outra vez na próxima chamada.
 */
export function createOfflineSync(prefetch: Prefetch, report: Report) {
  const complete = new Set<TranslationId>()
  let running: TranslationId | null = null

  async function ensure(tr: TranslationId): Promise<void> {
    if (complete.has(tr)) {
      report(tr, BOOKS.length, BOOKS.length)
      return
    }
    if (running === tr) return
    running = tr
    let last = 0
    try {
      await prefetch(tr, (done, total) => {
        last = done
        report(tr, done, total)
      })
    } catch {
      // Fica incompleto; a próxima chamada tenta de novo.
    }
    if (last === BOOKS.length) complete.add(tr)
    if (running === tr) running = null
  }

  return { ensure }
}

/** Apaga caches de versões anteriores dos textos (ex.: bibles-v0 depois de subir para bibles-v1). */
export async function cleanupOldBibleCaches(cachesApi: CacheStorage = caches): Promise<void> {
  const names = await cachesApi.keys()
  await Promise.all(
    names.filter((n) => n.startsWith('bibles-') && n !== BIBLE_CACHE).map((n) => cachesApi.delete(n)),
  )
}
