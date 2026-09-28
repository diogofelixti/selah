export type Lang = 'pt' | 'en'
export type LanguageSetting = 'auto' | Lang

export function detectLanguage(navLang: string | undefined): Lang {
  return navLang?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function resolveLanguage(setting: LanguageSetting, navLang?: string): Lang {
  return setting === 'auto' ? detectLanguage(navLang) : setting
}
