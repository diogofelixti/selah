import { Hono } from 'hono'
import type { Deps } from './app.js'
import { requireUser, type AuthEnv } from './auth.js'
import { rateLimit } from './rate-limit.js'
import { emptyDoc, InvalidDoc, mergeSync, parseSyncDoc, type SyncDoc } from './sync-doc.js'

/** Um ano de leitura dá dezenas de KB; 2 MB sobra com folga. */
const MAX_BODY = 2 * 1024 * 1024

export function syncRoutes(deps: Deps): Hono<AuthEnv> {
  const r = new Hono<AuthEnv>()
  r.use('*', requireUser(deps))
  r.use('*', rateLimit({ limit: 60, windowMs: 60_000, now: deps.now, key: (c) => `user:${c.get('userId')}` }))

  // Recebe o documento do aparelho, junta com o da conta e devolve o resultado (o aparelho aplica).
  r.post('/', async (c) => {
    const text = await c.req.text()
    if (text.length > MAX_BODY) return c.json({ error: 'too_large' }, 413)
    let incoming: SyncDoc
    try {
      incoming = parseSyncDoc(JSON.parse(text), deps.now().getTime())
    } catch (err) {
      if (err instanceof InvalidDoc || err instanceof SyntaxError) return c.json({ error: 'invalid_doc' }, 400)
      throw err
    }
    const userId = c.get('userId')
    const merged = await deps.sql.begin(async (tx) => {
      // Trava a linha da conta: pedidos ao mesmo tempo juntam um depois do outro, sem perder nada.
      await tx`insert into sync_docs (user_id, doc) values (${userId}, ${tx.json(emptyDoc() as never)}) on conflict do nothing`
      const [row] = await tx`select doc from sync_docs where user_id = ${userId} for update`
      const result = mergeSync(row.doc as SyncDoc, incoming)
      await tx`update sync_docs set doc = ${tx.json(result as never)}, updated_at = ${deps.now()} where user_id = ${userId}`
      return result
    })
    return c.json(merged)
  })
  return r
}
