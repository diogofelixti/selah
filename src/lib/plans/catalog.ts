import { ALL_CHAPTER_REFS, BOOKS, chapterRefs } from '../bible/books'

// Ids novos entram no fim: os antigos ficam salvos no plano ativo e nos backups.
export const PLAN_IDS = [
  'bible-1y',
  'nt-90',
  'gospels-30',
  'psalms-proverbs-31',
  'john-21',
  'proverbs-31',
  'psalms-30',
  'paul-30',
  'bible-2y',
  'abraham',
  'joseph',
  'moses',
  'ruth',
  'samuel',
  'david',
  'elijah',
  'esther',
  'daniel',
  'paul-story',
] as const
export type PlanId = (typeof PLAN_IDS)[number]

/** Grupos da tela Planos, do mais curto e simples à Bíblia inteira. */
export const PLAN_GROUPS: readonly { id: 'start' | 'deeper' | 'people' | 'whole'; plans: readonly PlanId[] }[] = [
  { id: 'start', plans: ['john-21', 'proverbs-31', 'psalms-30'] },
  { id: 'deeper', plans: ['gospels-30', 'paul-30', 'psalms-proverbs-31', 'nt-90'] },
  { id: 'whole', plans: ['bible-1y', 'bible-2y'] },
  { id: 'people', plans: ['abraham', 'joseph', 'moses', 'ruth', 'samuel', 'david', 'elijah', 'esther', 'daniel', 'paul-story'] },
]

export interface PlanDef {
  id: PlanId
  days: string[][]
}

/** Divide em `parts` grupos contíguos; os primeiros recebem um item a mais quando a divisão não é exata. */
export function splitEvenly<T>(items: readonly T[], parts: number): T[][] {
  const base = Math.floor(items.length / parts)
  const extra = items.length % parts
  const out: T[][] = []
  let i = 0
  for (let d = 0; d < parts; d++) {
    const n = base + (d < extra ? 1 : 0)
    out.push(items.slice(i, i + n))
    i += n
  }
  return out
}

const refsOf = (ids: string[]) => ids.flatMap((id) => chapterRefs(id))

function build(): Record<PlanId, PlanDef> {
  const nt = BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id)
  const psalms = splitEvenly(chapterRefs('PSA'), 31)
  const paul = ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']
  const oneADay = (book: string) => chapterRefs(book).map((ref) => [ref])
  // Trecho de um livro, do capítulo `from` ao `to`, um capítulo por dia.
  const chapters = (book: string, from: number, to: number) => chapterRefs(book).slice(from - 1, to)
  const daily = (refs: string[]) => refs.map((ref) => [ref])
  return {
    'bible-1y': { id: 'bible-1y', days: splitEvenly(ALL_CHAPTER_REFS, 365) },
    'nt-90': { id: 'nt-90', days: splitEvenly(refsOf(nt), 90) },
    'gospels-30': { id: 'gospels-30', days: splitEvenly(refsOf(['MAT', 'MRK', 'LUK', 'JHN']), 30) },
    'psalms-proverbs-31': {
      id: 'psalms-proverbs-31',
      days: chapterRefs('PRO').map((proverb, i) => [proverb, ...psalms[i]]),
    },
    'john-21': { id: 'john-21', days: oneADay('JHN') },
    'proverbs-31': { id: 'proverbs-31', days: oneADay('PRO') },
    'psalms-30': { id: 'psalms-30', days: splitEvenly(chapterRefs('PSA'), 30) },
    'paul-30': { id: 'paul-30', days: splitEvenly(refsOf(paul), 30) },
    'bible-2y': { id: 'bible-2y', days: splitEvenly(ALL_CHAPTER_REFS, 730) },
    abraham: { id: 'abraham', days: daily(chapters('GEN', 12, 25)) },
    joseph: { id: 'joseph', days: daily(chapters('GEN', 37, 50)) },
    moses: { id: 'moses', days: daily(chapters('EXO', 1, 20)) },
    ruth: { id: 'ruth', days: oneADay('RUT') },
    samuel: { id: 'samuel', days: daily(chapters('1SA', 1, 16)) },
    david: { id: 'david', days: daily([...chapters('1SA', 16, 31), ...chapterRefs('2SA'), ...chapters('1KI', 1, 2)]) },
    elijah: { id: 'elijah', days: daily(['1KI.17', '1KI.18', '1KI.19', '1KI.21', '2KI.1', '2KI.2']) },
    esther: { id: 'esther', days: oneADay('EST') },
    daniel: { id: 'daniel', days: oneADay('DAN') },
    // Conversão (9), chegada a Antioquia com Barnabé (11), viagens, prisão e Roma (13 a 28).
    'paul-story': { id: 'paul-story', days: daily(['ACT.9', 'ACT.11', ...chapters('ACT', 13, 28)]) },
  }
}

export const PLANS: Record<PlanId, PlanDef> = build()

export function isPlanId(x: unknown): x is PlanId {
  return typeof x === 'string' && (PLAN_IDS as readonly string[]).includes(x)
}

const refSets = new WeakMap<PlanDef, Set<string>>()

export function planContains(plan: PlanDef, ref: string): boolean {
  let set = refSets.get(plan)
  if (!set) {
    set = new Set(plan.days.flat())
    refSets.set(plan, set)
  }
  return set.has(ref)
}
