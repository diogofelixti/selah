// Documento de sincronização do Selah e a junção entre dois aparelhos.
// Arquivo puro e sem dependências: o servidor e o app usam o mesmo código.

export type MarkColor = 'gold' | 'green' | 'blue'

export interface SyncMark {
  color: MarkColor | null
  note: string
  updatedAt: number
}

export interface SyncDoc {
  v: 1
  /** Leituras [capítulo, quando], em ordem e sem repetição. */
  readings: [string, number][]
  /** Capítulo desmarcado em T: apaga as leituras dele feitas até T, em todos os aparelhos. */
  cleared: Record<string, number>
  /** Destaques e notas por versículo. Marca vazia (sem cor e sem nota) é uma remoção com data. */
  marks: Record<string, SyncMark>
  activePlan: { value: { id: string; startedAt: number } | null; at: number }
  lastPosition: { value: { book: string; chapter: number } | null; at: number }
}

export class InvalidDoc extends Error {}

export const emptyDoc = (): SyncDoc => ({
  v: 1,
  readings: [],
  cleared: {},
  marks: {},
  activePlan: { value: null, at: 0 },
  lastPosition: { value: null, at: 0 },
})

/** Desempate estável: a mesma escolha qualquer que seja a ordem dos lados. */
const later = <T extends { at?: number; updatedAt?: number }>(x: T, y: T, time: (v: T) => number): T => {
  const tx = time(x)
  const ty = time(y)
  if (tx !== ty) return tx > ty ? x : y
  return JSON.stringify(x) >= JSON.stringify(y) ? x : y
}

const sortedKeys = <V>(obj: Record<string, V>): Record<string, V> =>
  Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]))

/** Junta dois documentos. Comutativa, associativa e idempotente: todos os aparelhos convergem. */
export function mergeSync(a: SyncDoc, b: SyncDoc): SyncDoc {
  const cleared: Record<string, number> = { ...a.cleared }
  for (const [ref, t] of Object.entries(b.cleared)) cleared[ref] = Math.max(cleared[ref] ?? -Infinity, t)

  const seen = new Set<string>()
  const readings: [string, number][] = []
  for (const [ref, readAt] of [...a.readings, ...b.readings]) {
    const key = `${ref}@${readAt}`
    if (seen.has(key) || readAt <= (cleared[ref] ?? -Infinity)) continue
    seen.add(key)
    readings.push([ref, readAt])
  }
  readings.sort((x, y) => (x[0] === y[0] ? x[1] - y[1] : x[0] < y[0] ? -1 : 1))

  const marks: Record<string, SyncMark> = { ...a.marks }
  for (const [ref, mark] of Object.entries(b.marks)) {
    marks[ref] = marks[ref] ? later(marks[ref], mark, (m) => m.updatedAt) : mark
  }

  return {
    v: 1,
    readings,
    cleared: sortedKeys(cleared),
    marks: sortedKeys(marks),
    activePlan: later(a.activePlan, b.activePlan, (p) => p.at),
    lastPosition: later(a.lastPosition, b.lastPosition, (p) => p.at),
  }
}

const MIN_TIME = Date.UTC(2020, 0, 1)
const CHAPTER = /^[1-3A-Z][A-Z0-9]{2}\.\d{1,3}$/
const VERSE = /^[1-3A-Z][A-Z0-9]{2}\.\d{1,3}\.\d{1,3}$/
const LIMITS = { readings: 50_000, cleared: 5_000, marks: 10_000, note: 1000 }

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Valida um documento vindo de fora (corpo do pedido) e devolve só os campos conhecidos, já normalizado. */
export function parseSyncDoc(x: unknown, now: number): SyncDoc {
  const fail = (why: string): never => {
    throw new InvalidDoc(why)
  }
  const time = (t: unknown, what: string): number =>
    typeof t === 'number' && Number.isInteger(t) && t >= MIN_TIME && t <= now + 86_400_000 ? t : fail(`${what}: data inválida`)
  const timeOrZero = (t: unknown, what: string): number => (t === 0 ? 0 : time(t, what))

  if (!isObj(x) || x.v !== 1) fail('documento inválido')
  const d = x as Record<string, unknown>

  if (!Array.isArray(d.readings) || d.readings.length > LIMITS.readings) fail('leituras inválidas')
  const readings = (d.readings as unknown[]).map((r): [string, number] => {
    const pair = Array.isArray(r) ? (r as unknown[]) : []
    const ref = pair[0]
    if (pair.length !== 2 || typeof ref !== 'string' || !CHAPTER.test(ref)) fail('leitura inválida')
    return [ref as string, time(pair[1], 'leitura')]
  })

  if (!isObj(d.cleared) || Object.keys(d.cleared).length > LIMITS.cleared) fail('desmarcações inválidas')
  const cleared: Record<string, number> = {}
  for (const [ref, t] of Object.entries(d.cleared as Record<string, unknown>)) {
    if (!CHAPTER.test(ref)) fail('desmarcação inválida')
    cleared[ref] = time(t, 'desmarcação')
  }

  if (!isObj(d.marks) || Object.keys(d.marks).length > LIMITS.marks) fail('marcas inválidas')
  const marks: Record<string, SyncMark> = {}
  for (const [ref, m] of Object.entries(d.marks as Record<string, unknown>)) {
    if (!VERSE.test(ref) || !isObj(m)) fail('marca inválida')
    const { color, note } = m as Record<string, unknown>
    if (color !== null && color !== 'gold' && color !== 'green' && color !== 'blue') fail('cor inválida')
    if (typeof note !== 'string' || note.length > LIMITS.note) fail('nota inválida')
    marks[ref] = { color: color as MarkColor | null, note: note as string, updatedAt: time((m as Record<string, unknown>).updatedAt, 'marca') }
  }

  const plan = d.activePlan
  if (!isObj(plan)) fail('plano inválido')
  const p = plan as Record<string, unknown>
  let planValue: SyncDoc['activePlan']['value'] = null
  if (p.value !== null) {
    const v = p.value
    if (!isObj(v) || typeof v.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(v.id)) fail('plano inválido')
    planValue = { id: (v as Record<string, unknown>).id as string, startedAt: time((v as Record<string, unknown>).startedAt, 'plano') }
  }

  const pos = d.lastPosition
  if (!isObj(pos)) fail('posição inválida')
  const q = pos as Record<string, unknown>
  let posValue: SyncDoc['lastPosition']['value'] = null
  if (q.value !== null) {
    const v = q.value
    const chapter = isObj(v) ? v.chapter : undefined
    if (!isObj(v) || typeof v.book !== 'string' || !/^[1-3A-Z][A-Z0-9]{2}$/.test(v.book) || typeof chapter !== 'number' || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
      fail('posição inválida')
    }
    posValue = { book: (v as Record<string, unknown>).book as string, chapter: chapter as number }
  }

  const parsed: SyncDoc = {
    v: 1,
    readings,
    cleared,
    marks,
    activePlan: { value: planValue, at: timeOrZero(p.at, 'plano') },
    lastPosition: { value: posValue, at: timeOrZero(q.at, 'posição') },
  }
  // Normaliza (ordem, repetições, leituras já desmarcadas) com a própria junção.
  return mergeSync(parsed, emptyDoc())
}
