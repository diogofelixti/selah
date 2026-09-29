import { renderVerseImage, TooLongError } from './verse-image'

/** Compartilha a imagem quando o aparelho aceita arquivos; senão, baixa. Cancelar não é erro. */
export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // O navegador recusou (por exemplo, o toque que autorizou expirou): baixa em vez de falhar.
      if (!(err instanceof DOMException && err.name === 'NotAllowedError')) throw err
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

/**
 * Desenha a imagem do versículo com as cores do tema ativo e compartilha (ou baixa).
 * 'tooLong' quando o trecho não cabe; 'failed' em qualquer outra falha.
 */
export async function shareVerseImage(opts: {
  text: string
  reference: string
  filename: string
}): Promise<'shared' | 'downloaded' | 'cancelled' | 'tooLong' | 'failed'> {
  try {
    const css = getComputedStyle(document.documentElement)
    const color = (name: string) => css.getPropertyValue(name).trim()
    const blob = await renderVerseImage({
      text: opts.text,
      reference: opts.reference,
      colors: { bg: color('--bg'), text: color('--text'), accent: color('--accent-text') },
    })
    return await shareOrDownload(blob, opts.filename)
  } catch (err) {
    return err instanceof TooLongError ? 'tooLong' : 'failed'
  }
}
