import { describe, expect, it, vi } from 'vitest'
import { cleanupOldBibleCaches, createOfflineSync } from './offline'
import type { TranslationId } from './types'

type Prefetch = (tr: TranslationId, onProgress: (done: number, total: number) => void) => Promise<void>

describe('createOfflineSync', () => {
  it('não repete uma tradução já completa', async () => {
    const prefetch = vi.fn<Prefetch>(async (_tr, p) => p(66, 66))
    const report = vi.fn()
    const sync = createOfflineSync(prefetch, report)
    await sync.ensure('BSB')
    await sync.ensure('BSB')
    expect(prefetch).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenLastCalledWith('BSB', 66, 66)
  })

  it('tenta de novo quando o download ficou incompleto', async () => {
    const prefetch = vi.fn<Prefetch>()
      .mockImplementationOnce(async (_tr, p) => p(40, 66))
      .mockImplementationOnce(async (_tr, p) => p(66, 66))
    const sync = createOfflineSync(prefetch, vi.fn())
    await sync.ensure('BLIVRE')
    await sync.ensure('BLIVRE')
    expect(prefetch).toHaveBeenCalledTimes(2)
    await sync.ensure('BLIVRE')
    expect(prefetch).toHaveBeenCalledTimes(2)
  })

  it('tenta de novo quando o download lança erro', async () => {
    const prefetch = vi.fn<Prefetch>()
      .mockRejectedValueOnce(new Error('cache indisponível'))
      .mockImplementationOnce(async (_tr, p) => p(66, 66))
    const sync = createOfflineSync(prefetch, vi.fn())
    await expect(sync.ensure('BSB')).resolves.toBeUndefined()
    await sync.ensure('BSB')
    expect(prefetch).toHaveBeenCalledTimes(2)
  })

  it('ignora chamada repetida enquanto a mesma tradução ainda baixa', async () => {
    let finish!: () => void
    const prefetch = vi.fn<Prefetch>(() => new Promise<void>((r) => (finish = r)))
    const sync = createOfflineSync(prefetch, vi.fn())
    const first = sync.ensure('BSB')
    void sync.ensure('BSB')
    finish()
    await first
    expect(prefetch).toHaveBeenCalledTimes(1)
  })

  it('informa a tradução completa de novo quando pedida outra vez', async () => {
    const report = vi.fn()
    const sync = createOfflineSync(async (_tr, p) => p(66, 66), report)
    await sync.ensure('BSB')
    report.mockClear()
    await sync.ensure('BSB')
    expect(report).toHaveBeenCalledWith('BSB', 66, 66)
  })
})

describe('cleanupOldBibleCaches', () => {
  it('apaga só caches antigos de Bíblias', async () => {
    const deleted: string[] = []
    const api = {
      keys: async () => ['bibles-v0', 'bibles-v1', 'workbox-precache-v2', 'bibles-old'],
      delete: async (name: string) => { deleted.push(name); return true },
    } as unknown as CacheStorage
    await cleanupOldBibleCaches(api)
    expect(deleted.sort()).toEqual(['bibles-old', 'bibles-v0'])
  })
})
