import { createHash, randomBytes } from 'node:crypto'
import { Hono, type MiddlewareHandler } from 'hono'
import type { Deps } from './app.js'

/** Sessão parada por mais que isso deixa de valer. */
const SESSION_DAYS = 180

export type AuthEnv = { Variables: { userId: string } }

const hash = (token: string) => createHash('sha256').update(token).digest()

/** Exige "Authorization: Bearer <token>" de uma sessão válida; renova o uso. */
export function requireUser(deps: Deps): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const token = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(c.req.header('authorization') ?? '')?.[1]
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const now = deps.now()
    const oldest = new Date(now.getTime() - SESSION_DAYS * 86_400_000)
    const [row] = await deps.sql`
      update sessions set last_used_at = ${now}
      where token_hash = ${hash(token)} and last_used_at > ${oldest}
      returning user_id`
    if (!row) return c.json({ error: 'unauthorized' }, 401)
    c.set('userId', row.user_id)
    await next()
  }
}

export function authRoutes(deps: Deps): Hono {
  const { sql } = deps
  const r = new Hono()

  r.get('/config', (c) => c.json({ googleClientId: deps.googleClientId ?? null }))

  r.post('/google', async (c) => {
    if (!deps.googleClientId || !deps.verifyGoogle) return c.json({ error: 'not_configured' }, 503)
    const body = (await c.req.json().catch(() => null)) as { credential?: unknown } | null
    const credential = body?.credential
    if (typeof credential !== 'string' || credential.length > 4096) return c.json({ error: 'invalid', field: 'credential' }, 400)
    const who = await deps.verifyGoogle(credential)
    if (!who) return c.json({ error: 'invalid_credential' }, 401)

    const now = deps.now()
    const [user] = await sql`
      insert into users (google_sub, email, created_at, last_seen_at) values (${who.sub}, ${who.email}, ${now}, ${now})
      on conflict (google_sub) do update set email = excluded.email, last_seen_at = excluded.last_seen_at
      returning id, email`
    const token = randomBytes(32).toString('base64url')
    await sql`insert into sessions (token_hash, user_id, created_at, last_used_at) values (${hash(token)}, ${user.id}, ${now}, ${now})`
    return c.json({ token, email: user.email })
  })

  r.post('/logout', requireUser(deps), async (c) => {
    const token = c.req.header('authorization')!.slice('Bearer '.length)
    await sql`delete from sessions where token_hash = ${hash(token)}`
    return c.body(null, 204)
  })

  return r
}

export function accountRoutes(deps: Deps): Hono<AuthEnv> {
  const r = new Hono<AuthEnv>()
  r.use('*', requireUser(deps))
  r.get('/', async (c) => {
    const [user] = await deps.sql`select email from users where id = ${c.get('userId')}`
    return c.json({ email: user.email })
  })
  // Apaga a conta, as sessões e o documento sincronizado (on delete cascade).
  r.delete('/', async (c) => {
    await deps.sql`delete from users where id = ${c.get('userId')}`
    return c.body(null, 204)
  })
  return r
}
