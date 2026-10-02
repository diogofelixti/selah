import dailyVerses from '../../content/daily-verses.json'
import dailyTexts from '../../content/daily-verse-texts.json'
import tips from '../../content/tips.json'
import type { TranslationId } from '../bible/types'
import type { Localized } from '../topics/topics'

export const DAILY_VERSES: readonly string[] = dailyVerses
/** Gerado por `npm run daily-texts`; um teste confere com os livros. */
export const DAILY_TEXTS: Record<TranslationId, Record<string, string>> = dailyTexts
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

/** Texto embutido do versículo do dia, para não esperar o livro baixar. */
export function dailyVerseText(tr: TranslationId, ref: string): string | undefined {
  return DAILY_TEXTS[tr][ref]
}

export function tipOfTheDay(date: Date): Localized {
  return pickDaily(TIPS, date)
}
