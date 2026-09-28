export interface TextPart {
  text: string
  implied: boolean
}

/** A Bíblia Livre marca palavras acrescentadas pelos tradutores com [colchetes]; o leitor mostra em itálico. */
export function splitImplied(text: string): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const m of text.matchAll(/\[([^\]]+)\]/g)) {
    const start = m.index ?? 0
    if (start > last) parts.push({ text: text.slice(last, start), implied: false })
    parts.push({ text: m[1], implied: true })
    last = start + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), implied: false })
  return parts
}
