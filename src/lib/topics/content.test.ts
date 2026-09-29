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

  it('tem de 10 a 15 dicas nos dois idiomas', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(10)
    expect(TIPS.length).toBeLessThanOrEqual(15)
    for (const tip of TIPS) expect(tip.pt.trim() && tip.en.trim()).toBeTruthy()
  })
})
