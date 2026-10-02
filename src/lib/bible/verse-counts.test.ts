import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { BOOKS } from './books'
import { verseCount } from './verse-counts'

describe('verseCount', () => {
  it('bate com as duas traduções, capítulo a capítulo', () => {
    for (const translation of ['BLIVRE', 'BSB']) {
      for (const book of BOOKS) {
        const file = JSON.parse(readFileSync(`public/bibles/${translation}/${book.id}.json`, 'utf8'))
        const counts = (file.chapters as string[][]).map((c) => c.length)
        expect(counts, `${translation} ${book.id}`).toEqual(
          Array.from({ length: book.chapters }, (_, i) => verseCount(`${book.id}.${i + 1}`)),
        )
      }
    }
  })

  it('conhece capítulos marcantes', () => {
    expect(verseCount('PSA.119')).toBe(176)
    expect(verseCount('PSA.117')).toBe(2)
    expect(verseCount('JHN.3')).toBe(36)
  })
})
