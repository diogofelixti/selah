// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { browserEngine } from './speech'

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

let synth: { speaking: boolean; pending: boolean; speak: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; getVoices: () => unknown[]; addEventListener: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.useFakeTimers()
  synth = { speaking: false, pending: false, speak: vi.fn(), cancel: vi.fn(), getVoices: () => [], addEventListener: vi.fn() }
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
})
afterEach(() => vi.useRealTimers())

describe('browserEngine', () => {
  it('considera a fala terminada quando o navegador para de falar sem avisar (Android)', () => {
    const engine = browserEngine('pt-BR')!
    const done = vi.fn()
    synth.speaking = true
    engine.speak('um', 1, done)
    vi.advanceTimersByTime(3000)
    expect(done).not.toHaveBeenCalled()
    synth.speaking = false
    vi.advanceTimersByTime(3000)
    expect(done).toHaveBeenCalledWith('end')
    vi.advanceTimersByTime(5000)
    expect(done).toHaveBeenCalledOnce()
  })

  it('não dispara a checagem depois do fim normal da fala', () => {
    const engine = browserEngine('pt-BR')!
    const done = vi.fn()
    synth.speaking = true
    engine.speak('um', 1, done)
    const utterance = synth.speak.mock.calls[0][0] as FakeUtterance
    utterance.onend!()
    synth.speaking = false
    vi.advanceTimersByTime(10_000)
    expect(done).toHaveBeenCalledOnce()
  })

  it('escuta a troca de vozes para usar a voz certa desde o primeiro versículo', () => {
    browserEngine('pt-BR')
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function))
  })
})
