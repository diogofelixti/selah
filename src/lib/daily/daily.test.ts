import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { DAILY_TEXTS, DAILY_VERSES, dailyVerseText, dayNumber, pickDaily, tipOfTheDay, verseOfTheDay } from './daily'

describe('daily', () => {
  it('conta dias pelo calendário local', () => {
    expect(dayNumber(new Date(2026, 8, 27, 0, 5))).toBe(dayNumber(new Date(2026, 8, 27, 23, 55)))
    expect(dayNumber(new Date(2026, 8, 28, 0, 0)) - dayNumber(new Date(2026, 8, 27, 23, 59))).toBe(1)
  })

  it('escolhe o mesmo item o dia todo e troca no dia seguinte', () => {
    const items = ['a', 'b', 'c']
    const morning = new Date(2026, 8, 27, 7)
    const night = new Date(2026, 8, 27, 22)
    const tomorrow = new Date(2026, 8, 28, 7)
    expect(pickDaily(items, morning)).toBe(pickDaily(items, night))
    expect(pickDaily(items, tomorrow)).not.toBe(pickDaily(items, morning))
  })

  it('versículo e dica do dia vêm das listas', () => {
    const date = new Date(2026, 8, 27)
    expect(DAILY_VERSES).toContain(verseOfTheDay(date))
    expect(tipOfTheDay(date).pt.length).toBeGreaterThan(0)
  })
})

describe('texto embutido do versículo do dia', () => {
  it('cada versículo do dia tem o texto das duas traduções igual ao dos livros', () => {
    for (const tr of ['BLIVRE', 'BSB'] as const) {
      for (const ref of DAILY_VERSES) {
        const [book, chapter, verse] = ref.split('.')
        const file = JSON.parse(readFileSync(`public/bibles/${tr}/${book}.json`, 'utf8'))
        // Se falhar depois de mudar a lista ou os textos: npm run daily-texts
        expect(dailyVerseText(tr, ref), `${tr} ${ref}`).toBe(file.chapters[Number(chapter) - 1][Number(verse) - 1])
      }
    }
  })

  it('não guarda versículos que saíram da lista', () => {
    expect(Object.keys(DAILY_TEXTS.BLIVRE).sort()).toEqual([...DAILY_VERSES].sort())
    expect(Object.keys(DAILY_TEXTS.BSB).sort()).toEqual([...DAILY_VERSES].sort())
  })

  it('devolve undefined para um versículo fora da lista', () => {
    expect(dailyVerseText('BLIVRE', 'GEN.1.1')).toBeUndefined()
  })
})
