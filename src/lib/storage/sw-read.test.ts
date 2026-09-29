import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { createIdbRepository } from './repository'
import { readForReminder } from './sw-read'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

describe('readForReminder', () => {
  it('lê leituras, estado e idioma gravados pelo app', async () => {
    const repo = await createIdbRepository()
    await repo.addReading({ ref: 'JHN.1', readAt: 5 })
    await repo.saveState({ lastPosition: { book: 'JHN', chapter: 1 }, activePlan: null })
    await repo.saveSettings({ language: 'en', theme: 'auto', fontSize: 2, reminder: { enabled: true, time: '07:00' } })
    expect(await readForReminder()).toEqual({
      readings: [{ ref: 'JHN.1', readAt: 5 }],
      state: { lastPosition: { book: 'JHN', chapter: 1 }, activePlan: null },
      language: 'en',
    })
  })

  it('sem banco, devolve null e não cria o banco (o app cria na versão certa depois)', async () => {
    expect(await readForReminder()).toBeNull()
    const names = (await indexedDB.databases()).map((d) => d.name)
    expect(names).not.toContain('selah')
    // O app ainda consegue criar o banco completo.
    const repo = await createIdbRepository()
    await repo.addReading({ ref: 'GEN.1', readAt: 1 })
    expect(await repo.getReadings()).toHaveLength(1)
  })

  it('não segura o banco: o app abre em seguida sem bloquear', async () => {
    await (await createIdbRepository()).addReading({ ref: 'GEN.1', readAt: 1 })
    await readForReminder()
    const repo = await createIdbRepository()
    expect(await repo.getReadings()).toHaveLength(1)
  })
})
