// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareOrDownload } from './share-image'

const blob = new Blob(['png'], { type: 'image/png' })

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
  Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true })
})

describe('shareOrDownload', () => {
  it('compartilha o arquivo quando o aparelho aceita arquivos', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    expect(await shareOrDownload(blob, 'selah-joao-3-16.png')).toBe('shared')
    const files = share.mock.calls[0][0].files as File[]
    expect(files[0].name).toBe('selah-joao-3-16.png')
    expect(files[0].type).toBe('image/png')
  })

  it('cancelar não é erro', async () => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('x', 'AbortError')), configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    expect(await shareOrDownload(blob, 'a.png')).toBe('cancelled')
  })

  it('outros erros sobem para quem chamou', async () => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('x', 'NotAllowedError')), configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    await expect(shareOrDownload(blob, 'a.png')).rejects.toThrow()
  })

  it('sem compartilhar arquivos, baixa com o nome certo', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('selah-joao-3-16.png')
      expect(this.href).toBe('blob:x')
    })
    expect(await shareOrDownload(blob, 'selah-joao-3-16.png')).toBe('downloaded')
    expect(click).toHaveBeenCalledOnce()
  })
})
