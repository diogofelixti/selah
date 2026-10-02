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

  it('não usa versículos com erro na Bíblia Livre nem que começam no meio da frase', () => {
    // Provérbios 3:6: "todas os teus caminhos". Mateus 28:20 e Efésios 4:2 começam no meio da frase.
    for (const ref of ['PRO.3.6', 'MAT.28.20', 'EPH.4.2']) expect(allRefs, ref).not.toContain(ref)
  })

  it('Família abre com Rute 1:16 e deixa Josué 24:15 para o fim', () => {
    const refs = TOPICS.find((t) => t.id === 'familia')!.refs
    expect(refs[0]).toBe('RUT.1.16')
    expect(refs.at(-1)).toBe('JOS.24.15')
    expect(refs).toContain('PSA.127.1')
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
