import { getBook, type Testament } from './bible/books'
import type { BookText } from './bible/types'

const BRACKETS = /\[([^\]]+)\]/g
const MARKS = /[̀-ͯ]/g

/** Minúsculas, sem acentos, sem colchetes de palavras implícitas e com espaços simples. */
export function normalize(text: string): string {
  return text.replace(BRACKETS, '$1').normalize('NFD').replace(MARKS, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export interface IndexedVerse {
  book: string
  chapter: number
  verse: number
  text: string
  norm: string
  testament: Testament
}

/** Um registro por versículo não vazio, na ordem dos livros recebidos (a canônica). */
export function buildIndex(books: readonly BookText[]): IndexedVerse[] {
  const index: IndexedVerse[] = []
  for (const book of books) {
    const testament = getBook(book.book)?.testament ?? 'OT'
    book.chapters.forEach((verses, c) => {
      verses.forEach((text, v) => {
        if (text) index.push({ book: book.book, chapter: c + 1, verse: v + 1, text, norm: normalize(text), testament })
      })
    })
  }
  return index
}

/** Termos da consulta: normalizados, sem repetidos e com pelo menos 2 letras. */
export function searchTerms(query: string): string[] {
  return [...new Set(normalize(query).split(' ').filter((t) => t.length >= 2))]
}

export function searchVerses(
  index: readonly IndexedVerse[],
  query: string,
  opts: { testament?: Testament; limit?: number } = {},
): { total: number; results: IndexedVerse[] } {
  const terms = searchTerms(query)
  if (terms.length === 0) return { total: 0, results: [] }
  const limit = opts.limit ?? 200
  const results: IndexedVerse[] = []
  let total = 0
  for (const v of index) {
    if (opts.testament && v.testament !== opts.testament) continue
    if (!terms.every((t) => v.norm.includes(t))) continue
    total++
    if (results.length < limit) results.push(v)
  }
  return { total, results }
}

/** Divide o texto (sem colchetes) em trechos, marcando onde aparecem os termos, sem considerar acentos. */
export function highlightParts(text: string, terms: readonly string[]): { text: string; hit: boolean }[] {
  const chars = [...text.replace(BRACKETS, '$1')]
  // Normaliza letra por letra para manter as posições do texto original.
  const norm = chars.map((ch) => ch.normalize('NFD').replace(MARKS, '').toLowerCase().charAt(0) || ch).join('')
  const hit = new Array<boolean>(chars.length).fill(false)
  for (const term of terms) {
    if (!term) continue
    for (let at = norm.indexOf(term); at >= 0; at = norm.indexOf(term, at + 1)) {
      for (let i = at; i < at + term.length; i++) hit[i] = true
    }
  }
  const parts: { text: string; hit: boolean }[] = []
  chars.forEach((ch, i) => {
    const last = parts[parts.length - 1]
    if (last && last.hit === hit[i]) last.text += ch
    else parts.push({ text: ch, hit: hit[i] })
  })
  return parts
}
