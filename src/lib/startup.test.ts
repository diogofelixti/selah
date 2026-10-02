import { afterEach, describe, expect, it, vi } from 'vitest'
import { STARTUP_DELAY_MS, afterStartup, type StartupWindow } from './startup'

function fakeWindow(readyState: DocumentReadyState, idle = true) {
  const listeners: Record<string, () => void> = {}
  const win: StartupWindow = {
    document: { readyState },
    addEventListener: (type, fn) => {
      listeners[type] = fn
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    ...(idle ? { requestIdleCallback: (fn: () => void) => setTimeout(fn, 50) } : {}),
  }
  return { win, fireLoad: () => listeners.load?.() }
}

describe('afterStartup', () => {
  afterEach(() => vi.useRealTimers())

  it('espera o load da página, depois a pausa e o navegador ocioso', async () => {
    vi.useFakeTimers()
    const { win, fireLoad } = fakeWindow('loading')
    let done = false
    void afterStartup(win).then(() => (done = true))
    await vi.advanceTimersByTimeAsync(STARTUP_DELAY_MS * 3)
    expect(done).toBe(false)
    fireLoad()
    await vi.advanceTimersByTimeAsync(STARTUP_DELAY_MS - 1)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(51)
    expect(done).toBe(true)
  })

  it('página já carregada: só espera a pausa', async () => {
    vi.useFakeTimers()
    const { win } = fakeWindow('complete')
    let done = false
    void afterStartup(win).then(() => (done = true))
    await vi.advanceTimersByTimeAsync(STARTUP_DELAY_MS + 51)
    expect(done).toBe(true)
  })

  it('funciona sem requestIdleCallback (Safari)', async () => {
    vi.useFakeTimers()
    const { win } = fakeWindow('complete', false)
    let done = false
    void afterStartup(win).then(() => (done = true))
    await vi.advanceTimersByTimeAsync(STARTUP_DELAY_MS)
    expect(done).toBe(true)
  })
})
