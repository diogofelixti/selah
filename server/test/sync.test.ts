import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { emptyDoc, type SyncDoc } from '../src/sync-doc.js'
import { freshDb } from './db.js'

const sql = await freshDb()
const now = new Date('2026-09-29T12:00:00Z')
const T = now.getTime() - 60_000
const verifyGoogle = async (credential: string) => {
  const [sub, email] = credential.split(':')
  return { sub, email }
}
const app = createApp({ sql, now: () => now, vapidPublicKey: 'k', googleClientId: 'id', verifyGoogle })

let ip = 0
const call = (method: string, path: string, opts: { body?: unknown; raw?: string; token?: string } = {}) =>
  app.request(`/api${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': `10.2.${Math.floor(++ip / 250)}.${ip % 250}`,
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  })

const login = async (sub: string) => ((await (await call('POST', '/auth/google', { body: { credential: `${sub}:${sub}@gmail.com` } })).json()) as { token: string }).token
const sync = async (token: string, doc: SyncDoc) => call('POST', '/sync', { body: doc, token })
const doc = (over: Partial<SyncDoc>): SyncDoc => ({ ...emptyDoc(), ...over })

describe('POST /sync', () => {
  it('junta o que dois aparelhos da mesma conta enviam', async () => {
    const phone = await login('u1')
    const laptop = await login('u1')
    const r1 = await sync(phone, doc({ readings: [['JHN.1', T]], marks: { 'JHN.3.16': { color: 'gold', note: '', updatedAt: T } } }))
    expect(r1.status).toBe(200)
    expect((await r1.json()).readings).toEqual([['JHN.1', T]])
    const r2 = await sync(laptop, doc({ readings: [['GEN.1', T + 1]], cleared: { 'JHN.1': T + 2 } }))
    const merged = (await r2.json()) as SyncDoc
    expect(merged.readings).toEqual([['GEN.1', T + 1]])
    expect(merged.marks['JHN.3.16'].color).toBe('gold')
    // O celular recebe o mesmo resultado na próxima vez.
    expect(await (await sync(phone, emptyDoc())).json()).toEqual(merged)
  })

  it('contas diferentes não se misturam', async () => {
    const a = await login('u2')
    const b = await login('u3')
    await sync(a, doc({ readings: [['PSA.23', T]] }))
    expect((await (await sync(b, emptyDoc())).json()).readings).toEqual([])
  })

  it('sem sessão: 401; documento inválido: 400; grande demais: 413', async () => {
    expect((await call('POST', '/sync', { body: emptyDoc() })).status).toBe(401)
    const token = await login('u4')
    const bad = await sync(token, doc({ readings: [['XX', T]] }))
    expect(bad.status).toBe(400)
    expect(await bad.json()).toEqual({ error: 'invalid_doc' })
    expect((await call('POST', '/sync', { raw: '{nada', token })).status).toBe(400)
    const big = JSON.stringify({ ...emptyDoc(), pad: 'x'.repeat(2_100_000) })
    expect((await call('POST', '/sync', { raw: big, token })).status).toBe(413)
  })

  it('pedidos ao mesmo tempo não perdem nada', async () => {
    const token = await login('u5')
    await Promise.all(Array.from({ length: 10 }, (_, i) => sync(token, doc({ readings: [[`MAT.${i + 1}`, T]] }))))
    expect((await (await sync(token, emptyDoc())).json()).readings).toHaveLength(10)
  })

  it('limite de 60 sincronizações por minuto por conta', async () => {
    const token = await login('u6')
    const statuses: number[] = []
    for (let i = 0; i < 61; i++) statuses.push((await sync(token, emptyDoc())).status)
    expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true)
    expect(statuses[60]).toBe(429)
  })

  it('excluir a conta apaga o documento', async () => {
    const token = await login('u7')
    await sync(token, doc({ readings: [['JHN.1', T]] }))
    await call('DELETE', '/account', { token })
    expect(await sql`select 1 from sync_docs d join users u on u.id = d.user_id where u.google_sub = 'u7'`).toHaveLength(0)
    expect((await sql`select count(*)::int as n from sync_docs`)[0].n).toBeGreaterThan(0)
  })
})
