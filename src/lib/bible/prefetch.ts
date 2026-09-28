import { BOOKS } from './books'
import { BIBLE_CACHE } from './cache-name'
import { bookUrl } from './loader'
import type { TranslationId } from './types'

/**
 * Coloca no cache todos os livros que ainda faltam. Falhas (sem rede) não interrompem:
 * o livro continua faltando, a tela de Ajustes mostra que o download não terminou,
 * e a próxima abertura do app tenta de novo.
 */
export async function prefetchTranslation(
  tr: TranslationId,
  onProgress?: (done: number, total: number) => void,
  cachesApi: CacheStorage = caches,
): Promise<void> {
  const cache = await cachesApi.open(BIBLE_CACHE)
  let done = 0
  for (const book of BOOKS) {
    const url = bookUrl(tr, book.id)
    if (await cache.match(url)) {
      done++
    } else {
      try {
        await cache.add(url)
        done++
      } catch {
        // Livro fica faltando; ver comentário acima.
      }
    }
    onProgress?.(done, BOOKS.length)
  }
}

export async function countCachedBooks(tr: TranslationId, cachesApi: CacheStorage = caches): Promise<number> {
  const cache = await cachesApi.open(BIBLE_CACHE)
  let count = 0
  for (const book of BOOKS) if (await cache.match(bookUrl(tr, book.id))) count++
  return count
}
