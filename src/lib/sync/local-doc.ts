import { clampTime, readingId, type SyncDoc } from '../../../server/src/sync-doc'
import { getBook } from '../bible/books'
import { isValidChapterRef, isValidVerseRef } from '../bible/refs'
import { isPlanId } from '../plans/catalog'
import type { AppData, AppState, SyncMeta, VerseMark } from '../storage/types'

type Local = Pick<AppData, 'readings' | 'marks' | 'state'>

// Mesmo ajuste de datas do servidor: o documento enviado nunca é recusado por uma data estranha.
const time = (t: number, now: number) => clampTime(t, now) ?? now

/** Documento de sincronização a partir dos dados do aparelho. */
export function buildDoc(data: Local, meta: SyncMeta, now = Date.now()): SyncDoc {
  const marks: SyncDoc['marks'] = {}
  for (const [ref, at] of Object.entries(meta.removedMarks)) marks[ref] = { color: null, note: '', updatedAt: time(at, now) }
  for (const m of data.marks) {
    const updatedAt = time(m.updatedAt, now)
    if (!marks[m.ref] || marks[m.ref].updatedAt <= updatedAt) marks[m.ref] = { color: m.color, note: m.note, updatedAt }
  }
  const readings = data.readings
    .map((r): [string, number] => [r.ref, time(r.readAt, now)])
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] < b[0] ? -1 : 1))
  const removed = meta.removedReadings.map((id) => {
    const at = id.lastIndexOf('@')
    return readingId(id.slice(0, at), time(Number(id.slice(at + 1)), now))
  })
  const plan = data.state.activePlan
  return {
    v: 1,
    readings,
    removed: [...new Set(removed)].sort(),
    marks: Object.fromEntries(Object.keys(marks).sort().map((k) => [k, marks[k]])),
    activePlan: { value: plan ? { id: plan.id, startedAt: time(plan.startedAt, now) } : null, at: meta.activePlanAt },
    lastPosition: { value: data.state.lastPosition, at: meta.lastPositionAt },
  }
}

const validPosition = (p: AppState['lastPosition']) => {
  if (!p) return true
  const book = getBook(p.book)
  return !!book && p.chapter >= 1 && p.chapter <= book.chapters
}

/**
 * Dados e metadados do aparelho a partir de um documento juntado. O que esta versão do app não conhece
 * (plano novo, referência estranha) fica de fora sem apagar o que o aparelho já tinha.
 */
export function applyDoc(doc: SyncDoc, current: AppState, currentMeta: SyncMeta): Local & { meta: SyncMeta } {
  const readings = doc.readings.filter(([ref]) => isValidChapterRef(ref)).map(([ref, readAt]) => ({ ref, readAt }))
  const marks: VerseMark[] = []
  const removedMarks: Record<string, number> = {}
  for (const [ref, m] of Object.entries(doc.marks)) {
    if (!isValidVerseRef(ref)) continue
    if (m.color === null && m.note.trim() === '') removedMarks[ref] = m.updatedAt
    else marks.push({ ref, color: m.color, note: m.note, updatedAt: m.updatedAt })
  }
  const plan = doc.activePlan.value
  const planKnown = plan === null || isPlanId(plan.id)
  const positionKnown = validPosition(doc.lastPosition.value)
  const state: AppState = {
    lastPosition: positionKnown ? doc.lastPosition.value : current.lastPosition,
    activePlan: planKnown ? (plan as AppState['activePlan']) : current.activePlan,
  }
  return {
    readings,
    marks,
    state,
    meta: {
      removedReadings: [...doc.removed],
      removedMarks,
      activePlanAt: planKnown ? doc.activePlan.at : currentMeta.activePlanAt,
      lastPositionAt: positionKnown ? doc.lastPosition.at : currentMeta.lastPositionAt,
    },
  }
}
