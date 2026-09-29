import { Hono } from 'hono'
import type { Sql } from './db.js'

export interface Deps {
  sql: Sql
  now: () => Date
  vapidPublicKey: string
}

export function createApp(deps: Deps): Hono {
  const app = new Hono().basePath('/api')

  app.get('/health', async (c) => {
    await deps.sql`select 1`
    return c.json({ ok: true })
  })

  app.notFound((c) => c.json({ error: 'not_found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'internal' }, 500)
  })
  return app
}
