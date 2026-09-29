import { getBook } from './books'

export interface ParsedRef {
  book: string
  chapter: number
  verse?: number
}

const REF_RE = /^([1-3A-Z][A-Z0-9]{2})\.(\d+)(?:\.(\d+))?$/

export function parseRef(ref: string): ParsedRef | null {
  const m = REF_RE.exec(ref)
  if (!m) return null
  const book = getBook(m[1])
  const chapter = Number(m[2])
  if (!book || chapter < 1 || chapter > book.chapters) return null
  if (m[3] === undefined) return { book: book.id, chapter }
  const verse = Number(m[3])
  if (verse < 1) return null
  return { book: book.id, chapter, verse }
}

export function chapterRef(book: string, chapter: number): string {
  return `${book}.${chapter}`
}

/** Só aceita a forma canônica ("JHN.3"), a mesma usada nos dados de leitura. */
export function isValidChapterRef(ref: string): boolean {
  const parsed = parseRef(ref)
  return parsed !== null && parsed.verse === undefined && chapterRef(parsed.book, parsed.chapter) === ref
}

/** Só aceita a forma canônica de versículo ("JHN.3.16"). */
export function isValidVerseRef(ref: string): boolean {
  const parsed = parseRef(ref)
  return parsed?.verse !== undefined && `${parsed.book}.${parsed.chapter}.${parsed.verse}` === ref
}

export function formatRef(ref: string, bookName: (id: string) => string): string {
  const parsed = parseRef(ref)
  if (!parsed) return ref
  const base = `${bookName(parsed.book)} ${parsed.chapter}`
  return parsed.verse === undefined ? base : `${base}:${parsed.verse}`
}

/** "Lucas 10 a 12", "Gênesis 50, Êxodo 1 a 2". Só junta capítulos seguidos do mesmo livro. */
export function formatChapterList(refs: readonly string[], bookName: (id: string) => string, rangeWord: string): string {
  const groups: { book: string; first: number; last: number }[] = []
  for (const ref of refs) {
    const p = parseRef(ref)
    if (!p) continue
    const prev = groups[groups.length - 1]
    if (prev && prev.book === p.book && prev.last + 1 === p.chapter) prev.last = p.chapter
    else groups.push({ book: p.book, first: p.chapter, last: p.chapter })
  }
  return groups
    .map((g) => `${bookName(g.book)} ${g.first}${g.last > g.first ? ` ${rangeWord} ${g.last}` : ''}`)
    .join(', ')
}
