import { openDB, type DBSchema } from 'idb'
import { DEFAULT_SETTINGS, DEFAULT_STATE, type AppState, type Reading, type Repository, type Settings } from './types'

interface SelahDB extends DBSchema {
  readings: { key: number; value: Reading; indexes: { ref: string } }
  settings: { key: string; value: Settings }
  state: { key: string; value: AppState }
}

const KEY = 'current'

export function createMemoryRepository(): Repository {
  let readings: Reading[] = []
  let settings: Settings = structuredClone(DEFAULT_SETTINGS)
  let state: AppState = structuredClone(DEFAULT_STATE)
  return {
    persistent: false,
    async getReadings() { return structuredClone(readings) },
    async addReading(r) { readings.push(structuredClone(r)) },
    async removeReadingsFor(ref) { readings = readings.filter((r) => r.ref !== ref) },
    async getSettings() { return structuredClone(settings) },
    async saveSettings(s) { settings = structuredClone(s) },
    async getState() { return structuredClone(state) },
    async saveState(s) { state = structuredClone(s) },
    async replaceAll(d) {
      readings = structuredClone(d.readings)
      settings = structuredClone(d.settings)
      state = structuredClone(d.state)
    },
    async clearAll() {
      readings = []
      settings = structuredClone(DEFAULT_SETTINGS)
      state = structuredClone(DEFAULT_STATE)
    },
  }
}

export async function createIdbRepository(name = 'selah'): Promise<Repository> {
  const db = await openDB<SelahDB>(name, 1, {
    upgrade(db) {
      db.createObjectStore('readings', { autoIncrement: true }).createIndex('ref', 'ref')
      db.createObjectStore('settings')
      db.createObjectStore('state')
    },
  })
  return {
    persistent: true,
    async getReadings() { return db.getAll('readings') },
    async addReading(r) { await db.add('readings', r) },
    async removeReadingsFor(ref) {
      const tx = db.transaction('readings', 'readwrite')
      const keys = await tx.store.index('ref').getAllKeys(ref)
      await Promise.all([...keys.map((k) => tx.store.delete(k)), tx.done])
    },
    async getSettings() { return { ...DEFAULT_SETTINGS, ...(await db.get('settings', KEY)) } },
    async saveSettings(s) { await db.put('settings', s, KEY) },
    async getState() { return { ...DEFAULT_STATE, ...(await db.get('state', KEY)) } },
    async saveState(s) { await db.put('state', s, KEY) },
    async replaceAll(d) {
      const tx = db.transaction(['readings', 'settings', 'state'], 'readwrite')
      const readings = tx.objectStore('readings')
      await Promise.all([
        readings.clear(),
        ...d.readings.map((r) => readings.add(r)),
        tx.objectStore('settings').put(d.settings, KEY),
        tx.objectStore('state').put(d.state, KEY),
        tx.done,
      ])
    },
    async clearAll() {
      const tx = db.transaction(['readings', 'settings', 'state'], 'readwrite')
      await Promise.all([
        tx.objectStore('readings').clear(),
        tx.objectStore('settings').clear(),
        tx.objectStore('state').clear(),
        tx.done,
      ])
    },
  }
}

/** IndexedDB quando disponível; senão memória, e o app avisa que nada será salvo. */
export async function openRepository(): Promise<Repository> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB indisponível')
    return await createIdbRepository()
  } catch {
    return createMemoryRepository()
  }
}
