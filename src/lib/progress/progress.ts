import { BOOKS, chapterRefs, type BookInfo, type Testament } from '../bible/books'

export interface Reading {
  ref: string
  readAt: number
}

export interface Count {
  read: number
  total: number
}

/** Capítulos com pelo menos uma leitura em readAt >= since. */
export function readSet(readings: readonly Reading[], since = 0): Set<string> {
  const set = new Set<string>()
  for (const r of readings) if (r.readAt >= since) set.add(r.ref)
  return set
}

export function bookProgress(set: Set<string>, book: BookInfo): Count {
  const read = chapterRefs(book.id).filter((ref) => set.has(ref)).length
  return { read, total: book.chapters }
}

function sum(books: readonly BookInfo[], set: Set<string>): Count {
  return books.reduce(
    (acc, b) => {
      const c = bookProgress(set, b)
      return { read: acc.read + c.read, total: acc.total + c.total }
    },
    { read: 0, total: 0 },
  )
}

export function testamentProgress(set: Set<string>, testament: Testament): Count {
  return sum(BOOKS.filter((b) => b.testament === testament), set)
}

export function bibleProgress(set: Set<string>): Count {
  return sum(BOOKS, set)
}

export function percent({ read, total }: Count): number {
  return total === 0 ? 0 : Math.floor((read * 100) / total)
}

export function localDayKey(ts: number): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Quantos dos últimos `windowDays` dias locais (incluindo hoje) tiveram leitura. */
export function daysWithReading(readings: readonly Reading[], now: number, windowDays = 7): number {
  const keys = new Set(readings.map((r) => localDayKey(r.readAt)))
  let count = 0
  for (let i = 0; i < windowDays; i++) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    if (keys.has(localDayKey(day.getTime()))) count++
  }
  return count
}
