/** Largura em px de um texto num tamanho de fonte. */
export type Measure = (text: string, fontSize: number) => number

function wrap(words: string[], size: number, width: number, measure: Measure): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || measure(candidate, size) <= width) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Escolhe o maior tamanho de fonte (de maxSize até minSize) em que o texto, quebrado por palavras,
 * cabe na largura e na altura. null quando nem o menor cabe. Uma palavra mais larga que a linha
 * fica sozinha na sua linha (nunca trava).
 */
export function layoutVerseImage(
  text: string,
  measure: Measure,
  opts: { width?: number; maxHeight?: number; maxSize?: number; minSize?: number; lineHeight?: number } = {},
): { fontSize: number; lines: string[] } | null {
  const { width = 900, maxHeight = 760, maxSize = 64, minSize = 36, lineHeight = 1.4 } = opts
  const words = text.split(/\s+/).filter(Boolean)
  for (let size = maxSize; size >= minSize; size -= 2) {
    const lines = wrap(words, size, width, measure)
    if (lines.length * size * lineHeight <= maxHeight) return { fontSize: size, lines }
  }
  return null
}

/** "selah-joao-3-16.png" / "selah-joao-3-16-18.png". */
export function imageFilename(book: string, chapter: number, verses: number[], bookName: (id: string) => string): string {
  const slug = bookName(book)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const sorted = [...new Set(verses)].sort((a, b) => a - b)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return `selah-${slug}-${chapter}-${first === last ? first : `${first}-${last}`}.png`
}
