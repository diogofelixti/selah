import { mergeSync, type SyncDoc } from '../../../server/src/sync-doc'
import { app, applySyncResult } from '../app.svelte'
import { applyDoc, buildDoc } from './local-doc'

const TOKEN_KEY = 'selah-session'
const ACCOUNT_KEY = 'selah-account'

export const account = $state({
  /** Login disponível? 'off' sem client ID no servidor; 'unreachable' sem conexão com a API. */
  config: 'loading' as 'loading' | 'on' | 'off' | 'unreachable',
  clientId: null as string | null,
  token: null as string | null,
  email: null as string | null,
  /** 'expired': o servidor recusou a sessão e o app saiu da conta. */
  status: 'idle' as 'idle' | 'syncing' | 'error' | 'expired',
  lastSyncAt: null as number | null,
})

let fetchImpl: typeof fetch = (...args) => fetch(...args)
/** Troca o fetch (testes). */
export function setFetch(f: typeof fetch): void {
  fetchImpl = f
}

// localStorage pode não existir (testes) ou lançar (navegação privada, dados bloqueados).
const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string | null): void {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch {
      // a sessão vale só enquanto o app estiver aberto
    }
  },
}

function persist(): void {
  storage.set(TOKEN_KEY, account.token)
  storage.set(ACCOUNT_KEY, account.token ? JSON.stringify({ email: account.email, lastSyncAt: account.lastSyncAt }) : null)
}

/** Recupera a sessão guardada no aparelho. */
export function restoreSession(): void {
  account.token = storage.get(TOKEN_KEY)
  if (!account.token) return
  try {
    const saved = JSON.parse(storage.get(ACCOUNT_KEY) ?? '{}') as { email?: string; lastSyncAt?: number }
    account.email = saved.email ?? null
    account.lastSyncAt = saved.lastSyncAt ?? null
  } catch {
    // dados antigos ilegíveis: fica só o token
  }
}

function api(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (account.token) headers.authorization = `Bearer ${account.token}`
  return fetchImpl(`/api${path}`, { ...init, headers })
}

function forget(status: typeof account.status = 'idle'): void {
  account.token = null
  account.email = null
  account.lastSyncAt = null
  account.status = status
  persist()
}

/** Pergunta ao servidor se o login está ligado (client ID configurado). */
export async function loadAccountConfig(): Promise<void> {
  try {
    const res = await api('/auth/config')
    const { googleClientId } = (await res.json()) as { googleClientId: string | null }
    account.clientId = googleClientId
    account.config = googleClientId ? 'on' : 'off'
  } catch {
    account.config = 'unreachable'
  }
}

/** Recebe o token de identidade do botão do Google, cria a sessão e já sincroniza. */
export async function signInWithCredential(credential: string): Promise<boolean> {
  try {
    const res = await api('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) })
    if (!res.ok) return false
    const { token, email } = (await res.json()) as { token: string; email: string }
    account.token = token
    account.email = email
    account.status = 'idle'
    persist()
  } catch {
    return false
  }
  await syncNow()
  return true
}

/** Sai da conta: apaga a sessão no servidor (se der) e no aparelho. Os dados continuam no aparelho. */
export async function signOut(): Promise<void> {
  if (account.token) await api('/auth/logout', { method: 'POST' }).catch(() => null)
  forget()
}

/** Exclui a conta e os dados sincronizados no servidor. Os dados continuam no aparelho. */
export async function deleteAccount(): Promise<boolean> {
  try {
    const res = await api('/account', { method: 'DELETE' })
    if (!res.ok && res.status !== 401) return false
  } catch {
    return false
  }
  forget()
  return true
}

let running: Promise<void> | null = null
let again = false

/** Sincroniza agora. Uma de cada vez: um pedido durante outro roda logo depois. */
export async function syncNow(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await syncOnce()
    } while (again && account.token)
  })()
  try {
    await running
  } finally {
    running = null
  }
}

async function syncOnce(): Promise<void> {
  if (!account.token || !app.ready) return
  account.status = 'syncing'
  const changesAtStart = app.changes
  let merged: SyncDoc
  try {
    const res = await api('/sync', { method: 'POST', body: JSON.stringify(buildDoc($state.snapshot(app), $state.snapshot(app.syncMeta))) })
    if (res.status === 401) return forget('expired')
    if (!res.ok) {
      account.status = 'error'
      return
    }
    merged = (await res.json()) as SyncDoc
  } catch {
    account.status = 'error'
    return
  }
  // Junta de novo com o aparelho agora: o que mudou durante o pedido continua valendo.
  const local = buildDoc($state.snapshot(app), $state.snapshot(app.syncMeta))
  const final = mergeSync(merged, local)
  if (JSON.stringify(final) !== JSON.stringify(mergeSync(local, local))) {
    const out = applyDoc(final, $state.snapshot(app.state), $state.snapshot(app.syncMeta))
    if (!(await applySyncResult({ readings: out.readings, marks: out.marks, state: out.state }, out.meta))) {
      account.status = 'error'
      return
    }
  }
  account.lastSyncAt = Date.now()
  account.status = 'idle'
  persist()
  // Mudou algo durante o pedido: envia de novo para a conta ficar em dia.
  if (app.changes !== changesAtStart) again = true
}
