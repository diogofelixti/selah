import { Hono, type Context } from 'hono'
import type { Deps } from './app.js'
import { dayDiff, isAuth, isDate, isP256dh, isPushEndpoint, isTimeZone, localDate, parseTime } from './validate.js'

const MAX_BODY = 4096

class Invalid extends Error {
  constructor(readonly field: string) {
    super(field)
  }
}

async function readJson(c: Context): Promise<Record<string, unknown>> {
  const text = await c.req.text()
  if (text.length > MAX_BODY) throw new TooLarge()
  try {
    const value = JSON.parse(text)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  } catch {
    // cai no erro abaixo
  }
  throw new Invalid('body')
}

class TooLarge extends Error {}

export function reminderRoutes(deps: Deps): Hono {
  const { sql } = deps
  const r = new Hono()

  r.onError((err, c) => {
    if (err instanceof Invalid) return c.json({ error: 'invalid', field: err.field }, 400)
    if (err instanceof TooLarge) return c.json({ error: 'too_large' }, 413)
    throw err
  })

  r.put('/', async (c) => {
    const body = await readJson(c)
    const sub = body.subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | undefined
    if (!isPushEndpoint(sub?.endpoint)) throw new Invalid('endpoint')
    if (!isP256dh(sub?.keys?.p256dh) || !isAuth(sub?.keys?.auth)) throw new Invalid('keys')
    const minutes = parseTime(body.time)
    if (minutes === null) throw new Invalid('time')
    if (!isTimeZone(body.tz)) throw new Invalid('tz')
    if (body.lang !== 'pt' && body.lang !== 'en') throw new Invalid('lang')
    const { endpoint, keys } = sub as { endpoint: string; keys: { p256dh: string; auth: string } }
    await sql`
      insert into reminders (endpoint, p256dh, auth, minutes, tz, lang)
      values (${endpoint}, ${keys.p256dh}, ${keys.auth}, ${minutes}, ${body.tz as string}, ${body.lang})
      on conflict (endpoint) do update set
        p256dh = excluded.p256dh, auth = excluded.auth, minutes = excluded.minutes,
        tz = excluded.tz, lang = excluded.lang, updated_at = now()`
    return c.body(null, 204)
  })

  r.delete('/', async (c) => {
    const body = await readJson(c)
    if (!isPushEndpoint(body.endpoint)) throw new Invalid('endpoint')
    await sql`delete from reminders where endpoint = ${body.endpoint}`
    return c.body(null, 204)
  })

  r.post('/done', async (c) => {
    const body = await readJson(c)
    if (!isPushEndpoint(body.endpoint)) throw new Invalid('endpoint')
    if (!isDate(body.date)) throw new Invalid('date')
    const [row] = await sql`select tz from reminders where endpoint = ${body.endpoint}`
    if (!row) return c.json({ error: 'not_found' }, 404)
    // Hoje ou ontem no fuso do registro (aparelho atrasado). Amanhã apagaria o lembrete de amanhã sem leitura.
    const diff = dayDiff(body.date, localDate(deps.now(), row.tz))
    if (diff > 0 || diff < -1) throw new Invalid('date')
    await sql`
      update reminders set done_on = greatest(coalesce(done_on, ${body.date}::date), ${body.date}::date)
      where endpoint = ${body.endpoint}`
    return c.body(null, 204)
  })

  return r
}
