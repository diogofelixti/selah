import en from '../i18n/en.json'
import pt from '../i18n/pt.json'
import { formatChapterList, formatRef } from './bible/refs'
import type { Lang } from './i18n/lang'
import { PLANS, isPlanId } from './plans/catalog'
import { planStatus } from './plans/status'
import { readSet } from './progress/progress'
import type { AppState, Reading } from './storage/types'

const DICTS = { pt, en }

/**
 * Texto da notificação do lembrete, montado no aparelho (o servidor não sabe o que a pessoa lê).
 * Plano ativo: capítulos de hoje. Senão, a última posição. Senão, um convite geral.
 */
export function reminderNotification(
  data: { readings: readonly Reading[]; state: AppState },
  lang: Lang,
): { title: string; body: string; url: string } {
  const dict = DICTS[lang]
  const texts = dict.reminder.notification
  const bookName = (id: string) => (dict.books as Record<string, string>)[id] ?? id
  const title = texts.title

  const plan = data.state.activePlan
  if (plan && isPlanId(plan.id)) {
    const status = planStatus(PLANS[plan.id], readSet(data.readings, plan.startedAt))
    if (status.currentDay !== null) {
      const refs = formatChapterList(status.todayRefs, bookName, dict.common.to)
      return { title, body: texts.plan.replace('{refs}', refs), url: '/#/planos' }
    }
  }
  const last = data.state.lastPosition
  if (last) {
    const ref = formatRef(`${last.book}.${last.chapter}`, bookName)
    return { title, body: texts.continue.replace('{ref}', ref), url: `/#/ler/${last.book}/${last.chapter}` }
  }
  return { title, body: texts.generic, url: '/' }
}
