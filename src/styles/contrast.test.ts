import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokensOf = (theme: string) => {
  const css = readFileSync(`src/styles/themes/${theme}.css`, 'utf8')
  return (name: string) => {
    const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
    if (!m) throw new Error(`token ${name} não encontrado em ${theme}`)
    return m[1]
  }
}
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe.each(['aurora', 'noite'])('contraste do tema %s', (theme) => {
  const token = tokensOf(theme)

  it('texto passa em AA (4,5:1)', () => {
    expect(ratio(token('text'), token('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('text-2'), token('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('text-2'), token('surface'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('accent-text'), token('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('on-accent'), token('accent'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('text'), token('surface'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('accent-text'), token('surface'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('text'), token('flash'))).toBeGreaterThanOrEqual(4.5)
    // Cartões e botões escuros invertem as cores: texto --bg sobre fundo --text.
    expect(ratio(token('bg'), token('text'))).toBeGreaterThanOrEqual(4.5)
  })

  it('preenchimentos de progresso se distinguem do trilho (3:1)', () => {
    expect(ratio(token('accent'), token('track'))).toBeGreaterThanOrEqual(3)
    expect(ratio(token('nt'), token('track'))).toBeGreaterThanOrEqual(3)
  })

  it('contornos de controles não marcados passam em 3:1 (WCAG 1.4.11)', () => {
    expect(ratio(token('border-strong'), token('surface'))).toBeGreaterThanOrEqual(3)
    expect(ratio(token('border-strong'), token('bg'))).toBeGreaterThanOrEqual(3)
  })
})
