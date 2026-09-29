import { beforeEach, describe, expect, it } from 'vitest'
import { runDue, type Send } from '../src/scheduler.js'
import { freshDb } from './db.js'

const sql = await freshDb()

async function add(id: string, time: number, tz: string, extra: { done_on?: string; last_sent_on?: string } = {}) {
  await sql`
    insert into reminders (endpoint, p256dh, auth, minutes, tz, lang, done_on, last_sent_on)
    values (${`https://fcm.googleapis.com/fcm/send/${id}`}, 'k', 'a', ${time}, ${tz}, 'pt',
            ${extra.done_on ?? null}, ${extra.last_sent_on ?? null})`
}

let sent: string[] = []
let fail: Record<string, number> = {}
const send: Send = async (sub) => {
  const id = sub.endpoint.split('/').pop()!
  if (fail[id]) {
    const err = new Error('push falhou') as Error & { statusCode: number }
    err.statusCode = fail[id]
    throw err
  }
  sent.push(id)
}

beforeEach(async () => {
  await sql`delete from reminders`
  sent = []
  fail = {}
})

// 10:00 UTC = 07:00 em São Paulo = 11:00 em Lisboa (horário de verão até outubro).
const at = (iso: string) => new Date(iso)

describe('runDue', () => {
  it('envia na hora local de cada fuso', async () => {
    await add('sp', 7 * 60, 'America/Sao_Paulo')
    await add('lx', 7 * 60, 'Europe/Lisbon')
    await runDue(sql, at('2026-09-29T10:00:00Z'), send)
    expect(sent).toEqual(['sp'])
  })

  it('não envia antes da hora e tolera até 30 minutos de atraso', async () => {
    await add('sp', 7 * 60, 'America/Sao_Paulo')
    await runDue(sql, at('2026-09-29T09:59:00Z'), send)
    expect(sent).toEqual([])
    await runDue(sql, at('2026-09-29T10:31:00Z'), send)
    expect(sent).toEqual([])
    await runDue(sql, at('2026-09-29T10:30:00Z'), send)
    expect(sent).toEqual(['sp'])
  })

  it('envia uma vez por dia, mesmo rodando várias vezes na janela', async () => {
    await add('sp', 7 * 60, 'America/Sao_Paulo')
    await runDue(sql, at('2026-09-29T10:00:00Z'), send)
    await runDue(sql, at('2026-09-29T10:01:00Z'), send)
    await runDue(sql, at('2026-09-29T10:02:00Z'), send)
    expect(sent).toEqual(['sp'])
    // No dia seguinte, envia de novo.
    await runDue(sql, at('2026-09-30T10:00:00Z'), send)
    expect(sent).toEqual(['sp', 'sp'])
  })

  it('não envia para quem já leu hoje (no fuso local)', async () => {
    await add('lido', 7 * 60, 'America/Sao_Paulo', { done_on: '2026-09-29' })
    await add('ontem', 7 * 60, 'America/Sao_Paulo', { done_on: '2026-09-28' })
    await runDue(sql, at('2026-09-29T10:00:00Z'), send)
    expect(sent).toEqual(['ontem'])
  })

  it('apaga inscrições com falha permanente (404, 410, 400, 401, 403, 413)', async () => {
    const codes = [404, 410, 400, 401, 403, 413]
    for (const c of codes) await add(`g${c}`, 7 * 60, 'America/Sao_Paulo')
    fail = Object.fromEntries(codes.map((c) => [`g${c}`, c]))
    const result = await runDue(sql, at('2026-09-29T10:00:00Z'), send)
    expect(result).toEqual({ sent: 0, removed: codes.length, failed: 0 })
    expect((await sql`select count(*)::int as n from reminders`)[0].n).toBe(0)
  })

  it('outras falhas tentam de novo no minuto seguinte', async () => {
    await add('instavel', 7 * 60, 'America/Sao_Paulo')
    fail = { instavel: 500 }
    expect(await runDue(sql, at('2026-09-29T10:00:00Z'), send)).toEqual({ sent: 0, removed: 0, failed: 1 })
    fail = {}
    expect(await runDue(sql, at('2026-09-29T10:01:00Z'), send)).toEqual({ sent: 1, removed: 0, failed: 0 })
    expect(sent).toEqual(['instavel'])
  })

  it('duas instâncias ao mesmo tempo não enviam em dobro', async () => {
    for (let i = 0; i < 20; i++) await add(`p${i}`, 7 * 60, 'America/Sao_Paulo')
    const now = at('2026-09-29T10:00:00Z')
    await Promise.all([runDue(sql, now, send), runDue(sql, now, send)])
    expect(sent).toHaveLength(20)
    expect(new Set(sent).size).toBe(20)
  })
})
