/** Chama `update` no máximo uma vez a cada `intervalMs`. Falhas (sem rede) são ignoradas. */
export function createUpdateChecker(
  update: () => unknown,
  intervalMs: number,
  now: () => number = Date.now,
): () => void {
  let last = now()
  return () => {
    const t = now()
    if (t - last < intervalMs) return
    last = t
    try {
      void Promise.resolve(update()).catch(() => {})
    } catch {
      // Sem rede ou service worker indisponível: tenta de novo no próximo intervalo.
    }
  }
}
