import { describe, expect, it } from 'vitest'
import { runDue, type Send } from '../src/scheduler.js'
import { freshDb } from './db.js'

// Sessão do banco num fuso diferente de UTC: a devolução da reserva não pode depender disso.
const sql = await freshDb({ timezone: 'Asia/Tokyo' })

describe('runDue com sessão fora de UTC', () => {
  it('falha passageira devolve a reserva e o envio acontece no minuto seguinte', async () => {
    await sql`insert into reminders (endpoint, p256dh, auth, minutes, tz, lang)
              values ('https://fcm.googleapis.com/fcm/send/x', 'k', 'a', 420, 'America/Sao_Paulo', 'pt')`
    let fails = true
    const sent: string[] = []
    const send: Send = async (sub) => {
      if (fails) throw Object.assign(new Error('rede'), { statusCode: 503 })
      sent.push(sub.endpoint)
    }
    expect((await runDue(sql, new Date('2026-09-29T10:00:00Z'), send)).failed).toBe(1)
    fails = false
    expect((await runDue(sql, new Date('2026-09-29T10:01:00Z'), send)).sent).toBe(1)
    expect(sent).toHaveLength(1)
  })
})
