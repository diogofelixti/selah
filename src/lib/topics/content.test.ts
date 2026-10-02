import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { BookText, TranslationId } from '../bible/types'
import { parseRef } from '../bible/refs'
import { DAILY_VERSES, TIPS } from '../daily/daily'
import { TOPICS, TOPIC_ICONS } from './topics'

const books = new Map<string, BookText>()
function verseText(tr: TranslationId, ref: string): string | undefined {
  const p = parseRef(ref)
  if (!p || p.verse === undefined) return undefined
  const key = `${tr}/${p.book}`
  if (!books.has(key)) books.set(key, JSON.parse(readFileSync(`public/bibles/${key}.json`, 'utf8')))
  return books.get(key)!.chapters[p.chapter - 1]?.[p.verse - 1]
}

const allRefs = [...TOPICS.flatMap((t) => t.refs), ...DAILY_VERSES]

describe('conteúdo editorial', () => {
  it.each(allRefs)('%s existe e não está vazio nas duas traduções', (ref) => {
    expect(verseText('BLIVRE', ref), 'BLIVRE').toBeTruthy()
    expect(verseText('BSB', ref), 'BSB').toBeTruthy()
  })

  it('temas têm id único, ícone conhecido, textos nos dois idiomas e de 6 a 10 versículos', () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length)
    expect(TOPICS).toHaveLength(16)
    for (const topic of TOPICS) {
      expect(TOPIC_ICONS).toContain(topic.icon)
      for (const text of [topic.title.pt, topic.title.en, topic.intro.pt, topic.intro.en]) expect(text.trim()).not.toBe('')
      expect(topic.refs.length).toBeGreaterThanOrEqual(6)
      expect(topic.refs.length).toBeLessThanOrEqual(10)
    }
  })

  it('um versículo não se repete entre temas', () => {
    const refs = TOPICS.flatMap((t) => t.refs)
    expect(refs.filter((r, i) => refs.indexOf(r) !== i)).toEqual([])
  })

  it('introduções não começam com as mesmas palavras', () => {
    for (const lang of ['pt', 'en'] as const) {
      const starts = TOPICS.map((t) => t.intro[lang].split(/\s+/).slice(0, 4).join(' ').toLowerCase())
      expect(starts.filter((s, i) => starts.indexOf(s) !== i), lang).toEqual([])
    }
  })

  it('não usa versículos com erro na Bíblia Livre, com título de salmo pesado ou cortados', () => {
    const avoid = {
      'PRO.3.6': '"todas os teus caminhos"',
      'PSA.34.18': '"sava os aflitos"',
      'ISA.43.2': '"nem a chamas arderão"',
      'JOS.24.15': '"aos deuses a os quais"',
      'ISA.1.18': '"as contas,diz"',
      'PSA.9.1': 'título "em Mute-Laben"',
      'PSA.46.1': 'título "Cântico sobre Alamote"',
      'PSA.119.105': 'letra hebraica "[Nun]:"',
      'MAT.28.20': 'começa no meio da frase',
      'EPH.4.2': 'começa no meio da frase',
      'HEB.6.19': 'termina no meio da frase',
    }
    for (const [ref, why] of Object.entries(avoid)) expect(allRefs, `${ref}: ${why}`).not.toContain(ref)
  })

  // Um versículo cortado só entra junto com o vizinho que completa a frase (como Filipenses 4:6 e 4:7).
  const next = (ref: string) => ref.replace(/\.(\d+)$/, (_, v) => `.${Number(v) + 1}`)
  const prev = (ref: string) => ref.replace(/\.(\d+)$/, (_, v) => `.${Number(v) - 1}`)
  const startsMidSentence = (ref: string) => /^[a-zà-ú]/.test(verseText('BLIVRE', ref)!)
  const endsMidSentence = (ref: string) => /,$/.test(verseText('BLIVRE', ref)!.trim())

  it.each(TOPICS.map((t) => [t.id, t.refs] as const))('%s: versículo cortado vem junto do vizinho', (_, refs) => {
    refs.forEach((ref, i) => {
      if (startsMidSentence(ref)) expect(refs[i - 1], ref).toBe(prev(ref))
      if (endsMidSentence(ref)) expect(refs[i + 1], ref).toBe(next(ref))
    })
  })

  it('o versículo do dia é uma frase inteira, porque aparece sozinho', () => {
    for (const ref of DAILY_VERSES) {
      expect(startsMidSentence(ref), ref).toBe(false)
      expect(endsMidSentence(ref), ref).toBe(false)
    }
  })

  it('Família abre com Rute 1:16 e Dor abre com Salmos 147:3', () => {
    expect(TOPICS.find((t) => t.id === 'familia')!.refs[0]).toBe('RUT.1.16')
    expect(TOPICS.find((t) => t.id === 'familia')!.refs).toContain('PSA.127.1')
    expect(TOPICS.find((t) => t.id === 'dor')!.refs[0]).toBe('PSA.147.3')
  })

  it('as trocas da revisão de curadoria', () => {
    expect(TOPICS.find((t) => t.id === 'solidao')!.refs).toContain('PSA.27.10')
    expect(TOPICS.find((t) => t.id === 'sabedoria')!.refs).toContain('PSA.143.8')
    expect(DAILY_VERSES).toContain('PRO.16.3')
  })

  it('Cansaço abre com o convite aos cansados (Mateus 11:28)', () => {
    expect(TOPICS.find((t) => t.id === 'cansaco')!.refs[0]).toBe('MAT.11.28')
  })

  it('tem de 10 a 15 dicas nos dois idiomas', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(10)
    expect(TIPS.length).toBeLessThanOrEqual(15)
    for (const tip of TIPS) expect(tip.pt.trim() && tip.en.trim()).toBeTruthy()
  })
})
