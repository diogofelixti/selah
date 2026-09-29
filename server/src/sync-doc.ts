// Documento de sincronização do Selah e a junção entre dois aparelhos.
// Arquivo puro e sem dependências: o servidor e o app usam o mesmo código.

export type MarkColor = 'gold' | 'green' | 'blue'

export interface SyncMark {
  color: MarkColor | null
  note: string
  updatedAt: number
}

type Plan = { id: string; startedAt: number }
type Position = { book: string; chapter: number }

export interface SyncDoc {
  v: 1
  /** Leituras [capítulo, quando], em ordem e sem repetição. */
  readings: [string, number][]
  /**
   * Leituras desmarcadas, pela identidade "CAP@quando" (ver readingId). Apaga só as leituras que o aparelho
   * viu ao desmarcar: uma leitura nova do mesmo capítulo, feita depois em outro aparelho, continua.
   */
  removed: string[]
  /** Destaques e notas por versículo. Marca vazia (sem cor e sem nota) é uma remoção com data. */
  marks: Record<string, SyncMark>
  activePlan: { value: Plan | null; at: number }
  lastPosition: { value: Position | null; at: number }
}

export class InvalidDoc extends Error {}

export const readingId = (ref: string, readAt: number) => `${ref}@${readAt}`

export const emptyDoc = (): SyncDoc => ({
  v: 1,
  readings: [],
  removed: [],
  marks: {},
  activePlan: { value: null, at: 0 },
  lastPosition: { value: null, at: 0 },
})

// Comparações canônicas: nunca dependem da ordem das chaves (o Postgres reordena o jsonb).
const markKey = (m: SyncMark) => `${m.color ?? ''}|${m.note}`
const planKey = (p: Plan | null) => (p ? `${p.id}|${p.startedAt}` : '')
const positionKey = (p: Position | null) => (p ? `${p.book}|${p.chapter}` : '')

/** Mais recente vence; empate: valor preenchido vence o vazio, e entre dois valores a chave maior. */
function pick<V>(x: { value: V; at: number }, y: { value: V; at: number }, key: (v: V) => string) {
  if (x.at !== y.at) return x.at > y.at ? x : y
  return key(x.value) >= key(y.value) ? x : y
}

const cleanMark = (m: SyncMark): SyncMark => ({ color: m.color, note: m.note, updatedAt: m.updatedAt })
const cleanPlan = (p: Plan | null): Plan | null => (p ? { id: p.id, startedAt: p.startedAt } : null)
const cleanPosition = (p: Position | null): Position | null => (p ? { book: p.book, chapter: p.chapter } : null)

/** Junta dois documentos. Comutativa, associativa e idempotente: todos os aparelhos convergem. */
export function mergeSync(a: SyncDoc, b: SyncDoc): SyncDoc {
  const removed = [...new Set([...a.removed, ...b.removed])].sort()
  const gone = new Set(removed)

  const seen = new Set<string>()
  const readings: [string, number][] = []
  for (const [ref, readAt] of [...a.readings, ...b.readings]) {
    const id = readingId(ref, readAt)
    if (seen.has(id) || gone.has(id)) continue
    seen.add(id)
    readings.push([ref, readAt])
  }
  readings.sort((x, y) => (x[0] === y[0] ? x[1] - y[1] : x[0] < y[0] ? -1 : 1))

  const marks: Record<string, SyncMark> = {}
  for (const ref of [...new Set([...Object.keys(a.marks), ...Object.keys(b.marks)])].sort()) {
    const x = a.marks[ref]
    const y = b.marks[ref]
    const winner = !x ? y : !y ? x : x.updatedAt !== y.updatedAt ? (x.updatedAt > y.updatedAt ? x : y) : markKey(x) >= markKey(y) ? x : y
    marks[ref] = cleanMark(winner)
  }

  const plan = pick(a.activePlan, b.activePlan, planKey)
  const position = pick(a.lastPosition, b.lastPosition, positionKey)
  return {
    v: 1,
    readings,
    removed,
    marks,
    activePlan: { value: cleanPlan(plan.value), at: plan.at },
    lastPosition: { value: cleanPosition(position.value), at: position.at },
  }
}

