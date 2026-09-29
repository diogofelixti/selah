import type { Send } from './scheduler.js'

interface PushLib {
  sendNotification(sub: unknown, payload: string, options: unknown): Promise<unknown>
}

/**
 * Envio pelo web-push com prazo de rede: sem ele, uma conexão travada prende o agendador para sempre.
 * Lembrete velho não serve: se o aparelho ficar desligado por mais de 30 minutos, o push expira.
 */
export function makeSend(lib: PushLib): Send {
  return async (sub, payload) => {
    await lib.sendNotification(sub, payload, { TTL: 30 * 60, urgency: 'normal', timeout: 10_000 })
  }
}
