function legacyCopy(text: string): boolean {
  const previous = document.activeElement as HTMLElement | null
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  // O Safari do iPhone só copia com a seleção explícita do texto inteiro.
  area.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
    previous?.focus?.()
  }
}

/** Copia texto. Sem HTTPS o navegador não oferece navigator.clipboard, então cai no método antigo. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permissão negada: tenta o método antigo.
    }
  }
  return legacyCopy(text)
}
