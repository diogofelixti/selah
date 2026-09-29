import { openDB, type DBSchema } from 'idb'
import {
  DEFAULT_SETTINGS, DEFAULT_STATE, isEmptyMark, type AppState, type Reading, type Repository, type Settings, type VerseMark,
} from './types'

interface SelahDB extends DBSchema {
  readings: { key: number; value: Reading; indexes: { ref: string } }
  settings: { key: string; value: Settings }
  state: { key: string; value: AppState }
  marks: { key: string; value: VerseMark }
}

const KEY = 'current'

export function createMemoryRepository(): Repository {
  let readings: Reading[] = []
  let settings: Settings = structuredClone(DEFAULT_SETTINGS)
  let state: AppState = structuredClone(DEFAULT_STATE)
  let marks = new Map<string, VerseMark>()
  return {
    persistent: false,
    async getReadings() { return structuredClone(readings) },
    async addReading(r) { readings.push(structuredClone(r)) },
    async removeReadingsFor(ref) { readings = readings.filter((r) => r.ref !== ref) },
    async addReadings(rs) {
      // Clona tudo antes de gravar: se algum item não puder ser clonado, nada entra.
      const copies = rs.map((r) => structuredClone(r))
      readings.push(...copies)
    },
    async removeReadingsForMany(refs) {
      const remove = new Set(refs)
      readings = readings.filter((r) => !remove.has(r.ref))
    },
    async getSettings() { return structuredClone(settings) },
    async saveSettings(s) { settings = structuredClone(s) },
    async getState() { return structuredClone(state) },
    async saveState(s) { state = structuredClone(s) },
    async getMarks() { return structuredClone([...marks.values()]) },
    async saveMarks(ms) {
      const copies = ms.map((m) => structuredClone(m))
      for (const m of copies) {
        if (isEmptyMark(m)) marks.delete(m.ref)
        else marks.set(m.ref, m)
      }
    },
    async replaceAll(d) {
      readings = structuredClone(d.readings)
      settings = structuredClone(d.settings)
      state = structuredClone(d.state)
      marks = new Map(structuredClone(d.marks).map((m) => [m.ref, m]))
    },
    async clearAll() {
      readings = []
      settings = structuredClone(DEFAULT_SETTINGS)
      state = structuredClone(DEFAULT_STATE)
      marks = new Map()
    },
  }
}

export async function createIdbRepository(name = 'selah'): Promise<Repository> {
  const db = await openDB<SelahDB>(name, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('readings', { autoIncrement: true }).createIndex('ref', 'ref')
        db.createObjectStore('settings')
        db.createObjectStore('state')
      }
      // Versão 2: marcações (destaques e notas). Os stores da versão 1 ficam como estão.
      if (oldVersion < 2) db.createObjectStore('marks', { keyPath: 'ref' })
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
    async addReadings(rs) {
      // Uma transação só: se qualquer add falhar, o IndexedDB desfaz o lote inteiro.
      const tx = db.transaction('readings', 'readwrite')
      const pending: Promise<unknown>[] = [tx.done]
      try {
        for (const r of rs) pending.push(tx.store.add(r))
        await Promise.all(pending)
      } catch (err) {
        // A transação desfeita rejeita as outras promessas; o erro que importa é o original.
        for (const p of pending) p.catch(() => {})
        try { tx.abort() } catch { /* já abortada */ }
        throw err
      }
    },
    async removeReadingsForMany(refs) {
      const tx = db.transaction('readings', 'readwrite')
      const pending: Promise<unknown>[] = [tx.done]
      try {
        const index = tx.store.index('ref')
        const lookups = refs.map((ref) => index.getAllKeys(ref))
        pending.push(...lookups)
        const keys = (await Promise.all(lookups)).flat()
        for (const k of keys) pending.push(tx.store.delete(k))
        await Promise.all(pending)
      } catch (err) {
        // Mesmo tratamento do addReadings: nada fica sem tratamento se o lote for desfeito.
        for (const p of pending) p.catch(() => {})
        try { tx.abort() } catch { /* já abortada */ }
        throw err
      }
    },
    async getSettings() { return { ...DEFAULT_SETTINGS, ...(await db.get('settings', KEY)) } },
    async saveSettings(s) { await db.put('settings', s, KEY) },
    async getState() { return { ...DEFAULT_STATE, ...(await db.get('state', KEY)) } },
    async saveState(s) { await db.put('state', s, KEY) },
    async getMarks() { return db.getAll('marks') },
    async saveMarks(ms) {
      const tx = db.transaction('marks', 'readwrite')
      const pending: Promise<unknown>[] = [tx.done]
      try {
        for (const m of ms) pending.push(isEmptyMark(m) ? tx.store.delete(m.ref) : tx.store.put(m))
        await Promise.all(pending)
      } catch (err) {
        for (const p of pending) p.catch(() => {})
        try { tx.abort() } catch { /* já abortada */ }
        throw err
      }
    },
    async replaceAll(d) {
      const tx = db.transaction(['readings', 'settings', 'state', 'marks'], 'readwrite')
      const readings = tx.objectStore('readings')
      const marks = tx.objectStore('marks')
      await Promise.all([
        readings.clear(),
        ...d.readings.map((r) => readings.add(r)),
        tx.objectStore('settings').put(d.settings, KEY),
        tx.objectStore('state').put(d.state, KEY),
        marks.clear(),
        ...d.marks.map((m) => marks.put(m)),
        tx.done,
      ])
    },
    async clearAll() {
      const tx = db.transaction(['readings', 'settings', 'state', 'marks'], 'readwrite')
      await Promise.all([
        tx.objectStore('readings').clear(),
        tx.objectStore('settings').clear(),
        tx.objectStore('state').clear(),
        tx.objectStore('marks').clear(),
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
