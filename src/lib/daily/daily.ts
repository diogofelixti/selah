import dailyVerses from '../../content/daily-verses.json'
import tips from '../../content/tips.json'
import type { Localized } from '../topics/topics'

export const DAILY_VERSES: readonly string[] = dailyVerses
export const TIPS: readonly Localized[] = tips

/** Número do dia no calendário local; muda à meia-noite local. */
export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

export function pickDaily<T>(items: readonly T[], date: Date): T {
  return items[dayNumber(date) % items.length]
}

export function verseOfTheDay(date: Date): string {
  return pickDaily(DAILY_VERSES, date)
}

export function tipOfTheDay(date: Date): Localized {
  return pickDaily(TIPS, date)
}
