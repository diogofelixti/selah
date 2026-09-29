import { BOOKS } from './bible/books'
import { bible } from './bible/loader'
import type { BookText, TranslationId } from './bible/types'
import { buildIndex, type IndexedVerse } from './search'

const cache = new Map<TranslationId, IndexedVerse[]>()
const CONCURRENCY = 6

/**
 * Índice de busca da tradução. Carrega os 66 livros (do cache offline quando possível).
 * Um índice incompleto (livros que falharam) não fica guardado: a próxima busca tenta de novo.
 */
export async function getIndex(
  tr: TranslationId,
  onProgress: (done: number, total: number) => void = () => {},
): Promise<{ index: IndexedVerse[]; missing: number }> {
  const cached = cache.get(tr)
  if (cached) return { index: cached, missing: 0 }
  const books: (BookText | null)[] = new Array(BOOKS.length).fill(null)
  let done = 0
  let next = 0
  async function worker() {
    while (next < BOOKS.length) {
      const i = next++
      try {
        books[i] = await bible.loadBook(tr, BOOKS[i].id)
      } catch {
        books[i] = null
      }
      onProgress(++done, BOOKS.length)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const loaded = books.filter((b): b is BookText => b !== null)
  const index = buildIndex(loaded)
  const missing = BOOKS.length - loaded.length
  if (missing === 0) cache.set(tr, index)
  return { index, missing }
}
