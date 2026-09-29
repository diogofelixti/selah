import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StorageBlockedError, createIdbRepository, createMemoryRepository, openRepository } from './repository'
import { DEFAULT_SETTINGS, DEFAULT_STATE, EMPTY_SYNC_META, type Repository } from './types'

const realIndexedDB = globalThis.indexedDB

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(() => {
  globalThis.indexedDB = realIndexedDB
})

const implementations: [string, () => Promise<Repository>][] = [
  ['memória', async () => createMemoryRepository()],
  ['indexeddb', () => createIdbRepository()],
]

describe.each(implementations)('repositório (%s)', (_name, create) => {
  it('guarda os metadados de sincronização à parte: substituir mantém, apagar tudo zera', async () => {
    const repo = await create()
    expect(await repo.getSyncMeta()).toEqual(EMPTY_SYNC_META)
    const meta = { removedReadings: ['JHN.1@5'], removedMarks: { 'JHN.3.16': 6 }, activePlanAt: 7, lastPositionAt: 8 }
    await repo.saveSyncMeta(meta)
    expect(await repo.getSyncMeta()).toEqual(meta)
    // O estado continua separado dos metadados.
    expect(await repo.getState()).toEqual(DEFAULT_STATE)
    await repo.replaceAll({ readings: [], settings: DEFAULT_SETTINGS, state: DEFAULT_STATE, marks: [] })
    expect(await repo.getSyncMeta()).toEqual(meta)
    await repo.clearAll()
    expect(await repo.getSyncMeta()).toEqual(EMPTY_SYNC_META)
  })

  it('aplica o resultado da sincronização sem mexer nos ajustes', async () => {
    const repo = await create()
    await repo.saveSettings({ ...DEFAULT_SETTINGS, fontSize: 4 })
    await repo.addReading({ ref: 'GEN.1', readAt: 1 })
    const state = { lastPosition: { book: 'JHN', chapter: 2 }, activePlan: null }
    const meta = { removedReadings: ['GEN.1@1'], removedMarks: {}, activePlanAt: 0, lastPositionAt: 3 }
    await repo.applySync({ readings: [{ ref: 'JHN.1', readAt: 4 }], marks: [{ ref: 'JHN.3.16', color: 'gold', note: '', updatedAt: 5 }], state }, meta)
    expect(await repo.getReadings()).toEqual([{ ref: 'JHN.1', readAt: 4 }])
    expect(await repo.getMarks()).toEqual([{ ref: 'JHN.3.16', color: 'gold', note: '', updatedAt: 5 }])
    expect(await repo.getState()).toEqual(state)
    expect(await repo.getSyncMeta()).toEqual(meta)
    expect((await repo.getSettings()).fontSize).toBe(4)
  })

  it('salva, atualiza e apaga marcações em lote', async () => {
    const repo = await create()
    await repo.saveMarks([
      { ref: 'JHN.3.16', color: 'green', note: '', updatedAt: 1 },
      { ref: 'JHN.3.17', color: null, note: 'lembrar', updatedAt: 1 },
    ])
    expect((await repo.getMarks()).map((m) => m.ref).sort()).toEqual(['JHN.3.16', 'JHN.3.17'])
    // Sem cor e sem nota, a marcação some.
    await repo.saveMarks([
      { ref: 'JHN.3.16', color: 'blue', note: 'nova', updatedAt: 2 },
      { ref: 'JHN.3.17', color: null, note: '', updatedAt: 2 },
    ])
    expect(await repo.getMarks()).toEqual([{ ref: 'JHN.3.16', color: 'blue', note: 'nova', updatedAt: 2 }])
  })

  it('grava e apaga leituras em lote', async () => {
    const repo = await create()
    await repo.addReadings([{ ref: 'RUT.1', readAt: 1 }, { ref: 'RUT.2', readAt: 1 }, { ref: 'RUT.3', readAt: 1 }])
    await repo.removeReadingsForMany(['RUT.1', 'RUT.3'])
    expect(await repo.getReadings()).toEqual([{ ref: 'RUT.2', readAt: 1 }])
  })

  it('lote com uma leitura inválida não grava nenhuma', async () => {
    const repo = await create()
    const bad = { ref: 'RUT.2', readAt: 1, extra: () => 0 } as unknown as { ref: string; readAt: number }
    await expect(repo.addReadings([{ ref: 'RUT.1', readAt: 1 }, bad])).rejects.toThrow()
    expect(await repo.getReadings()).toEqual([])
  })

  it('começa vazio e com padrões', async () => {
    const repo = await create()
    expect(await repo.getReadings()).toEqual([])
    expect(await repo.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(await repo.getState()).toEqual(DEFAULT_STATE)
  })

  it('adiciona leituras e remove todas as de um capítulo', async () => {
    const repo = await create()
    await repo.addReading({ ref: 'JHN.1', readAt: 1 })
    await repo.addReading({ ref: 'JHN.1', readAt: 2 })
    await repo.addReading({ ref: 'JHN.2', readAt: 3 })
    await repo.removeReadingsFor('JHN.1')
    expect(await repo.getReadings()).toEqual([{ ref: 'JHN.2', readAt: 3 }])
  })

  it('salva ajustes e estado', async () => {
    const repo = await create()
    await repo.saveSettings({ language: 'en', theme: 'aurora', fontSize: 3, reminder: { enabled: true, time: '06:00' } })
    await repo.saveState({ lastPosition: { book: 'JHN', chapter: 3 }, activePlan: { id: 'nt-90', startedAt: 5 } })
    expect(await repo.getSettings()).toEqual({ language: 'en', theme: 'aurora', fontSize: 3, reminder: { enabled: true, time: '06:00' } })
    expect(await repo.getState()).toEqual({ lastPosition: { book: 'JHN', chapter: 3 }, activePlan: { id: 'nt-90', startedAt: 5 } })
  })

  it('substitui tudo e apaga tudo', async () => {
    const repo = await create()
    await repo.addReading({ ref: 'GEN.1', readAt: 1 })
    const data = {
      readings: [{ ref: 'REV.22', readAt: 9 }],
      settings: { language: 'pt' as const, theme: 'aurora' as const, fontSize: 2 as const, reminder: { enabled: false, time: '07:00' } },
      state: { lastPosition: null, activePlan: null },
      marks: [{ ref: 'REV.22.21', color: 'gold' as const, note: 'amém', updatedAt: 5 }],
    }
    await repo.replaceAll(data)
    expect(await repo.getReadings()).toEqual(data.readings)
    expect(await repo.getSettings()).toEqual(data.settings)
    expect(await repo.getMarks()).toEqual(data.marks)
    await repo.clearAll()
    expect(await repo.getReadings()).toEqual([])
    expect(await repo.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(await repo.getMarks()).toEqual([])
  })
})

describe('indexeddb', () => {
  it('mantém os dados ao reabrir', async () => {
    const first = await createIdbRepository('persistencia')
    await first.addReading({ ref: 'PSA.23', readAt: 1 })
    const second = await createIdbRepository('persistencia')
    expect(await second.getReadings()).toEqual([{ ref: 'PSA.23', readAt: 1 }])
    expect(second.persistent).toBe(true)
  })
})

describe('openRepository', () => {
  it('cai para memória quando não há IndexedDB', async () => {
    // @ts-expect-error simulando navegador sem IndexedDB
    globalThis.indexedDB = undefined
    const repo = await openRepository()
    expect(repo.persistent).toBe(false)
  })

  it('cai para memória quando abrir o banco falha (navegação privada)', async () => {
    globalThis.indexedDB = { open() { throw new DOMException('blocked', 'InvalidStateError') } } as unknown as IDBFactory
    const repo = await openRepository()
    expect(repo.persistent).toBe(false)
    await repo.addReading({ ref: 'JHN.1', readAt: 1 })
    expect(await repo.getReadings()).toHaveLength(1)
  })
})

describe('migração do banco', () => {
  it('abre um banco da versão 1 sem perder leituras, ajustes e estado', async () => {
    const { openDB } = await import('idb')
    const old = await openDB('antigo', 1, {
      upgrade(db) {
        db.createObjectStore('readings', { autoIncrement: true }).createIndex('ref', 'ref')
        db.createObjectStore('settings')
        db.createObjectStore('state')
      },
    })
    await old.add('readings', { ref: 'PSA.23', readAt: 1 })
    await old.put('settings', { language: 'en', theme: 'aurora', fontSize: 3 }, 'current')
    old.close()
    const repo = await createIdbRepository('antigo')
    expect(await repo.getReadings()).toEqual([{ ref: 'PSA.23', readAt: 1 }])
    expect((await repo.getSettings()).language).toBe('en')
    // Ajustes gravados antes do lembrete recebem o padrão.
    expect((await repo.getSettings()).reminder).toEqual({ enabled: false, time: '07:00' })
    expect(await repo.getMarks()).toEqual([])
  })
})

describe('outra janela com versão antiga aberta', () => {
  async function holdOldVersion(name: string) {
    const { openDB } = await import('idb')
    return openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('readings', { autoIncrement: true }).createIndex('ref', 'ref')
        db.createObjectStore('settings')
        db.createObjectStore('state')
      },
    })
  }

  it('abrir falha logo com StorageBlockedError em vez de travar', async () => {
    const old = await holdOldVersion('bloqueado')
    await expect(createIdbRepository('bloqueado')).rejects.toBeInstanceOf(StorageBlockedError)
    old.close()
  })

  it('openRepository cai para memória e informa o bloqueio', async () => {
    const old = await holdOldVersion('selah')
    const repo = await openRepository()
    expect(repo.persistent).toBe(false)
    expect(repo.blocked).toBe(true)
    old.close()
  })

  it('a versão atual libera o banco quando uma versão mais nova pede', async () => {
    const onVersionChange = vi.fn()
    await createIdbRepository('futuro', { onVersionChange })
    const { openDB } = await import('idb')
    const newer = await openDB('futuro', 3)
    expect(onVersionChange).toHaveBeenCalledOnce()
    newer.close()
  })
})
