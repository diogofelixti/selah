import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { freshDb } from './db.js'

const sql = await freshDb()
let now = new Date('2026-09-29T12:00:00Z')
// Verificador falso: aceita "ok:<sub>:<email>"; qualquer outra coisa é token inválido.
const verifyGoogle = async (credential: string) => {
  const [kind, sub, email] = credential.split(':')
  return kind === 'ok' ? { sub, email } : null
}
const app = createApp({ sql, now: () => now, vapidPublicKey: 'k', googleClientId: 'cliente.apps.googleusercontent.com', verifyGoogle })

let ip = 0
const call = (method: string, path: string, opts: { body?: unknown; token?: string } = {}) =>
  app.request(`/api${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': `10.1.0.${++ip % 250}`,
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })

async function login(sub = 'g-1', email = 'ana@gmail.com') {
  const res = await call('POST', '/auth/google', { body: { credential: `ok:${sub}:${email}` } })
  expect(res.status).toBe(200)
  return (await res.json()) as { token: string; email: string }
}

describe('config', () => {
  it('informa o client ID do Google', async () => {
    expect(await (await call('GET', '/auth/config')).json()).toEqual({ googleClientId: 'cliente.apps.googleusercontent.com' })
  })

  it('sem client ID configurado, informa null e recusa login', async () => {
    const off = createApp({ sql, now: () => now, vapidPublicKey: 'k' })
    expect(await (await off.request('/api/auth/config')).json()).toEqual({ googleClientId: null })
    const res = await off.request('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential: 'ok:x:y' }) })
    expect(res.status).toBe(503)
  })
})

describe('login', () => {
  it('cria o usuário, devolve um token e guarda só o hash', async () => {
    const { token, email } = await login()
    expect(email).toBe('ana@gmail.com')
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const [session] = await sql`select token_hash from sessions`
    expect(Buffer.from(session.token_hash).toString('hex')).toBe(createHash('sha256').update(token).digest('hex'))
    expect(await (await call('GET', '/account', { token })).json()).toEqual({ email: 'ana@gmail.com' })
  })

  it('o mesmo usuário Google em outro aparelho é a mesma conta (e o e-mail se atualiza)', async () => {
    await login('g-2', 'bia@gmail.com')
    await login('g-2', 'bia.nova@gmail.com')
    const users = await sql`select email from users where google_sub = 'g-2'`
    expect(users.map((u) => u.email)).toEqual(['bia.nova@gmail.com'])
    expect((await sql`select count(*)::int as n from sessions s join users u on u.id = s.user_id where u.google_sub = 'g-2'`)[0].n).toBe(2)
  })

  it('token do Google inválido não entra', async () => {
    const res = await call('POST', '/auth/google', { body: { credential: 'falso' } })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'invalid_credential' })
    expect((await call('POST', '/auth/google', { body: {} })).status).toBe(400)
  })
})

describe('sessão', () => {
  it('sem token, token errado ou depois de sair: 401', async () => {
    const { token } = await login('g-3', 'caio@gmail.com')
    expect((await call('GET', '/account')).status).toBe(401)
    expect((await call('GET', '/account', { token: 'x'.repeat(43) })).status).toBe(401)
    expect((await call('POST', '/auth/logout', { token })).status).toBe(204)
    expect((await call('GET', '/account', { token })).status).toBe(401)
  })

  it('expira depois de 180 dias sem uso, e o uso renova', async () => {
    const { token } = await login('g-4', 'dani@gmail.com')
    now = new Date('2027-03-01T12:00:00Z') // 153 dias depois: ainda vale e renova
    expect((await call('GET', '/account', { token })).status).toBe(200)
    now = new Date('2027-08-01T12:00:00Z') // 153 dias depois do último uso
    expect((await call('GET', '/account', { token })).status).toBe(200)
    now = new Date('2028-03-01T12:00:00Z') // mais de 180 dias parado
    expect((await call('GET', '/account', { token })).status).toBe(401)
    now = new Date('2026-09-29T12:00:00Z')
  })
})

describe('excluir conta', () => {
  it('apaga usuário e sessões', async () => {
    const { token } = await login('g-5', 'eva@gmail.com')
    expect((await call('DELETE', '/account', { token })).status).toBe(204)
    expect(await sql`select 1 from users where google_sub = 'g-5'`).toHaveLength(0)
    expect((await call('GET', '/account', { token })).status).toBe(401)
  })
})
