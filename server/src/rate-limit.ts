import type { MiddlewareHandler } from 'hono'

/** Janela fixa por IP (o IP real vem da Cloudflare pelo nginx). Memória limpa a cada janela. */
export function rateLimit(opts: { limit: number; windowMs: number; now: () => Date }): MiddlewareHandler {
  let windowStart = 0
  let counts = new Map<string, number>()
  return async (c, next) => {
    const t = opts.now().getTime()
    if (t - windowStart >= opts.windowMs) {
      windowStart = t
      counts = new Map()
    }
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'desconhecido'
    const n = (counts.get(ip) ?? 0) + 1
    counts.set(ip, n)
    if (n > opts.limit) return c.json({ error: 'rate_limited' }, 429)
    await next()
  }
}
