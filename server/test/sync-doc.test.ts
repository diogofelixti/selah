import { describe, expect, it } from 'vitest'
import { emptyDoc, InvalidDoc, mergeSync, parseSyncDoc, type SyncDoc } from '../src/sync-doc.js'

const T = Date.UTC(2026, 8, 29, 12)
const doc = (over: Partial<SyncDoc>): SyncDoc => ({ ...emptyDoc(), ...over })

const a = doc({
  readings: [['JHN.1', T], ['JHN.2', T + 10]],
  cleared: { 'GEN.1': T - 100 },
  marks: { 'JHN.3.16': { color: 'gold', note: '', updatedAt: T } },
  activePlan: { value: { id: 'gospels-30', startedAt: T - 1000 }, at: T - 1000 },
  lastPosition: { value: { book: 'JHN', chapter: 2 }, at: T + 10 },
})
const b = doc({
  readings: [['JHN.1', T], ['GEN.1', T - 200], ['GEN.1', T + 50]],
  cleared: { 'JHN.2': T + 20 },
  marks: { 'JHN.3.16': { color: null, note: '', updatedAt: T + 5 }, 'PSA.23.1': { color: 'blue', note: 'paz', updatedAt: T } },
  activePlan: { value: null, at: T + 30 },
  lastPosition: { value: { book: 'GEN', chapter: 1 }, at: T + 50 },
})
const c = doc({ readings: [['PSA.1', T + 1]], cleared: { 'JHN.1': T + 40 } })

describe('mergeSync', () => {
  it('junta as duas pontas: leituras, desmarcações, marcas, plano e posição', () => {
    expect(mergeSync(a, b)).toEqual({
      v: 1,
      // GEN.1 lido antes da desmarcação some; o de depois fica. JHN.2 foi desmarcado depois de lido.
      readings: [['GEN.1', T + 50], ['JHN.1', T]],
      cleared: { 'GEN.1': T - 100, 'JHN.2': T + 20 },
      // A remoção (mais nova) vence o destaque.
      marks: { 'JHN.3.16': { color: null, note: '', updatedAt: T + 5 }, 'PSA.23.1': { color: 'blue', note: 'paz', updatedAt: T } },
      activePlan: { value: null, at: T + 30 },
      lastPosition: { value: { book: 'GEN', chapter: 1 }, at: T + 50 },
    })
  })

  it('é comutativa, idempotente e associativa', () => {
    expect(mergeSync(a, b)).toEqual(mergeSync(b, a))
    expect(mergeSync(a, a)).toEqual(mergeSync(a, emptyDoc()))
    expect(mergeSync(mergeSync(a, b), b)).toEqual(mergeSync(a, b))
    expect(mergeSync(mergeSync(a, b), c)).toEqual(mergeSync(a, mergeSync(b, c)))
  })

  it('empate de data escolhe sempre o mesmo lado', () => {
    const x = doc({ marks: { 'JHN.1.1': { color: 'gold', note: '', updatedAt: T } }, activePlan: { value: { id: 'nt-90', startedAt: T }, at: T } })
    const y = doc({ marks: { 'JHN.1.1': { color: 'green', note: '', updatedAt: T } }, activePlan: { value: { id: 'bible-1y', startedAt: T }, at: T } })
    expect(mergeSync(x, y)).toEqual(mergeSync(y, x))
  })

  it('marcar de novo depois de desmarcar volta a contar', () => {
    const r = mergeSync(doc({ readings: [['JHN.1', T]] }), doc({ cleared: { 'JHN.1': T + 1 }, readings: [['JHN.1', T + 2]] }))
    expect(r.readings).toEqual([['JHN.1', T + 2]])
  })
})

describe('parseSyncDoc', () => {
  it('aceita um documento válido e descarta campos desconhecidos', () => {
    expect(parseSyncDoc({ ...a, extra: 1 }, T + 100)).toEqual(mergeSync(a, emptyDoc()))
  })

  it.each([
    ['sem versão', { ...a, v: 2 }],
    ['referência inválida', { ...a, readings: [['JOAO.1', T]] }],
    ['marca em capítulo', { ...a, marks: { 'JHN.3': { color: 'gold', note: '', updatedAt: T } } }],
    ['cor desconhecida', { ...a, marks: { 'JHN.3.16': { color: 'red', note: '', updatedAt: T } } }],
    ['nota longa', { ...a, marks: { 'JHN.3.16': { color: null, note: 'x'.repeat(1001), updatedAt: T } } }],
    ['data no futuro', { ...a, readings: [['JHN.1', T + 3 * 86_400_000]] }],
    ['data antiga demais', { ...a, readings: [['JHN.1', 0]] }],
    ['plano com id estranho', { ...a, activePlan: { value: { id: 'X Y', startedAt: T }, at: T } }],
    ['posição sem capítulo', { ...a, lastPosition: { value: { book: 'JHN' }, at: T } }],
    ['leituras demais', { ...a, readings: Array.from({ length: 50_001 }, () => ['JHN.1', T]) }],
    ['não é objeto', 'texto'],
  ])('recusa %s', (_label, value) => {
    expect(() => parseSyncDoc(value, T + 100)).toThrow(InvalidDoc)
  })
})
