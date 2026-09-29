import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

const base = { DATABASE_URL: 'postgres://x', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:c@d' }

describe('loadConfig', () => {
  it('client ID do Google é opcional', () => {
    expect(loadConfig(base).googleClientId).toBeUndefined()
    expect(loadConfig({ ...base, GOOGLE_CLIENT_ID: ' id.apps ' }).googleClientId).toBe('id.apps')
  })

  it('credenciais de teste nunca ligam em produção', () => {
    expect(loadConfig({ ...base, AUTH_TEST: '1' }).authTest).toBe(true)
    expect(loadConfig({ ...base, AUTH_TEST: '1', NODE_ENV: 'production' }).authTest).toBe(false)
    expect(loadConfig(base).authTest).toBe(false)
  })
})
