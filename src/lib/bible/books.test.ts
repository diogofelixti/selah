import { describe, expect, it } from 'vitest'
import { ALL_CHAPTER_REFS, BOOKS, SECTIONS, chapterRefs, getBook, nextChapter, prevChapter } from './books'

describe('books', () => {
  it('tem 66 livros, 39 no AT com 929 capítulos e 27 no NT com 260', () => {
    const ot = BOOKS.filter((b) => b.testament === 'OT')
    const nt = BOOKS.filter((b) => b.testament === 'NT')
    expect(BOOKS).toHaveLength(66)
    expect(ot).toHaveLength(39)
    expect(nt).toHaveLength(27)
    expect(ot.reduce((s, b) => s + b.chapters, 0)).toBe(929)
    expect(nt.reduce((s, b) => s + b.chapters, 0)).toBe(260)
    expect(ALL_CHAPTER_REFS).toHaveLength(1189)
  })

  it('tem ids únicos e toda seção pertence a um testamento coerente', () => {
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(66)
    for (const b of BOOKS) {
      const section = SECTIONS.find((s) => s.id === b.section)
      expect(section?.testament).toBe(b.testament)
    }
  })

  it('gera referências de capítulo', () => {
    expect(chapterRefs('RUT')).toEqual(['RUT.1', 'RUT.2', 'RUT.3', 'RUT.4'])
    expect(getBook('JHN')?.chapters).toBe(21)
    expect(getBook('XYZ')).toBeUndefined()
  })

  it('navega entre capítulos atravessando livros', () => {
    expect(nextChapter('GEN', 1)).toEqual({ book: 'GEN', chapter: 2 })
    expect(nextChapter('GEN', 50)).toEqual({ book: 'EXO', chapter: 1 })
    expect(nextChapter('REV', 22)).toBeNull()
    expect(prevChapter('EXO', 1)).toEqual({ book: 'GEN', chapter: 50 })
    expect(prevChapter('GEN', 1)).toBeNull()
  })
})
