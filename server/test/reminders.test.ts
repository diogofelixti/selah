import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { freshDb } from './db.js'

const sql = await freshDb()
let now = new Date('2026-09-29T12:00:00Z')
const app = createApp({ sql, now: () => now, vapidPublicKey: 'chave-publica' })

let ipCounter = 0
/** Cada pedido sai de um IP diferente, para o limite por IP não interferir (há um teste só para ele). */
function call(method: string, path: string, body?: unknown, ip = `10.0.0.${++ipCounter % 250}`) {
  return app.request(`/api${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const b64u = (bytes: number[]) => Buffer.from(bytes).toString('base64url')
const P256DH = b64u([4, ...Array.from({ length: 64 }, (_, i) => i)])
const AUTH = b64u(Array.from({ length: 16 }, (_, i) => i))
const keys = { p256dh: P256DH, auth: AUTH }
const endpoint = (n = 1) => `https://fcm.googleapis.com/fcm/send/aparelho-${n}`
const reminder = (over: Record<string, unknown> = {}) => ({
  subscription: { endpoint: endpoint(), keys },
  time: '07:30',
  tz: 'America/Sao_Paulo',
  lang: 'pt',
  ...over,
})
const row = async (ep = endpoint()) => (await sql`select * from reminders where endpoint = ${ep}`)[0]

describe('GET /push/key', () => {
  it('devolve a chave pública VAPID', async () => {
    const res = await call('GET', '/push/key')
    expect(await res.json()).toEqual({ key: 'chave-publica' })
  })
})

describe('PUT /reminders', () => {
  it('grava e depois atualiza pelo endpoint', async () => {
    expect((await call('PUT', '/reminders', reminder())).status).toBe(204)
    expect(await row()).toMatchObject({ minutes: 450, tz: 'America/Sao_Paulo', lang: 'pt', p256dh: P256DH, auth: AUTH })
    expect((await call('PUT', '/reminders', reminder({ time: '21:05', lang: 'en', tz: 'Europe/Lisbon' }))).status).toBe(204)
    expect(await row()).toMatchObject({ minutes: 1265, tz: 'Europe/Lisbon', lang: 'en' })
    expect((await sql`select count(*)::int as n from reminders`)[0].n).toBe(1)
  })

  it.each([
    ['http://fcm.googleapis.com/fcm/send/x', 'endpoint sem https'],
    ['https://evil.example.com/push', 'serviço desconhecido'],
    ['https://fcm.googleapis.com.evil.com/x', 'domínio que só começa igual'],
    ['https://169.254.169.254/latest', 'IP interno'],
    ['não é url', 'texto qualquer'],
  ])('recusa %s (%s)', async (ep) => {
    const res = await call('PUT', '/reminders', reminder({ subscription: { endpoint: ep, keys } }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid', field: 'endpoint' })
  })

  it.each([
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://web.push.apple.com/QGx',
    'https://wns2-par02p.notify.windows.com/w/?token=abc',
  ])('aceita %s', async (ep) => {
    const res = await call('PUT', '/reminders', reminder({ subscription: { endpoint: ep, keys } }))
    expect(res.status).toBe(204)
  })

  it.each([
    [{ time: '24:00' }, 'time'],
    [{ time: '7:30' }, 'time'],
    [{ time: '07:60' }, 'time'],
    [{ tz: 'Marte/Olimpo' }, 'tz'],
    [{ lang: 'es' }, 'lang'],
    [{ subscription: { endpoint: endpoint(), keys: {} } }, 'keys'],
    [{ subscription: { endpoint: endpoint(), keys: { p256dh: 'x'.repeat(300), auth: AUTH } } }, 'keys'],
    [{ subscription: { endpoint: endpoint(), keys: { p256dh: 'BPk3', auth: AUTH } } }, 'keys'],
    [{ subscription: { endpoint: endpoint(), keys: { p256dh: b64u(Array(65).fill(5)), auth: AUTH } } }, 'keys'],
    [{ subscription: { endpoint: endpoint(), keys: { p256dh: P256DH, auth: b64u([1, 2, 3]) } } }, 'keys'],
  ])('recusa campo inválido %j', async (over, field) => {
    const res = await call('PUT', '/reminders', reminder(over))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid', field })
  })

  it('recusa JSON malformado e corpo grande demais', async () => {
    expect((await call('PUT', '/reminders', '{nada')).status).toBe(400)
    const big = await call('PUT', '/reminders', reminder({ extra: 'x'.repeat(5000) }))
    expect(big.status).toBe(413)
  })
})

describe('DELETE /reminders', () => {
  it('apaga e é idempotente', async () => {
    await call('PUT', '/reminders', reminder({ subscription: { endpoint: endpoint(2), keys } }))
    expect((await call('DELETE', '/reminders', { endpoint: endpoint(2) })).status).toBe(204)
    expect(await row(endpoint(2))).toBeUndefined()
    expect((await call('DELETE', '/reminders', { endpoint: endpoint(2) })).status).toBe(204)
  })
})

describe('POST /reminders/done', () => {
  it('marca o dia lido na data local do fuso do registro', async () => {
    await call('PUT', '/reminders', reminder({ subscription: { endpoint: endpoint(3), keys } }))
    // 2026-09-30 01:00 UTC ainda é dia 29 em São Paulo.
    now = new Date('2026-09-30T01:00:00Z')
    expect((await call('POST', '/reminders/done', { endpoint: endpoint(3), date: '2026-09-29' })).status).toBe(204)
    const r = await row(endpoint(3))
    expect(r.done_on.toISOString().slice(0, 10)).toBe('2026-09-29')
  })

  it('recusa datas longe de hoje, o dia de amanhã e endpoint desconhecido', async () => {
    now = new Date('2026-09-29T12:00:00Z')
    const far = await call('POST', '/reminders/done', { endpoint: endpoint(3), date: '2026-10-05' })
    expect(far.status).toBe(400)
    expect(await far.json()).toEqual({ error: 'invalid', field: 'date' })
    // Amanhã (no fuso do registro) apagaria o lembrete de amanhã sem a pessoa ter lido.
    expect((await call('POST', '/reminders/done', { endpoint: endpoint(3), date: '2026-09-30' })).status).toBe(400)
    // Ontem ainda vale (aparelho atrasado em relação ao fuso do registro).
    expect((await call('POST', '/reminders/done', { endpoint: endpoint(3), date: '2026-09-28' })).status).toBe(204)
    const unknown = await call('POST', '/reminders/done', { endpoint: endpoint(99), date: '2026-09-29' })
    expect(unknown.status).toBe(404)
  })
})

describe('limite por IP', () => {
  it('passa de 30 pedidos por minuto no mesmo IP e recebe 429', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 32; i++) statuses.push((await call('GET', '/push/key', undefined, '203.0.113.9')).status)
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true)
    expect(statuses.slice(30)).toEqual([429, 429])
    // Outro IP não é afetado.
    expect((await call('GET', '/push/key', undefined, '203.0.113.10')).status).toBe(200)
  })
  it('o limite é um só por IP, somando todas as rotas, e cada pedido conta uma vez', async () => {
    const ip = '203.0.113.20'
    const statuses: number[] = []
    for (let i = 0; i < 15; i++) statuses.push((await call('GET', '/push/key', undefined, ip)).status)
    for (let i = 0; i < 15; i++) statuses.push((await call('DELETE', '/reminders', { endpoint: endpoint(50) }, ip)).status)
    expect(statuses.every((s) => s === 200 || s === 204)).toBe(true)
    expect((await call('DELETE', '/reminders', { endpoint: endpoint(50) }, ip)).status).toBe(429)
  })

  it('a checagem de saúde não conta no limite', async () => {
    for (let i = 0; i < 35; i++) expect((await call('GET', '/health', undefined, '203.0.113.30')).status).toBe(200)
  })
})
