import { describe, expect, it } from 'vitest'
import { chapterRef, formatChapterList, formatRef, isValidChapterRef, parseRef } from './refs'

describe('refs', () => {
  it('interpreta referências válidas', () => {
    expect(parseRef('JHN.3.16')).toEqual({ book: 'JHN', chapter: 3, verse: 16 })
    expect(parseRef('PSA.23')).toEqual({ book: 'PSA', chapter: 23 })
  })

  it('rejeita referências inválidas', () => {
    for (const bad of ['JHN.22', 'XYZ.1', 'JHN.0', 'JHN.3.0', 'JHN.3.x', 'JHN', '', 'JHN.3.16.1', 'jhn.3']) {
      expect(parseRef(bad), bad).toBeNull()
    }
  })

  it('distingue referência de capítulo', () => {
    expect(isValidChapterRef('JHN.3')).toBe(true)
    expect(isValidChapterRef('JHN.3.16')).toBe(false)
    expect(isValidChapterRef('JHN.99')).toBe(false)
    expect(isValidChapterRef('JHN.03')).toBe(false)
    expect(chapterRef('JHN', 3)).toBe('JHN.3')
  })

  it('formata para leitura', () => {
    const name = (id: string) => ({ JHN: 'João', PSA: 'Salmos' })[id] ?? id
    expect(formatRef('JHN.3.16', name)).toBe('João 3:16')
    expect(formatRef('PSA.23', name)).toBe('Salmos 23')
  })
})

describe('formatChapterList', () => {
  const name = (id: string) => ({ GEN: 'Gênesis', EXO: 'Êxodo', LUK: 'Lucas', PSA: 'Salmos' })[id] ?? id

  it('junta capítulos seguidos do mesmo livro', () => {
    expect(formatChapterList(['LUK.10', 'LUK.11', 'LUK.12'], name, 'a')).toBe('Lucas 10 a 12')
    expect(formatChapterList(['LUK.10'], name, 'a')).toBe('Lucas 10')
  })

  it('separa livros diferentes e saltos de capítulo', () => {
    expect(formatChapterList(['GEN.50', 'EXO.1', 'EXO.2'], name, 'a')).toBe('Gênesis 50, Êxodo 1 a 2')
    expect(formatChapterList(['PSA.1', 'PSA.2', 'PSA.5'], name, 'to')).toBe('Salmos 1 to 2, Salmos 5')
  })
})
