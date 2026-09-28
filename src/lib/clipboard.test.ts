// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
})

describe('copyText', () => {
  it('usa a API moderna quando existe', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    expect(await copyText('oi')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('oi')
  })

  it('usa o fallback quando não há API (página sem HTTPS)', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    expect(await copyText('oi')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('usa o fallback quando a API recusa, e informa falha se ele também falhar', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('negado')) }, configurable: true })
    document.execCommand = vi.fn().mockReturnValue(false)
    expect(await copyText('oi')).toBe(false)
  })
})

describe('fallback de cópia', () => {
  it('seleciona o texto inteiro (iOS) e devolve o foco para onde estava', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    document.execCommand = vi.fn().mockReturnValue(true)
    const range = vi.spyOn(HTMLTextAreaElement.prototype, 'setSelectionRange')
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    expect(await copyText('olá mundo')).toBe(true)
    expect(range).toHaveBeenCalledWith(0, 'olá mundo'.length)
    expect(document.activeElement).toBe(input)
    input.remove()
  })
})