const MIN_TIME = Date.UTC(2020, 0, 1)
const DAY = 86_400_000
const CHAPTER = /^[1-3A-Z][A-Z0-9]{2}\.\d{1,3}$/
const VERSE = /^[1-3A-Z][A-Z0-9]{2}\.\d{1,3}\.\d{1,3}$/
const LIMITS = { readings: 50_000, removed: 100_000, marks: 50_000, note: 1000 }

/**
 * Datas estranhas (backup antigo, relógio adiantado, frações) são ajustadas em vez de recusar o documento:
 * antes de 2020 vira 2020; mais de um dia no futuro vira "agora". null quando nem é número.
 */
export function clampTime(t: unknown, now: number): number | null {
  if (typeof t !== 'number' || !Number.isFinite(t)) return null
  const r = Math.round(t)
  if (r < MIN_TIME) return MIN_TIME
  if (r > now + DAY) return now
  return r
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/**
 * Valida um documento vindo de fora. Estrutura errada recusa o documento (InvalidDoc); um item com problema
 * é ajustado ou descartado, para um dado estranho não travar a sincronização para sempre.
 */
export function parseSyncDoc(x: unknown, now: number): SyncDoc {
  const fail = (why: string): never => {
    throw new InvalidDoc(why)
  }
  if (!isObj(x) || x.v !== 1) return fail('documento inválido')
  if (!Array.isArray(x.readings) || x.readings.length > LIMITS.readings) fail('leituras inválidas')
  if (!Array.isArray(x.removed) || x.removed.length > LIMITS.removed) fail('remoções inválidas')
  if (!isObj(x.marks) || Object.keys(x.marks).length > LIMITS.marks) fail('marcas inválidas')
  if (!isObj(x.activePlan) || !isObj(x.lastPosition)) fail('plano ou posição inválidos')

  const readings: [string, number][] = []
  for (const r of x.readings as unknown[]) {
    const pair = Array.isArray(r) ? (r as unknown[]) : []
    const time = clampTime(pair[1], now)
    if (typeof pair[0] === 'string' && CHAPTER.test(pair[0]) && time !== null) readings.push([pair[0], time])
  }

  const removed: string[] = []
  for (const id of x.removed as unknown[]) {
    const m = typeof id === 'string' ? /^([^@]+)@(\d+)$/.exec(id) : null
    const time = m ? clampTime(Number(m[2]), now) : null
    if (m && CHAPTER.test(m[1]) && time !== null) removed.push(readingId(m[1], time))
  }

  const marks: Record<string, SyncMark> = {}
  for (const [ref, m] of Object.entries(x.marks as Record<string, unknown>)) {
    if (!VERSE.test(ref) || !isObj(m)) continue
    const { color, note } = m
    const updatedAt = clampTime(m.updatedAt, now)
    if (color !== null && color !== 'gold' && color !== 'green' && color !== 'blue') continue
    if (typeof note !== 'string' || note.length > LIMITS.note || updatedAt === null) continue
    marks[ref] = { color: color as MarkColor | null, note, updatedAt }
  }

  const at = (t: unknown) => (t === 0 ? 0 : (clampTime(t, now) ?? 0))

  const p = x.activePlan as Record<string, unknown>
  const pv = p.value
  const startedAt = isObj(pv) ? clampTime(pv.startedAt, now) : null
  const plan: Plan | null =
    isObj(pv) && typeof pv.id === 'string' && /^[a-z0-9-]{1,40}$/.test(pv.id) && startedAt !== null ? { id: pv.id, startedAt } : null

  const q = x.lastPosition as Record<string, unknown>
  const qv = q.value
  const position: Position | null =
    isObj(qv) && typeof qv.book === 'string' && /^[1-3A-Z][A-Z0-9]{2}$/.test(qv.book) &&
    typeof qv.chapter === 'number' && Number.isInteger(qv.chapter) && qv.chapter >= 1 && qv.chapter <= 150
      ? { book: qv.book, chapter: qv.chapter }
      : null

  const parsed: SyncDoc = {
    v: 1,
    readings,
    removed,
    marks,
    activePlan: { value: plan, at: at(p.at) },
    lastPosition: { value: position, at: at(q.at) },
  }
  // Normaliza (ordem, repetições, leituras já removidas) com a própria junção.
  return mergeSync(parsed, emptyDoc())
}
