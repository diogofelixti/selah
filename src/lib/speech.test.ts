import { describe, expect, it } from 'vitest'
import { createChapterSpeaker, pickVoice, speakable, type SpeakerState, type SpeechEngine } from './speech'

function fakeEngine() {
  const spoken: { text: string; rate: number; done: (r: 'end' | 'cancel' | 'error') => void }[] = []
  let cancels = 0
  const engine: SpeechEngine = {
    speak(text, rate, done) {
      spoken.push({ text, rate, done })
    },
    cancel() {
      cancels++
    },
  }
  return { engine, spoken, cancels: () => cancels, last: () => spoken[spoken.length - 1] }
}

const verses = [
  { n: 1, text: 'um' },
  { n: 2, text: '' },
  { n: 3, text: 'três' },
  { n: 4, text: 'quatro' },
]

function setup() {
  const fake = fakeEngine()
  const states: SpeakerState[] = []
  const speaker = createChapterSpeaker(fake.engine, (s) => states.push(s))
  return { ...fake, speaker, states }
}

describe('createChapterSpeaker', () => {
  it('lê em sequência, pula versículos vazios e termina parado', () => {
    const { speaker, spoken, last } = setup()
    speaker.play(verses)
    expect(speaker.state()).toEqual({ status: 'playing', verse: 1, rate: 1 })
    expect(spoken.map((s) => s.text)).toEqual(['um'])
    last().done('end')
    expect(speaker.state().verse).toBe(3)
    last().done('end')
    expect(speaker.state().verse).toBe(4)
    last().done('end')
    expect(speaker.state()).toEqual({ status: 'idle', verse: null, rate: 1 })
    expect(spoken.map((s) => s.text)).toEqual(['um', 'três', 'quatro'])
  })

  it('começa do versículo pedido', () => {
    const { speaker, spoken } = setup()
    speaker.play(verses, 3)
    expect(spoken.map((s) => s.text)).toEqual(['três'])
    expect(speaker.state().verse).toBe(3)
  })

  it('pausar cancela e guarda o versículo; continuar lê o mesmo de novo', () => {
    const { speaker, spoken, cancels } = setup()
    speaker.play(verses, 3)
    speaker.pause()
    expect(cancels()).toBe(1)
    expect(speaker.state()).toEqual({ status: 'paused', verse: 3, rate: 1 })
    speaker.resume()
    expect(spoken.map((s) => s.text)).toEqual(['três', 'três'])
    expect(speaker.state().status).toBe('playing')
  })

  it('ignora o fim atrasado de uma fala cancelada', () => {
    const { speaker, spoken } = setup()
    speaker.play(verses)
    const first = spoken[0]
    speaker.pause()
    first.done('cancel')
    first.done('end')
    expect(speaker.state()).toEqual({ status: 'paused', verse: 1, rate: 1 })
    speaker.resume()
    const second = spoken[1]
    speaker.stop()
    second.done('end')
    expect(speaker.state().status).toBe('idle')
    expect(spoken).toHaveLength(2)
    speaker.play(verses, 4)
    first.done('end')
    expect(speaker.state().verse).toBe(4)
  })

  it('mudar a velocidade recomeça o versículo atual na nova velocidade', () => {
    const { speaker, spoken } = setup()
    speaker.play(verses, 3)
    speaker.setRate(1.25)
    expect(spoken.map((s) => [s.text, s.rate])).toEqual([['três', 1], ['três', 1.25]])
    expect(speaker.state()).toEqual({ status: 'playing', verse: 3, rate: 1.25 })
  })

  it('mudar a velocidade pausado só guarda a velocidade', () => {
    const { speaker, spoken } = setup()
    speaker.play(verses)
    speaker.pause()
    speaker.setRate(0.8)
    expect(spoken).toHaveLength(1)
    speaker.resume()
    expect(spoken[1].rate).toBe(0.8)
  })

  it('erro na fala para a leitura', () => {
    const { speaker, last } = setup()
    speaker.play(verses)
    last().done('error')
    expect(speaker.state().status).toBe('idle')
  })

  it('avisa cada mudança de estado', () => {
    const { speaker, states, last } = setup()
    speaker.play(verses)
    last().done('end')
    speaker.stop()
    expect(states.map((s) => `${s.status}:${s.verse}`)).toEqual(['playing:1', 'playing:3', 'idle:null'])
  })
})

describe('speakable', () => {
  it('tira os colchetes das palavras implícitas', () => {
    expect(speakable('para [que eu saiba] se')).toBe('para que eu saiba se')
  })
})

describe('pickVoice', () => {
  const v = (lang: string, name = lang) => ({ lang, name }) as SpeechSynthesisVoice
  it('prefere o código exato do idioma e aceita outra variante do mesmo idioma', () => {
    expect(pickVoice([v('en-US'), v('pt-PT'), v('pt-BR')], 'pt-BR')?.lang).toBe('pt-BR')
    expect(pickVoice([v('en-US'), v('pt_PT')], 'pt-BR')?.lang).toBe('pt_PT')
    expect(pickVoice([v('en-US')], 'pt-BR')).toBeNull()
  })
})
