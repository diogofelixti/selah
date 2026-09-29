/** Parte do Google Identity Services que o app usa. */
export interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void
      renderButton(parent: HTMLElement, options: Record<string, string>): void
    }
  }
}

let loading: Promise<GoogleIdentity> | null = null

/** Carrega o script oficial do botão "Entrar com Google" só quando a área de conta aparece. */
export function loadGoogle(): Promise<GoogleIdentity> {
  const existing = (window as unknown as { google?: GoogleIdentity }).google
  if (existing?.accounts?.id) return Promise.resolve(existing)
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      const google = (window as unknown as { google?: GoogleIdentity }).google
      if (google?.accounts?.id) resolve(google)
      else reject(new Error('Google Identity indisponível'))
    }
    script.onerror = () => reject(new Error('sem conexão com o Google'))
    document.head.appendChild(script)
  }).catch((err) => {
    // Falhou (sem internet): a próxima vez tenta carregar de novo.
    loading = null
    throw err
  })
  return loading
}
