export type Testament = 'OT' | 'NT'
export type SectionId =
  | 'law' | 'history' | 'poetry' | 'majorProphets' | 'minorProphets'
  | 'gospels' | 'acts' | 'pauline' | 'general' | 'revelation'

export interface BookInfo {
  id: string
  testament: Testament
  section: SectionId
  chapters: number
}

export interface ChapterPos {
  book: string
  chapter: number
}

export const SECTIONS: readonly { id: SectionId; testament: Testament }[] = [
  { id: 'law', testament: 'OT' },
  { id: 'history', testament: 'OT' },
  { id: 'poetry', testament: 'OT' },
  { id: 'majorProphets', testament: 'OT' },
  { id: 'minorProphets', testament: 'OT' },
  { id: 'gospels', testament: 'NT' },
  { id: 'acts', testament: 'NT' },
  { id: 'pauline', testament: 'NT' },
  { id: 'general', testament: 'NT' },
  { id: 'revelation', testament: 'NT' },
]

// Ordem canônica protestante. [id USFM, seção, nº de capítulos]
const DATA: [string, SectionId, number][] = [
  ['GEN', 'law', 50], ['EXO', 'law', 40], ['LEV', 'law', 27], ['NUM', 'law', 36], ['DEU', 'law', 34],
  ['JOS', 'history', 24], ['JDG', 'history', 21], ['RUT', 'history', 4], ['1SA', 'history', 31],
  ['2SA', 'history', 24], ['1KI', 'history', 22], ['2KI', 'history', 25], ['1CH', 'history', 29],
  ['2CH', 'history', 36], ['EZR', 'history', 10], ['NEH', 'history', 13], ['EST', 'history', 10],
  ['JOB', 'poetry', 42], ['PSA', 'poetry', 150], ['PRO', 'poetry', 31], ['ECC', 'poetry', 12], ['SNG', 'poetry', 8],
  ['ISA', 'majorProphets', 66], ['JER', 'majorProphets', 52], ['LAM', 'majorProphets', 5],
  ['EZK', 'majorProphets', 48], ['DAN', 'majorProphets', 12],
  ['HOS', 'minorProphets', 14], ['JOL', 'minorProphets', 3], ['AMO', 'minorProphets', 9],
  ['OBA', 'minorProphets', 1], ['JON', 'minorProphets', 4], ['MIC', 'minorProphets', 7],
  ['NAM', 'minorProphets', 3], ['HAB', 'minorProphets', 3], ['ZEP', 'minorProphets', 3],
  ['HAG', 'minorProphets', 2], ['ZEC', 'minorProphets', 14], ['MAL', 'minorProphets', 4],
  ['MAT', 'gospels', 28], ['MRK', 'gospels', 16], ['LUK', 'gospels', 24], ['JHN', 'gospels', 21],
  ['ACT', 'acts', 28],
  ['ROM', 'pauline', 16], ['1CO', 'pauline', 16], ['2CO', 'pauline', 13], ['GAL', 'pauline', 6],
  ['EPH', 'pauline', 6], ['PHP', 'pauline', 4], ['COL', 'pauline', 4], ['1TH', 'pauline', 5],
  ['2TH', 'pauline', 3], ['1TI', 'pauline', 6], ['2TI', 'pauline', 4], ['TIT', 'pauline', 3], ['PHM', 'pauline', 1],
  ['HEB', 'general', 13], ['JAS', 'general', 5], ['1PE', 'general', 5], ['2PE', 'general', 3],
  ['1JN', 'general', 5], ['2JN', 'general', 1], ['3JN', 'general', 1], ['JUD', 'general', 1],
  ['REV', 'revelation', 22],
]

const SECTION_TESTAMENT = new Map(SECTIONS.map((s) => [s.id, s.testament]))

export const BOOKS: readonly BookInfo[] = DATA.map(([id, section, chapters]) => ({
  id,
  section,
  chapters,
  testament: SECTION_TESTAMENT.get(section)!,
}))

const BY_ID = new Map(BOOKS.map((b) => [b.id, b]))

export function getBook(id: string): BookInfo | undefined {
  return BY_ID.get(id)
}

export function chapterRefs(bookId: string): string[] {
  const book = BY_ID.get(bookId)
  if (!book) return []
  return Array.from({ length: book.chapters }, (_, i) => `${bookId}.${i + 1}`)
}

export const ALL_CHAPTER_REFS: readonly string[] = BOOKS.flatMap((b) => chapterRefs(b.id))

export function nextChapter(book: string, chapter: number): ChapterPos | null {
  const index = BOOKS.findIndex((b) => b.id === book)
  if (index < 0) return null
  if (chapter < BOOKS[index].chapters) return { book, chapter: chapter + 1 }
  const next = BOOKS[index + 1]
  return next ? { book: next.id, chapter: 1 } : null
}

export function prevChapter(book: string, chapter: number): ChapterPos | null {
  const index = BOOKS.findIndex((b) => b.id === book)
  if (index < 0) return null
  if (chapter > 1) return { book, chapter: chapter - 1 }
  const prev = BOOKS[index - 1]
  return prev ? { book: prev.id, chapter: prev.chapters } : null
}
