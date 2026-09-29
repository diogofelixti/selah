import { describe, expect, it } from 'vitest'
import { mergeSync } from '../../../server/src/sync-doc'
import { EMPTY_SYNC_META, type SyncMeta } from '../storage/types'
import { applyDoc, buildDoc } from './local-doc'

const T = Date.UTC(2026, 8, 29)
const data = {
  readings: [{ ref: 'JHN.2', readAt: T + 1 }, { ref: 'JHN.1', readAt: T }],
  marks: [{ ref: 'JHN.3.16', color: 'gold' as const, note: 'amor', updatedAt: T }],
  state: { lastPosition: { book: 'JHN', chapter: 2 }, activePlan: { id: 'gospels-30' as const, startedAt: T - 10 } },
}
const meta: SyncMeta = { removedReadings: ['GEN.1@' + (T - 5)], removedMarks: { 'PSA.23.1': T - 3 }, activePlanAt: T - 10, lastPositionAt: T + 1 }

describe('buildDoc', () => {
  it('monta o documento com leituras, remoções, marcas (e as removidas), plano e posição', () => {
    expect(buildDoc(data, meta, T + 100)).toEqual({
      v: 1,
      readings: [['JHN.1', T], ['JHN.2', T + 1]],
      removed: ['GEN.1@' + (T - 5)],
      marks: { 'JHN.3.16': { color: 'gold', note: 'amor', updatedAt: T }, 'PSA.23.1': { color: null, note: '', updatedAt: T - 3 } },
      activePlan: { value: { id: 'gospels-30', startedAt: T - 10 }, at: T - 10 },
      lastPosition: { value: { book: 'JHN', chapter: 2 }, at: T + 1 },
    })
  })

  it('datas estranhas são ajustadas como no servidor (nada é recusado)', () => {
    const odd = { ...data, readings: [{ ref: 'JHN.1', readAt: 5 }, { ref: 'JHN.2', readAt: T + 0.4 }] }
    expect(buildDoc(odd, meta, T + 100).readings).toEqual([['JHN.1', Date.UTC(2020, 0, 1)], ['JHN.2', T]])
  })
})

describe('applyDoc', () => {
  it('ida e volta devolve os mesmos dados e metadados', () => {
    const back = applyDoc(buildDoc(data, meta, T + 100), data.state, meta)
    expect(back.readings).toEqual([{ ref: 'JHN.1', readAt: T }, { ref: 'JHN.2', readAt: T + 1 }])
    expect(back.marks).toEqual(data.marks)
    expect(back.state).toEqual(data.state)
    expect(back.meta).toEqual(meta)
  })

  it('aplica o que veio de outro aparelho', () => {
    const remote = buildDoc(
      { readings: [{ ref: 'GEN.2', readAt: T + 9 }], marks: [], state: { lastPosition: { book: 'GEN', chapter: 2 }, activePlan: null } },
      { ...EMPTY_SYNC_META, removedReadings: ['JHN.2@' + (T + 1)], removedMarks: { 'JHN.3.16': T + 5 }, activePlanAt: T + 5, lastPositionAt: T + 9 },
      T + 100,
    )
    const merged = applyDoc(mergeSync(buildDoc(data, meta, T + 100), remote), data.state, meta)
    expect(merged.readings.map((r) => r.ref)).toEqual(['GEN.2', 'JHN.1'])
    expect(merged.marks).toEqual([])
    expect(merged.state).toEqual({ lastPosition: { book: 'GEN', chapter: 2 }, activePlan: null })
    expect(merged.meta.removedMarks).toEqual({ 'JHN.3.16': T + 5, 'PSA.23.1': T - 3 })
  })

  it('plano desconhecido por esta versão do app fica como estava no aparelho', () => {
    const remote = { ...buildDoc(data, meta, T + 100), activePlan: { value: { id: 'plano-futuro', startedAt: T }, at: T + 100 } }
    const out = applyDoc(remote, data.state, meta)
    expect(out.state.activePlan).toEqual(data.state.activePlan)
    expect(out.meta.activePlanAt).toBe(meta.activePlanAt)
  })

  it('posição num capítulo que o livro não tem é ignorada', () => {
    const remote = { ...buildDoc(data, meta, T + 100), lastPosition: { value: { book: 'JUD', chapter: 40 }, at: T + 100 } }
    expect(applyDoc(remote, data.state, meta).state.lastPosition).toEqual(data.state.lastPosition)
  })
})
