import { describe, expect, it } from 'vitest'
import { base64UrlToBytes, reminderSupport } from './reminder'

const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/130 Mobile'
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1'
const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'

describe('reminderSupport', () => {
  it('Android com push: ok', () => {
    expect(reminderSupport({ userAgent: android, standalone: false, hasPush: true, touchMac: false })).toBe('ok')
  })
  it('iPhone no Safari (fora da Tela de Início): pede para instalar', () => {
    expect(reminderSupport({ userAgent: iphone, standalone: false, hasPush: false, touchMac: false })).toBe('ios-install')
  })
  it('iPad que se apresenta como Mac também pede para instalar', () => {
    expect(reminderSupport({ userAgent: mac, standalone: false, hasPush: true, touchMac: true })).toBe('ios-install')
  })
  it('iPhone aberto pela Tela de Início: ok', () => {
    expect(reminderSupport({ userAgent: iphone, standalone: true, hasPush: true, touchMac: false })).toBe('ok')
  })
  it('navegador sem push: sem suporte', () => {
    expect(reminderSupport({ userAgent: android, standalone: false, hasPush: false, touchMac: false })).toBe('unsupported')
  })
})

describe('base64UrlToBytes', () => {
  it('converte base64url sem preenchimento', () => {
    // "hi?" em base64 é "aGk/", em base64url "aGk_"
    expect([...base64UrlToBytes('aGk_')]).toEqual([104, 105, 63])
    expect([...base64UrlToBytes('aGk')]).toEqual([104, 105])
  })
})
