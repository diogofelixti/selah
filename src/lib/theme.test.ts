import { describe, expect, it } from 'vitest'
import { resolveTheme } from './theme'

describe('resolveTheme', () => {
  it('automático segue o modo do aparelho', () => {
    expect(resolveTheme('auto', true)).toBe('noite')
    expect(resolveTheme('auto', false)).toBe('aurora')
  })

  it('a escolha manual vence o aparelho', () => {
    expect(resolveTheme('aurora', true)).toBe('aurora')
    expect(resolveTheme('noite', false)).toBe('noite')
    expect(resolveTheme('pergaminho', true)).toBe('pergaminho')
    expect(resolveTheme('oliveira', false)).toBe('oliveira')
  })
})

describe('script do index.html', () => {
  it('conhece todos os temas fixos', async () => {
    const { readFileSync } = await import('node:fs')
    const { THEMES } = await import('./storage/types')
    const html = readFileSync('index.html', 'utf8')
    const list = /var themes = \[([^\]]*)\]/.exec(html)![1]
    expect(list.split(',').map((s) => s.trim().replace(/'/g, ''))).toEqual(THEMES.filter((t) => t !== 'auto'))
  })
})
