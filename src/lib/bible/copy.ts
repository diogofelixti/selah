function stripBrackets(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '$1')
}

/** "1-3, 5". Hífen comum: a regra do app proíbe travessão e meia risca, não hífen. */
function ranges(verses: number[]): string {
  const parts: string[] = []
  let start = verses[0]
  let prev = verses[0]
  for (const v of [...verses.slice(1), Number.NaN]) {
    if (v === prev + 1) {
      prev = v
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = v
    prev = v
  }
  return parts.join(', ')
}

/** Texto para copiar ou compartilhar: versículos em ordem, referência e sigla da tradução no fim. */
export function formatSelection(opts: {
  book: string
  chapter: number
  verses: readonly number[]
  texts: readonly string[]
  bookName: (id: string) => string
  translation: string
}): string {
  const verses = [...new Set(opts.verses)].filter((v) => opts.texts[v - 1]).sort((a, b) => a - b)
  if (verses.length === 0) return ''
  const ref = `${opts.bookName(opts.book)} ${opts.chapter}:${ranges(verses)} (${opts.translation})`
  if (verses.length === 1) return `“${stripBrackets(opts.texts[verses[0] - 1])}” ${ref}`
  const body = verses.map((v) => `${v} ${stripBrackets(opts.texts[v - 1])}`).join(' ')
  return `${body} ${ref}`
}
