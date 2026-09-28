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
}

export function planStatus(plan: PlanDef, readSinceStart: Set<string>): PlanStatus {
  const done = plan.days.map((day) => day.every((ref) => readSinceStart.has(ref)))
  const completedDays = done.filter(Boolean).length
  const index = done.indexOf(false)
  const todayRefs = index < 0 ? [] : plan.days[index]
  return {
    totalDays: plan.days.length,
    completedDays,
    remainingDays: plan.days.length - completedDays,
    currentDay: index < 0 ? null : index + 1,
    todayRefs,
    nextRef: todayRefs.find((ref) => !readSinceStart.has(ref)) ?? null,
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
