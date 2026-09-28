import { describe, expect, it } from 'vitest'
import { chapterRef, formatRef, isValidChapterRef, parseRef } from './refs'

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
