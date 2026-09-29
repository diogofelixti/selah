import type { SyncDoc } from '../../../server/src/sync-doc'
import { isValidChapterRef, isValidVerseRef } from '../bible/refs'
import { isPlanId } from '../plans/catalog'
import type { AppData, AppState, SyncMeta, VerseMark } from '../storage/types'

type Local = Pick<AppData, 'readings' | 'marks' | 'state'>

/** Documento de sincronização a partir dos dados do aparelho. */
export function buildDoc(data: Local, meta: SyncMeta): SyncDoc {
  const marks: SyncDoc['marks'] = {}
  for (const [ref, at] of Object.entries(meta.removedMarks)) marks[ref] = { color: null, note: '', updatedAt: at }
  for (const m of data.marks) {
    if (!marks[m.ref] || marks[m.ref].updatedAt <= m.updatedAt) marks[m.ref] = { color: m.color, note: m.note, updatedAt: m.updatedAt }
  }
  const readings = data.readings
    .map((r): [string, number] => [r.ref, r.readAt])
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] < b[0] ? -1 : 1))
  return {
    v: 1,
    readings,
    cleared: { ...meta.cleared },
    marks: Object.fromEntries(Object.keys(marks).sort().map((k) => [k, marks[k]])),
    activePlan: { value: data.state.activePlan, at: meta.activePlanAt },
    lastPosition: { value: data.state.lastPosition, at: meta.lastPositionAt },
  }
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
  const state: AppState = {
    lastPosition: doc.lastPosition.value,
    activePlan: planKnown ? (plan as AppState['activePlan']) : current.activePlan,
  }
  return {
    readings,
    marks,
    state,
    meta: {
      cleared: { ...doc.cleared },
      removedMarks,
      activePlanAt: planKnown ? doc.activePlan.at : currentMeta.activePlanAt,
      lastPositionAt: doc.lastPosition.at,
    },
  }
}
