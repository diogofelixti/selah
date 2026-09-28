/** Um aviso curto por vez para o app inteiro. Um aviso novo substitui o anterior. */
export const toast = $state({ message: null as string | null })

let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(message: string, ms = 2000): void {
  toast.message = message
  clearTimeout(timer)
  timer = setTimeout(() => (toast.message = null), ms)
}
