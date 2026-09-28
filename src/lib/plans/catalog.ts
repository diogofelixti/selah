import { ALL_CHAPTER_REFS, BOOKS, chapterRefs } from '../bible/books'

export const PLAN_IDS = ['bible-1y', 'nt-90', 'gospels-30', 'psalms-proverbs-31'] as const
export type PlanId = (typeof PLAN_IDS)[number]

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
  return {
    'bible-1y': { id: 'bible-1y', days: splitEvenly(ALL_CHAPTER_REFS, 365) },
    'nt-90': { id: 'nt-90', days: splitEvenly(refsOf(nt), 90) },
    'gospels-30': { id: 'gospels-30', days: splitEvenly(refsOf(['MAT', 'MRK', 'LUK', 'JHN']), 30) },
    'psalms-proverbs-31': {
      id: 'psalms-proverbs-31',
      days: chapterRefs('PRO').map((proverb, i) => [proverb, ...psalms[i]]),
    },
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
