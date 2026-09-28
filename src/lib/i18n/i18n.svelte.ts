import en from '../../i18n/en.json'
import pt from '../../i18n/pt.json'
import type { Lang } from './lang'
import { translate, type Dict } from './translate'

const DICTS: Record<Lang, Dict> = { pt, en }

export const locale = $state({ lang: 'pt' as Lang })

/** Lê locale.lang, então qualquer template que chama t() atualiza ao trocar o idioma. */
export function t(key: string, params?: Record<string, string | number>): string {
  return translate(DICTS[locale.lang], key, params)
}
