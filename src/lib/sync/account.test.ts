import { beforeEach, describe, expect, it } from 'vitest'
import { emptyDoc, mergeSync, type SyncDoc } from '../../../server/src/sync-doc'
import { app, clearData, initApp, markRead } from '../app.svelte'
import { createMemoryRepository } from '../storage/repository'
import type { Repository } from '../storage/types'
import { account, setFetch, signInWithCredential, signOut, syncNow } from './account.svelte'

const T = Date.now() - 60_000

/** Servidor falso: guarda um documento e junta com o que chega, como o de verdade. */
function fakeServer(opts: { remote?: SyncDoc; delay?: Promise<void>; status?: number } = {}) {
  let stored = opts.remote ?? emptyDoc()
  const calls: string[] = []
  setFetch(async (input, init) => {
    const path = String(input).replace(/^\/api/, '')
    calls.push(`${init?.method ?? 'GET'} ${path}`)
    if (path === '/auth/google') return Response.json({ token: 't'.repeat(43), email: 'ana@gmail.com' })
    if (path === '/sync') {
      if (opts.status) return new Response('{}', { status: opts.status })
      const incoming = JSON.parse(String(init?.body)) as SyncDoc
      await opts.delay
      stored = mergeSync(stored, incoming)
      return Response.json(stored)
    }
    return new Response(null, { status: 204 })
  })
  return {
    calls,
    get stored() {
      return stored
    },
  }
}

beforeEach(async () => {
  await initApp(async () => createMemoryRepository())
  account.token = null
  account.email = null
  account.status = 'idle'
})

describe('entrar e sincronizar', () => {
  it('entrar guarda a sessão e já traz o que está na conta', async () => {
    const server = fakeServer({ remote: { ...emptyDoc(), readings: [['GEN.1', T]] } })
    await markRead('JHN.1')
    await signInWithCredential('credencial')
    expect(account.email).toBe('ana@gmail.com')
    expect(app.readings.map((r) => r.ref).sort()).toEqual(['GEN.1', 'JHN.1'])
    expect(server.stored.readings.map(([ref]) => ref)).toEqual(['GEN.1', 'JHN.1'])
    expect(account.status).toBe('idle')
    expect(account.lastSyncAt).not.toBeNull()
  })

  it('o que muda no aparelho durante a sincronização não se perde e vai na próxima', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    fakeServer()
    await signInWithCredential('credencial')
    const server = fakeServer({ delay: gate })
    const running = syncNow()
    await markRead('PSA.23')
    release()
    await running
    expect(app.readings.map((r) => r.ref)).toContain('PSA.23')
    await syncNow()
    expect(server.stored.readings.map(([ref]) => ref)).toContain('PSA.23')
  })

  it('sessão recusada (401) sai da conta e avisa, sem mexer nos dados', async () => {
    fakeServer()
    await signInWithCredential('credencial')
    await markRead('JHN.3')
    fakeServer({ status: 401 })
    await syncNow()
    expect(account.token).toBeNull()
    expect(account.status).toBe('expired')
    expect(app.readings.map((r) => r.ref)).toEqual(['JHN.3'])
  })

  it('sem rede: marca erro e mantém os dados', async () => {
    fakeServer()
    await signInWithCredential('credencial')
    await markRead('JHN.4')
    setFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    await syncNow()
    expect(account.status).toBe('error')
    expect(account.token).not.toBeNull()
    expect(app.readings.map((r) => r.ref)).toEqual(['JHN.4'])
  })
})

describe('corridas com a sincronização', () => {
  it('gravação ainda em andamento quando o resultado chega não se perde', async () => {
    const repo = createMemoryRepository()
    let releaseWrite!: () => void
    const slow: Repository = {
      ...repo,
      async addReading(r) {
        await new Promise<void>((res) => (releaseWrite = res))
        await repo.addReading(r)
      },
    }
    await initApp(async () => slow)
    fakeServer({ remote: { ...emptyDoc(), readings: [['GEN.1', T]] } })
    await signInWithCredential('credencial')
    const writing = markRead('JHN.9')
    await new Promise((r) => setTimeout(r, 0))
    const syncing = syncNow()
    await new Promise((r) => setTimeout(r, 10))
    releaseWrite()
    await writing
    await syncing
    expect(app.readings.map((r) => r.ref).sort()).toEqual(['GEN.1', 'JHN.9'])
    expect((await repo.getReadings()).map((r) => r.ref).sort()).toEqual(['GEN.1', 'JHN.9'])
  })

  it('sair e apagar os dados durante uma sincronização não traz nada de volta', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    fakeServer({ remote: { ...emptyDoc(), readings: [['GEN.1', T]] } })
    await signInWithCredential('credencial')
    fakeServer({ remote: { ...emptyDoc(), readings: [['GEN.1', T]] }, delay: gate })
    const running = syncNow()
    await signOut()
    await clearData()
    release()
    await running
    expect(app.readings).toEqual([])
  })
})
