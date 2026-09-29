import { describe, expect, it } from 'vitest'
import { emptyDoc, InvalidDoc, mergeSync, parseSyncDoc, readingId, type SyncDoc } from '../src/sync-doc.js'

const T = Date.UTC(2026, 8, 29, 12)
const doc = (over: Partial<SyncDoc>): SyncDoc => ({ ...emptyDoc(), ...over })

const a = doc({
  readings: [['JHN.1', T], ['JHN.2', T + 10]],
  removed: ['GEN.1@' + (T - 300)],
  marks: { 'JHN.3.16': { color: 'gold', note: '', updatedAt: T } },
  activePlan: { value: { id: 'gospels-30', startedAt: T - 1000 }, at: T - 1000 },
  lastPosition: { value: { book: 'JHN', chapter: 2 }, at: T + 10 },
})
const b = doc({
  readings: [['JHN.1', T], ['GEN.1', T - 300], ['GEN.1', T + 50], ['JHN.2', T + 10]],
  removed: [readingId('JHN.2', T + 10)],
  marks: { 'JHN.3.16': { color: null, note: '', updatedAt: T + 5 }, 'PSA.23.1': { color: 'blue', note: 'paz', updatedAt: T } },
  activePlan: { value: null, at: T + 30 },
  lastPosition: { value: { book: 'GEN', chapter: 1 }, at: T + 50 },
})
const c = doc({ readings: [['PSA.1', T + 1]], removed: [readingId('JHN.1', T)] })

/** Como o Postgres (jsonb) devolve: chaves reordenadas (mais curtas primeiro, depois alfabética). */
function jsonbOrder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonbOrder)
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort((x, y) => x.length - y.length || (x < y ? -1 : 1))
    return Object.fromEntries(keys.map((k) => [k, jsonbOrder((value as Record<string, unknown>)[k])]))
  }
  return value
}

describe('mergeSync', () => {
  it('junta as duas pontas: leituras, remoções, marcas, plano e posição', () => {
    expect(mergeSync(a, b)).toEqual({
      v: 1,
      // A leitura removida some; a nova leitura do mesmo capítulo (outro momento) fica.
      readings: [['GEN.1', T + 50], ['JHN.1', T]],
      removed: [readingId('GEN.1', T - 300), readingId('JHN.2', T + 10)],
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

  it('o resultado não depende da ordem das chaves (o Postgres reordena)', () => {
    const stored = jsonbOrder(mergeSync(a, emptyDoc())) as SyncDoc
    expect(JSON.stringify(mergeSync(stored, b))).toBe(JSON.stringify(mergeSync(b, a)))
    expect(JSON.stringify(mergeSync(b, stored))).toBe(JSON.stringify(mergeSync(a, b)))
  })

  it('com a mesma data, um valor preenchido vence o vazio (dados de antes da sincronização, data 0)', () => {
    const phone = doc({ activePlan: { value: { id: 'nt-90', startedAt: T }, at: 0 }, lastPosition: { value: { book: 'JHN', chapter: 3 }, at: 0 } })
    const fresh = emptyDoc()
    const onServer = jsonbOrder(mergeSync(phone, emptyDoc())) as SyncDoc
    expect(mergeSync(onServer, fresh).activePlan.value).toEqual({ id: 'nt-90', startedAt: T })
    expect(mergeSync(fresh, onServer).lastPosition.value).toEqual({ book: 'JHN', chapter: 3 })
  })

  it('empate de data entre dois valores escolhe sempre o mesmo, com chaves em qualquer ordem', () => {
    const x = doc({ marks: { 'JHN.1.1': { color: 'gold', note: '', updatedAt: T } }, activePlan: { value: { id: 'nt-90', startedAt: T }, at: T } })
    const y = doc({ marks: { 'JHN.1.1': { color: 'green', note: '', updatedAt: T } }, activePlan: { value: { id: 'bible-1y', startedAt: T }, at: T } })
    expect(mergeSync(x, y)).toEqual(mergeSync(y, x))
    expect(mergeSync(jsonbOrder(x) as SyncDoc, y)).toEqual(mergeSync(y, x))
  })

  it('desmarcar num aparelho não apaga uma leitura nova feita em outro, mesmo com relógio adiantado', () => {
    // O aparelho A (relógio 10 min adiantado) desmarca o que viu; depois o B marca de novo com a hora dele.
    const seenByA = doc({ readings: [['JHN.1', T]] })
    const aUnmarks = doc({ removed: [readingId('JHN.1', T)] })
    const bMarksLater = doc({ readings: [['JHN.1', T + 60_000]] })
    const r = mergeSync(mergeSync(seenByA, aUnmarks), bMarksLater)
    expect(r.readings).toEqual([['JHN.1', T + 60_000]])
  })
})

describe('parseSyncDoc', () => {
  it('aceita um documento válido e descarta campos desconhecidos', () => {
    expect(parseSyncDoc({ ...a, extra: 1 }, T + 100)).toEqual(mergeSync(a, emptyDoc()))
  })

  it('itens com problema são ajustados ou descartados sem recusar o resto', () => {
    const now = T + 100
    const parsed = parseSyncDoc(
      {
        ...a,
        readings: [['JOAO.1', T], ['JHN.1', T], ['JHN.5', 1_000_000], ['JHN.6', T + 0.5], ['JHN.7', now + 5 * 86_400_000]],
        marks: { 'JHN.3': { color: 'gold', note: '', updatedAt: T }, 'JHN.3.16': { color: 'red', note: '', updatedAt: T }, 'JHN.3.17': { color: 'blue', note: 'ok', updatedAt: T } },
      },
      now,
    )
    // Referência inválida sai; data antiga demais vai para 2020; fração arredonda; futuro distante vira "agora".
    expect(parsed.readings).toEqual([['JHN.1', T], ['JHN.5', Date.UTC(2020, 0, 1)], ['JHN.6', T + 1], ['JHN.7', now]])
    expect(Object.keys(parsed.marks)).toEqual(['JHN.3.17'])
  })

  it.each([
    ['sem versão', { ...a, v: 2 }],
    ['leituras que não são lista', { ...a, readings: {} }],
    ['leituras demais', { ...a, readings: Array.from({ length: 50_001 }, () => ['JHN.1', T]) }],
    ['não é objeto', 'texto'],
  ])('recusa documento com estrutura errada: %s', (_label, value) => {
    expect(() => parseSyncDoc(value, T + 100)).toThrow(InvalidDoc)
  })
})
