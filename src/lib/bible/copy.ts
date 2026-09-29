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

type SelectionOpts = {
  book: string
  chapter: number
  verses: readonly number[]
  texts: readonly string[]
  bookName: (id: string) => string
}

/** Corpo (com números quando há vários versículos) e referência da seleção. null sem versículos com texto. */
export function selectionParts(
  opts: SelectionOpts,
): { body: string; imageBody: string; reference: string; verses: number[] } | null {
  const verses = [...new Set(opts.verses)].filter((v) => opts.texts[v - 1]).sort((a, b) => a - b)
  if (verses.length === 0) return null
  const reference = `${opts.bookName(opts.book)} ${opts.chapter}:${ranges(verses)}`
  const body =
    verses.length === 1
      ? stripBrackets(opts.texts[verses[0] - 1])
      : verses.map((v) => `${v} ${stripBrackets(opts.texts[v - 1])}`).join(' ')
  // Na imagem, o número fica preso à primeira palavra (espaço não separável) e não sobra sozinho no fim da linha.
  const imageBody =
    verses.length === 1 ? body : verses.map((v) => `${v} ${stripBrackets(opts.texts[v - 1])}`).join(' ')
  return { body, imageBody, reference, verses }
}

/** Texto para copiar ou compartilhar: versículos em ordem, referência e sigla da tradução no fim. */
export function formatSelection(opts: SelectionOpts & { translation: string }): string {
  const parts = selectionParts(opts)
  if (!parts) return ''
  const ref = `${parts.reference} (${opts.translation})`
  return parts.verses.length === 1 ? `“${parts.body}” ${ref}` : `${parts.body} ${ref}`
}
