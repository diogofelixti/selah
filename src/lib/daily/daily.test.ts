import { describe, expect, it } from 'vitest'
import { DAILY_VERSES, dayNumber, pickDaily, tipOfTheDay, verseOfTheDay } from './daily'

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
