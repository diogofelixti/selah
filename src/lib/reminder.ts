import type { Lang } from './i18n/lang'

export type ReminderSupport = 'ok' | 'unsupported' | 'ios-install'
export type EnableResult = 'ok' | 'denied' | 'failed'

/** No iPhone, notificações só existem com o app aberto pela Tela de Início (iOS 16.4 ou mais novo). */
export function reminderSupport(env: { userAgent: string; standalone: boolean; hasPush: boolean; touchMac: boolean }): ReminderSupport {
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || env.touchMac
  if (ios && !env.standalone) return 'ios-install'
  return env.hasPush ? 'ok' : 'unsupported'
}

export function currentSupport(): ReminderSupport {
  return reminderSupport({
    userAgent: navigator.userAgent,
    standalone: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    hasPush: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    // iPad novo se apresenta como Mac, mas tem toque.
    touchMac: /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1,
  })
}

/** Chave VAPID (base64url) no formato que o pushManager.subscribe pede. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

const api = (path: string, method: string, body?: unknown) =>
  fetch(`/api${path}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })

async function subscription(create: boolean): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing || !create) return existing
  const res = await api('/push/key', 'GET')
  if (!res.ok) throw new Error('chave indisponível')
  const { key } = (await res.json()) as { key: string }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) })
}

async function register(sub: PushSubscription, time: string, lang: Lang): Promise<boolean> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const res = await api('/reminders', 'PUT', { subscription: sub.toJSON(), time, tz, lang })
  return res.ok
}

/** Pede permissão, inscreve o aparelho e grava a hora no servidor. Também serve para mudar a hora. */
export async function enableReminder(time: string, lang: Lang): Promise<EnableResult> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'
    const sub = await subscription(true)
    return sub && (await register(sub, time, lang)) ? 'ok' : 'failed'
  } catch {
    return 'failed'
  }
}

/** Apaga no servidor e cancela a inscrição. Se o servidor falhar, o push seguinte volta 410 e ele limpa sozinho. */
export async function disableReminder(): Promise<void> {
  try {
    const sub = await subscription(false)
    if (!sub) return
    await api('/reminders', 'DELETE', { endpoint: sub.endpoint }).catch(() => null)
    await sub.unsubscribe()
  } catch {
    // sem service worker ou sem rede: nada a desfazer aqui
  }
}

/**
 * Ao abrir o app com o lembrete ligado: confirma a inscrição e atualiza fuso e idioma no servidor.
 * Devolve false se a permissão foi retirada (o lembrete deve aparecer desligado).
 */
export async function refreshReminder(time: string, lang: Lang): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false
  try {
    const sub = await subscription(true)
    if (sub) await register(sub, time, lang)
  } catch {
    // sem rede agora: tenta na próxima abertura
  }
  return true
}

let reportedDay: string | null = null

/** Avisa o servidor que hoje já houve leitura (só a data), no máximo uma vez por dia. */
export async function reportReadToday(day: string, time: string, lang: Lang): Promise<void> {
  if (reportedDay === day) return
  reportedDay = day
  try {
    const sub = await subscription(false)
    if (!sub) return
    const res = await api('/reminders/done', 'POST', { endpoint: sub.endpoint, date: day })
    // O servidor não conhece este aparelho (banco novo, inscrição apagada): registra de novo e repete.
    if (res.status === 404 && (await register(sub, time, lang))) await api('/reminders/done', 'POST', { endpoint: sub.endpoint, date: day })
    else if (!res.ok) reportedDay = null
  } catch {
    reportedDay = null
  }
}
