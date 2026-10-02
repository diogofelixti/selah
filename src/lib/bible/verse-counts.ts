import counts from './verse-counts.json'

const COUNTS: Record<string, number[]> = counts

/** Número de versículos de um capítulo ("PSA.119" → 176). Igual nas duas traduções. */
export function verseCount(ref: string): number {
  const [book, chapter] = ref.split('.')
  const n = COUNTS[book]?.[Number(chapter) - 1]
  if (n === undefined) throw new Error(`Capítulo desconhecido: ${ref}`)
  return n
}
