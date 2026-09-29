import type { LanguageSetting } from '../i18n/lang'
import { DEFAULT_SETTINGS, DEFAULT_STATE, type AppState, type Reading, type Settings } from './types'

const KEY = 'current'

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

/**
 * Lê só o que a notificação do lembrete precisa, sem nunca criar nem atualizar o banco.
 * Se o banco não existe (o app nunca abriu), cancela a abertura e devolve null.
 */
export async function readForReminder(
  name = 'selah',
): Promise<{ readings: Reading[]; state: AppState; language: LanguageSetting } | null> {
  const db = await new Promise<IDBDatabase | null>((resolve, reject) => {
    const req = indexedDB.open(name)
    // Sem versão, "upgradeneeded" só acontece quando o banco não existe: desfaz para o app criar do jeito certo.
    req.onupgradeneeded = () => req.transaction?.abort()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => (req.error?.name === 'AbortError' ? resolve(null) : reject(req.error))
  })
  if (!db) return null
  try {
    if (!['readings', 'settings', 'state'].every((s) => db.objectStoreNames.contains(s))) return null
    const tx = db.transaction(['readings', 'settings', 'state'], 'readonly')
    const [readings, settings, state] = await Promise.all([
      request(tx.objectStore('readings').getAll() as IDBRequest<Reading[]>),
      request(tx.objectStore('settings').get(KEY) as IDBRequest<Partial<Settings> | undefined>),
      request(tx.objectStore('state').get(KEY) as IDBRequest<Partial<AppState> | undefined>),
    ])
    return {
      readings,
      state: { ...DEFAULT_STATE, ...state },
      language: settings?.language ?? DEFAULT_SETTINGS.language,
    }
  } finally {
    // Não segura o banco: o app pode precisar atualizar a versão.
    db.close()
  }
}
