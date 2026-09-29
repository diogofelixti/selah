import type { Sql } from './db.js'

export interface Subscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}
/** Envia um push; em erro, `statusCode` traz a resposta do serviço de push. */
export type Send = (sub: Subscription, payload: string) => Promise<void>

/** Minutos de tolerância depois da hora escolhida (reinícios, fila atrasada). */
const WINDOW = 30
const PAYLOAD = JSON.stringify({ type: 'reminder' })
const BATCH = 20
/**
 * Respostas que não mudam tentando de novo: inscrição cancelada (404, 410), inválida (400, 413) ou
 * feita com outra chave VAPID (401, 403). O app refaz a inscrição na próxima abertura.
 */
const PERMANENT = new Set([400, 401, 403, 404, 410, 413])

/**
 * Envia os lembretes que chegaram na hora local de cada pessoa e ainda não foram enviados nem lidos hoje.
 * Cada linha é "reservada" (last_sent_on = hoje) antes do envio, para duas instâncias não enviarem em dobro.
 * Consequência: se o processo cair no meio de um lote, esses lembretes ficam sem envio naquele dia (no máximo uma vez).
 */
export async function runDue(sql: Sql, now: Date, send: Send): Promise<{ sent: number; removed: number; failed: number }> {
  const due = await sql`
    with due as (
      select endpoint, last_sent_on::text as prev, (${now}::timestamptz at time zone tz)::date::text as today
      from reminders
      where (extract(hour from ${now}::timestamptz at time zone tz) * 60
             + extract(minute from ${now}::timestamptz at time zone tz)) between minutes and minutes + ${WINDOW}
        and (last_sent_on is null or last_sent_on < (${now}::timestamptz at time zone tz)::date)
        and (done_on is null or done_on < (${now}::timestamptz at time zone tz)::date)
      for update skip locked
    )
    update reminders r set last_sent_on = due.today::date
    from due where r.endpoint = due.endpoint
    returning r.endpoint, r.p256dh, r.auth, due.prev, due.today`

  const result = { sent: 0, removed: 0, failed: 0 }
  // Envia em lotes, para não abrir centenas de conexões de uma vez.
  for (let i = 0; i < due.length; i += BATCH) await Promise.all(due.slice(i, i + BATCH).map(async (row) => {
      try {
        await send({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, PAYLOAD)
        result.sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status !== undefined && PERMANENT.has(status)) {
          await sql`delete from reminders where endpoint = ${row.endpoint}`
          result.removed++
        } else {
          // Devolve a reserva: tenta de novo no minuto seguinte, dentro da janela.
          // Datas como texto: não dependem do fuso da sessão do banco.
          await sql`update reminders set last_sent_on = ${row.prev}::date where endpoint = ${row.endpoint} and last_sent_on = ${row.today}::date`
          result.failed++
        }
      }
    }))
  return result
}
