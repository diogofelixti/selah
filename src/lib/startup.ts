/** Pausa depois do load, para o download em segundo plano não disputar a rede com a primeira tela. */
export const STARTUP_DELAY_MS = 3000

export interface StartupWindow {
  document: { readyState: DocumentReadyState }
  addEventListener(type: 'load', fn: () => void, options?: { once: boolean }): void
  setTimeout(fn: () => void, ms: number): unknown
  requestIdleCallback?(fn: () => void, options?: { timeout: number }): unknown
}

/** Resolve quando a página terminou de carregar, passou a pausa e o navegador está ocioso. */
export function afterStartup(win: StartupWindow = window): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => (win.requestIdleCallback ? win.requestIdleCallback(() => resolve(), { timeout: 5000 }) : resolve())
    const start = () => win.setTimeout(idle, STARTUP_DELAY_MS)
    if (win.document.readyState === 'complete') start()
    else win.addEventListener('load', start, { once: true })
  })
}
