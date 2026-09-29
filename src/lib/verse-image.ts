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
  // Quebra só em espaços comuns: o espaço não separável mantém o número junto do versículo.
  const words = text.split(/[^\S ]+/).filter(Boolean)
  for (let size = maxSize; size >= minSize; size -= 2) {
    const lines = wrap(words, size, width, measure)
    // Palavra mais larga que a linha só é aceita no menor tamanho.
    const fitsWidth = size === minSize || lines.every((l) => measure(l, size) <= width)
    if (fitsWidth && lines.length * size * lineHeight <= maxHeight) return { fontSize: size, lines }
  }
  return null
}

/** Tamanho da referência do rodapé (de maxSize até minSize) que cabe na largura. null se nem o menor cabe. */
export function fitReference(
  reference: string,
  measure: Measure,
  opts: { width?: number; maxSize?: number; minSize?: number } = {},
): number | null {
  const { width = 900, maxSize = 40, minSize = 24 } = opts
  for (let size = maxSize; size >= minSize; size -= 2) {
    if (measure(reference, size) <= width) return size
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
const TEXT_AREA = { width: 900, maxHeight: 900 }
const family = '"Lora Variable", Georgia, serif'

/** O trecho (texto ou referência) não cabe na imagem. */
export class TooLongError extends Error {}

let measureCtx: CanvasRenderingContext2D | null = null

/** Medidas do texto (normal) e da referência (600), com a fonte carregada, num canvas de 1 × 1 reaproveitado. */
async function measurers(): Promise<{ text: Measure; reference: Measure }> {
  // A imagem só sai com a fonte do app se ela já estiver carregada.
  await Promise.all([document.fonts.load(`64px ${family}`), document.fonts.load(`600 40px ${family}`)])
  if (!measureCtx) {
    const small = document.createElement('canvas')
    small.width = 1
    small.height = 1
    measureCtx = small.getContext('2d')
    if (!measureCtx) throw new Error('canvas indisponível')
  }
  const ctx = measureCtx
  const make =
    (weight: string): Measure =>
    (text, size) => {
      ctx.font = `${weight}${size}px ${family}`
      return ctx.measureText(text).width
    }
  return { text: make(''), reference: make('600 ') }
}

async function layout(text: string, reference: string) {
  const measure = await measurers()
  const body = layoutVerseImage(text, measure.text, TEXT_AREA)
  const refSize = fitReference(reference, measure.reference, { width: TEXT_AREA.width })
  return body && refSize !== null ? { body, refSize } : null
}

/** true se o texto e a referência cabem na imagem. */
export async function fitsVerseImage(text: string, reference: string): Promise<boolean> {
  return (await layout(text, reference)) !== null
}

/**
 * Desenha a imagem do versículo (1080 × 1350) com as cores do tema e devolve um PNG.
 * Lança TooLongError quando não cabe; outros erros são falhas do navegador.
 */
export async function renderVerseImage(opts: {
  text: string
  reference: string
  colors: { bg: string; text: string; accent: string }
}): Promise<Blob> {
  const fitted = await layout(opts.text, opts.reference)
  if (!fitted) throw new TooLongError()
  const { body, refSize } = fitted
  const canvas = document.createElement('canvas')
  canvas.width = SIZE.width
  canvas.height = SIZE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')

  ctx.fillStyle = opts.colors.bg
  ctx.fillRect(0, 0, SIZE.width, SIZE.height)

  // Aspas decorativas no topo.
  ctx.fillStyle = opts.colors.accent
  ctx.font = `160px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('“', SIZE.width / 2, 200)

  // Texto centralizado verticalmente na área útil.
  const lineHeight = body.fontSize * 1.4
  const blockHeight = body.lines.length * lineHeight
  const top = 240 + (TEXT_AREA.maxHeight - blockHeight) / 2
  ctx.fillStyle = opts.colors.text
  ctx.font = `${body.fontSize}px ${family}`
  ctx.textBaseline = 'middle'
  body.lines.forEach((line, i) => ctx.fillText(line, SIZE.width / 2, top + i * lineHeight + lineHeight / 2))

  // Rodapé: referência (no tamanho que couber) e marca.
  ctx.font = `600 ${refSize}px ${family}`
  ctx.fillStyle = opts.colors.text
  ctx.fillText(opts.reference, SIZE.width / 2, 1200, TEXT_AREA.width)
  ctx.font = `32px ${family}`
  ctx.fillStyle = opts.colors.accent
  ctx.fillText('Selah', SIZE.width / 2, 1270)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
  // Libera a memória do canvas grande (Safari limita o total de canvas).
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('não foi possível gerar a imagem')
  return blob
}
