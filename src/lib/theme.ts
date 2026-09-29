import type { Theme } from './storage/types'

export type ResolvedTheme = Exclude<Theme, 'auto'>

/** "auto" segue o modo claro ou escuro do aparelho; as outras opções são escolhas fixas. */
export function resolveTheme(setting: Theme, prefersDark: boolean): ResolvedTheme {
  if (setting === 'auto') return prefersDark ? 'noite' : 'aurora'
  return setting
}
