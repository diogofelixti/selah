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
