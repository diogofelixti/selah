import type { Lang } from '../i18n/lang'
import type { BookText, TranslationId } from './types'

export const TRANSLATION_BY_LANG: Record<Lang, TranslationId> = { pt: 'BLIVRE', en: 'BSB' }

export function bookUrl(tr: TranslationId, book: string): string {
  return `/bibles/${tr}/${book}.json`
}

export class BibleLoadError extends Error {
  readonly translation: TranslationId
  readonly book: string
  constructor(translation: TranslationId, book: string, cause: unknown) {
    super(`Falha ao carregar ${translation}/${book}`, { cause })
    this.translation = translation
    this.book = book
  }
}

type FetchFn = (url: string) => Promise<Response>

export function createBibleLoader(fetchFn: FetchFn = (url) => fetch(url)) {
  const cache = new Map<string, Promise<BookText>>()

  function loadBook(tr: TranslationId, book: string): Promise<BookText> {
    const url = bookUrl(tr, book)
    let pending = cache.get(url)
    if (!pending) {
      pending = fetchFn(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return (await res.json()) as BookText
        })
        .catch((err: unknown) => {
          // Não guarda a falha: a próxima tentativa busca de novo.
          cache.delete(url)
          throw new BibleLoadError(tr, book, err)
        })
      cache.set(url, pending)
    }
    return pending
  }

  async function getVerse(tr: TranslationId, book: string, chapter: number, verse: number): Promise<string> {
    const text = await loadBook(tr, book)
    return text.chapters[chapter - 1]?.[verse - 1] ?? ''
  }

  return { loadBook, getVerse }
}

export const bible = createBibleLoader()
