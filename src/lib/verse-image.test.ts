import { describe, expect, it } from 'vitest'
import { imageFilename, layoutVerseImage, type Measure } from './verse-image'

// Medida falsa: cada caractere ocupa metade do tamanho da fonte.
const measure: Measure = (text, size) => text.length * size * 0.5

describe('layoutVerseImage', () => {
  it('texto curto usa o tamanho máximo numa linha', () => {
    expect(layoutVerseImage('Deus é amor', measure, { width: 900, maxHeight: 800 })).toEqual({ fontSize: 64, lines: ['Deus é amor'] })
  })

  it('quebra por palavras sem passar da largura', () => {
    const r = layoutVerseImage('um dois três quatro cinco seis sete oito nove dez', measure, { width: 300, maxHeight: 2000, maxSize: 40, minSize: 20 })!
    expect(r.fontSize).toBe(40)
    for (const line of r.lines) expect(measure(line, r.fontSize)).toBeLessThanOrEqual(300)
    expect(r.lines.join(' ')).toBe('um dois três quatro cinco seis sete oito nove dez')
  })

  it('diminui a fonte até caber na altura', () => {
    const text = 'palavra '.repeat(60).trim()
    const r = layoutVerseImage(text, measure, { width: 900, maxHeight: 700 })!
    expect(r.fontSize).toBeLessThan(64)
    expect(r.fontSize).toBeGreaterThanOrEqual(36)
    expect(r.lines.length * r.fontSize * 1.4).toBeLessThanOrEqual(700)
  })

  it('devolve null quando nem o tamanho mínimo cabe', () => {
    expect(layoutVerseImage('palavra '.repeat(1000), measure, { width: 900, maxHeight: 700 })).toBeNull()
  })

  it('palavra mais larga que a linha fica sozinha sem travar', () => {
    const r = layoutVerseImage('a supercalifragilisticexpialidocious b', measure, { width: 200, maxHeight: 2000, maxSize: 20, minSize: 20 })!
    expect(r.lines).toEqual(['a', 'supercalifragilisticexpialidocious', 'b'])
  })
})

describe('imageFilename', () => {
  const name = (id: string) => ({ JHN: 'João', '1CO': '1 Coríntios' })[id] ?? id
  it('sem acentos, minúsculas e com intervalo', () => {
    expect(imageFilename('JHN', 3, [16], name)).toBe('selah-joao-3-16.png')
    expect(imageFilename('JHN', 3, [18, 16, 17], name)).toBe('selah-joao-3-16-18.png')
    expect(imageFilename('1CO', 13, [4, 7], name)).toBe('selah-1-corintios-13-4-7.png')
  })
})
