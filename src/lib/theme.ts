import type { Theme } from './storage/types'

export type ResolvedTheme = Exclude<Theme, 'auto'>

/** "auto" segue o modo claro ou escuro do aparelho; as outras opções são escolhas fixas. */
export function resolveTheme(setting: Theme, prefersDark: boolean): ResolvedTheme {
  if (setting === 'auto') return prefersDark ? 'noite' : 'aurora'
  return setting
}

/** Chave lida pelo script do index.html para aplicar o tema antes de o app carregar. */
export const THEME_KEY = 'selah-theme'

/** Guarda a escolha para a próxima abertura. Sem localStorage (bloqueado), só perde o atalho. */
export function rememberTheme(setting: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, setting)
  } catch {
    // O app continua aplicando o tema depois de ler os ajustes.
  }
}
