import { readSet, type Reading } from '../progress/progress'
import { planContains, type PlanDef } from './catalog'

export interface PlanStatus {
  totalDays: number
  completedDays: number
  remainingDays: number
  /** Dia atual, começando em 1. null quando o plano foi concluído. */
  currentDay: number | null
  todayRefs: string[]
  nextRef: string | null
  readChapters: number
  totalChapters: number
  /** Capítulos lidos desde o início sobre o total do plano, arredondado para baixo. */
  percent: number
}

export function planStatus(plan: PlanDef, readSinceStart: Set<string>): PlanStatus {
  const done = plan.days.map((day) => day.every((ref) => readSinceStart.has(ref)))
  const completedDays = done.filter(Boolean).length
  const index = done.indexOf(false)
  const todayRefs = index < 0 ? [] : plan.days[index]
  const all = plan.days.flat()
  const readChapters = all.filter((ref) => readSinceStart.has(ref)).length
  return {
    totalDays: plan.days.length,
    completedDays,
    remainingDays: plan.days.length - completedDays,
    currentDay: index < 0 ? null : index + 1,
    todayRefs,
    nextRef: todayRefs.find((ref) => !readSinceStart.has(ref)) ?? null,
    readChapters,
    totalChapters: all.length,
    percent: all.length === 0 ? 0 : Math.floor((readChapters * 100) / all.length),
  }
}

/**
 * Se o capítulo faz parte do plano ativo, só conta leitura feita depois do início do plano.
 * Assim, quem começa um plano novo consegue marcar de novo capítulos que já tinha lido.
 */
export function isChapterDone(
  ref: string,
  readings: readonly Reading[],
  active: { def: PlanDef; startedAt: number } | null,
): boolean {
  if (active && planContains(active.def, ref)) return readSet(readings, active.startedAt).has(ref)
  return readSet(readings).has(ref)
}

export interface StripDay {
  n: number
  complete: boolean
  current: boolean
}

/** Janela de `width` dias em volta do dia atual, sempre dentro do plano. */
export function planStrip(plan: PlanDef, readSinceStart: Set<string>, width = 7): StripDay[] {
  const total = plan.days.length
  const current = planStatus(plan, readSinceStart).currentDay
  const center = current ?? total
  const start = Math.max(1, Math.min(center - Math.floor(width / 2), total - width + 1))
  const end = Math.min(total, start + width - 1)
  const strip: StripDay[] = []
  for (let n = start; n <= end; n++) {
    strip.push({ n, complete: plan.days[n - 1].every((ref) => readSinceStart.has(ref)), current: n === current })
  }
  return strip
}

export interface DayCard {
  n: number
  refs: string[]
  doneCount: number
  total: number
  complete: boolean
  today: boolean
}

/** O dia atual e os seguintes, até `count` dias. Vazio quando o plano acabou. */
export function visibleDays(plan: PlanDef, readSinceStart: Set<string>, count = 3): DayCard[] {
  const current = planStatus(plan, readSinceStart).currentDay
  if (current === null) return []
  const cards: DayCard[] = []
  for (let n = current; n < current + count && n <= plan.days.length; n++) {
    const refs = plan.days[n - 1]
    const doneCount = refs.filter((ref) => readSinceStart.has(ref)).length
    cards.push({ n, refs, doneCount, total: refs.length, complete: doneCount === refs.length, today: n === current })
  }
  return cards
}
