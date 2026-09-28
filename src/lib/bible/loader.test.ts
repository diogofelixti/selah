import { describe, expect, it, vi } from 'vitest'
import { BibleLoadError, TRANSLATION_BY_LANG, bookUrl, createBibleLoader } from './loader'

const JHN = { book: 'JHN', chapters: [['v1'], ['v1', 'v2', 'v3']] }
const ok = () => Promise.resolve(new Response(JSON.stringify(JHN), { status: 200 }))

describe('loader', () => {
  it('liga idioma a tradução e monta a URL', () => {
    expect(TRANSLATION_BY_LANG).toEqual({ pt: 'BLIVRE', en: 'BSB' })
    expect(bookUrl('BSB', 'JHN')).toBe('/bibles/BSB/JHN.json')
  })

  it('carrega uma vez e reaproveita', async () => {
    const fetchFn = vi.fn(ok)
    const loader = createBibleLoader(fetchFn)
    await loader.loadBook('BLIVRE', 'JHN')
    await loader.loadBook('BLIVRE', 'JHN')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(await loader.getVerse('BLIVRE', 'JHN', 2, 3)).toBe('v3')
    expect(await loader.getVerse('BLIVRE', 'JHN', 2, 9)).toBe('')
  })

  it('falha com BibleLoadError e tenta de novo na próxima chamada', async () => {
    const fetchFn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('não achei', { status: 404 }))
      .mockImplementation(ok)
    const loader = createBibleLoader(fetchFn)
    await expect(loader.loadBook('BSB', 'JHN')).rejects.toBeInstanceOf(BibleLoadError)
    await expect(loader.loadBook('BSB', 'JHN')).rejects.toMatchObject({ translation: 'BSB', book: 'JHN' })
    await expect(loader.loadBook('BSB', 'JHN')).resolves.toEqual(JHN)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
})
