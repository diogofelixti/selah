/** O que o navegador entrega quando o app pode ser instalado (Chrome, Edge, Samsung Internet). */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const install = $state({
  /** O navegador ofereceu a instalação direta (o botão abre a janela dele). */
  canPrompt: false,
  /** Aberto pelo ícone (já instalado) ou instalado agora. */
  installed: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
})

let deferred: InstallPromptEvent | null = null

/** Guarda o convite do navegador assim que ele chega (pode ser antes de a tela de Ajustes abrir). */
export function listenInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    deferred = e as InstallPromptEvent
    install.canPrompt = true
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    install.canPrompt = false
    install.installed = true
  })
}

/** Abre a janela de instalação do navegador. true se a pessoa aceitou. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const event = deferred
  // O convite só pode ser usado uma vez.
  deferred = null
  install.canPrompt = false
  await event.prompt()
  const { outcome } = await event.userChoice
  if (outcome === 'accepted') install.installed = true
  return outcome === 'accepted'
}

export const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
