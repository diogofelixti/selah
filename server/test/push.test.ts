import { describe, expect, it } from 'vitest'
import { makeSend } from '../src/push.js'

describe('makeSend', () => {
  it('envia com prazo de rede, validade de 30 minutos e urgência normal', async () => {
    const calls: unknown[][] = []
    const send = makeSend({ sendNotification: async (...args: unknown[]) => void calls.push(args) })
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'p', auth: 'a' } }
    await send(sub, '{"type":"reminder"}')
    expect(calls).toEqual([[sub, '{"type":"reminder"}', { TTL: 1800, urgency: 'normal', timeout: 10_000 }]])
  })
})
