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

const SIZE = { width: 1080, height: 1350 }

/**
 * Desenha a imagem do versículo (1080 × 1350) com as cores do tema e devolve um PNG.
 * null quando o texto não cabe nem no menor tamanho de fonte.
 */
export async function renderVerseImage(opts: {
  text: string
  reference: string
  colors: { bg: string; text: string; accent: string }
}): Promise<Blob | null> {
  const family = '"Lora Variable", Georgia, serif'
  // A imagem só sai com a fonte do app se ela já estiver carregada.
  await Promise.all([document.fonts.load(`64px ${family}`), document.fonts.load(`600 40px ${family}`)])
  const canvas = document.createElement('canvas')
  canvas.width = SIZE.width
  canvas.height = SIZE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const measure: Measure = (text, size) => {
    ctx.font = `${size}px ${family}`
    return ctx.measureText(text).width
  }
  const layout = layoutVerseImage(opts.text, measure, { width: 900, maxHeight: 900 })
  if (!layout) return null

  ctx.fillStyle = opts.colors.bg
  ctx.fillRect(0, 0, SIZE.width, SIZE.height)

  // Aspas decorativas no topo.
  ctx.fillStyle = opts.colors.accent
  ctx.font = `160px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('“', SIZE.width / 2, 200)

  // Texto centralizado verticalmente na área útil.
  const lineHeight = layout.fontSize * 1.4
  const blockHeight = layout.lines.length * lineHeight
  const top = 240 + (900 - blockHeight) / 2
  ctx.fillStyle = opts.colors.text
  ctx.font = `${layout.fontSize}px ${family}`
  ctx.textBaseline = 'middle'
  layout.lines.forEach((line, i) => ctx.fillText(line, SIZE.width / 2, top + i * lineHeight + lineHeight / 2))

  // Rodapé: referência e marca.
  ctx.font = `600 40px ${family}`
  ctx.fillStyle = opts.colors.text
  ctx.fillText(opts.reference, SIZE.width / 2, 1200)
  ctx.font = `32px ${family}`
  ctx.fillStyle = opts.colors.accent
  ctx.fillText('Selah', SIZE.width / 2, 1270)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
