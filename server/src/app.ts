import { Hono } from 'hono'
import { accountRoutes, authRoutes } from './auth.js'
import type { Sql } from './db.js'
import type { VerifyGoogle } from './google.js'
import { rateLimit } from './rate-limit.js'
import { reminderRoutes } from './reminders.js'

export interface Deps {
  sql: Sql
  now: () => Date
  vapidPublicKey: string
  /** Sem client ID, o login fica desligado (o app mostra "Em breve"). */
  googleClientId?: string
  verifyGoogle?: VerifyGoogle
}

export function createApp(deps: Deps): Hono {
  const app = new Hono().basePath('/api')

  app.get('/health', async (c) => {
    await deps.sql`select 1`
    return c.json({ ok: true })
  })

  // Um só limite por IP para todas as rotas; a saúde fica fora (checagens do Docker).
  const limiter = rateLimit({ limit: 30, windowMs: 60_000, now: deps.now })
  app.use('*', (c, next) => (c.req.path === '/api/health' ? next() : limiter(c, next)))
  app.get('/push/key', (c) => c.json({ key: deps.vapidPublicKey }))
  app.route('/reminders', reminderRoutes(deps))
  app.route('/auth', authRoutes(deps))
  app.route('/account', accountRoutes(deps))

  app.notFound((c) => c.json({ error: 'not_found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'internal' }, 500)
  })
  return app
}
