export interface SpeechEngine {
  speak(text: string, rate: number, done: (result: 'end' | 'cancel' | 'error') => void): void
  cancel(): void
}

export type SpeakerState = { status: 'idle' | 'playing' | 'paused'; verse: number | null; rate: number }

export const SPEECH_RATES = [0.8, 1, 1.25] as const

/** Texto que vai para a voz: sem os colchetes das palavras implícitas. */
export function speakable(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '$1')
}

/**
 * Lê um capítulo versículo por versículo. Pausar cancela a fala e guarda o versículo; continuar
 * recomeça nele (o pause nativo não é confiável no Android). Cada fala tem um número: o fim
 * atrasado de uma fala já cancelada é ignorado.
 */
export function createChapterSpeaker(engine: SpeechEngine, onChange: (s: SpeakerState) => void) {
  let list: { n: number; text: string }[] = []
  let index = -1
  let status: SpeakerState['status'] = 'idle'
  let rate = 1
  let token = 0

  function state(): SpeakerState {
    return { status, verse: status === 'idle' ? null : (list[index]?.n ?? null), rate }
  }

  const emit = () => onChange(state())

  function nextIndex(from: number): number {
    for (let i = from; i < list.length; i++) if (list[i].text.trim()) return i
    return -1
  }

  function speakCurrent() {
    const mine = ++token
    engine.speak(speakable(list[index].text), rate, (result) => {
      if (mine !== token || status !== 'playing') return
      if (result === 'end') advance()
      else if (result === 'error') finish()
    })
  }

  function advance() {
    const i = nextIndex(index + 1)
    if (i < 0) return finish()
    index = i
    emit()
    speakCurrent()
  }

  function finish() {
    token++
    status = 'idle'
    index = -1
    emit()
  }

  return {
    state,
    play(verses: { n: number; text: string }[], from = 1) {
      if (status !== 'idle') engine.cancel()
      token++
      list = verses
      const start = list.findIndex((v) => v.n >= from && v.text.trim())
      if (start < 0) return finish()
      index = start
      status = 'playing'
      emit()
      speakCurrent()
    },
    pause() {
      if (status !== 'playing') return
      token++
      status = 'paused'
      engine.cancel()
      emit()
    },
    resume() {
      if (status !== 'paused') return
      status = 'playing'
      emit()
      speakCurrent()
    },
    stop() {
      if (status === 'idle') return
      if (status === 'playing') engine.cancel()
      finish()
    },
    setRate(next: number) {
      rate = next
      if (status === 'playing') {
        token++
        engine.cancel()
        speakCurrent()
      }
      emit()
    },
  }
}

export function pickVoice(voices: readonly SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const norm = (s: string) => s.replace('_', '-').toLowerCase()
  const want = norm(lang)
  return (
    voices.find((v) => norm(v.lang) === want) ??
    voices.find((v) => norm(v.lang).startsWith(want.slice(0, 2))) ??
    null
  )
}

/** Motor do navegador. null quando não há síntese de voz. */
export function browserEngine(lang: string): SpeechEngine | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return null
  }
  const synth = window.speechSynthesis
  return {
    speak(text, rate, done) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      const voice = pickVoice(synth.getVoices(), lang)
      if (voice) utterance.voice = voice
      let finished = false
      const finish = (result: 'end' | 'cancel' | 'error') => {
        if (finished) return
        finished = true
        done(result)
      }
      utterance.onend = () => finish('end')
      utterance.onerror = (e) => finish(e.error === 'interrupted' || e.error === 'canceled' ? 'cancel' : 'error')
      synth.speak(utterance)
    },
    cancel() {
      synth.cancel()
    },
  }
}
