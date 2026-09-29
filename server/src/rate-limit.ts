import type { Context, Env, MiddlewareHandler } from 'hono'

/** IP real do visitante, repassado pela Cloudflare e pelo nginx. */
export const clientIp = (c: Context) => c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'desconhecido'

/** Janela fixa por chave (IP, por padrão). Memória limpa a cada janela. */
export function rateLimit<E extends Env = Env>(opts: {
  limit: number
  windowMs: number
  now: () => Date
  key?: (c: Context<E>) => string
}): MiddlewareHandler<E> {
  let windowStart = 0
  let counts = new Map<string, number>()
  return async (c, next) => {
    const t = opts.now().getTime()
    if (t - windowStart >= opts.windowMs) {
      windowStart = t
      counts = new Map()
    }
    const key = (opts.key ?? clientIp)(c)
    const n = (counts.get(key) ?? 0) + 1
    counts.set(key, n)
    if (n > opts.limit) return c.json({ error: 'rate_limited' }, 429)
    await next()
  }
}
