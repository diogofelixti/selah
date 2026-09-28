import { describe, expect, it } from 'vitest'
import { countCachedBooks, prefetchTranslation } from './prefetch'

function fakeCaches(failing: Set<string> = new Set()) {
  const stored = new Set<string>()
  const opened: string[] = []
  const api = {
    async open(name: string) {
      opened.push(name)
      return {
        async match(url: string) { return stored.has(url) ? new Response('{}') : undefined },
        async add(url: string) {
          if (failing.has(url)) throw new TypeError('offline')
          stored.add(url)
        },
      }
    },
  } as unknown as CacheStorage
  return { api, stored, opened }
}

describe('prefetch', () => {
  it('baixa os 66 livros no cache das Bíblias e informa o progresso', async () => {
    const { api, stored, opened } = fakeCaches()
    const progress: number[] = []
    await prefetchTranslation('BSB', (done) => progress.push(done), api)
    expect(stored.size).toBe(66)
    expect(stored.has('/bibles/BSB/GEN.json')).toBe(true)
    expect(opened.every((n) => n === 'bibles-v1')).toBe(true)
    expect(progress.at(-1)).toBe(66)
    expect(await countCachedBooks('BSB', api)).toBe(66)
    expect(await countCachedBooks('BLIVRE', api)).toBe(0)
  })

  it('não para quando um livro falha, e ele fica faltando', async () => {
    const { api } = fakeCaches(new Set(['/bibles/BSB/PSA.json']))
    await expect(prefetchTranslation('BSB', undefined, api)).resolves.toBeUndefined()
    expect(await countCachedBooks('BSB', api)).toBe(65)
  })
})
