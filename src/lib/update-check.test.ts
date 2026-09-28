import { describe, expect, it, vi } from 'vitest'
import { createUpdateChecker } from './update-check'

describe('createUpdateChecker', () => {
  it('só procura atualização depois do intervalo', () => {
    let now = 0
    const update = vi.fn()
    const check = createUpdateChecker(update, 60_000, () => now)
    check()
    expect(update).toHaveBeenCalledTimes(0)
    now = 60_000
    check()
    expect(update).toHaveBeenCalledTimes(1)
    now = 90_000
    check()
    expect(update).toHaveBeenCalledTimes(1)
    now = 120_000
    check()
    expect(update).toHaveBeenCalledTimes(2)
  })

  it('não quebra quando a checagem falha', () => {
    let now = 0
    const check = createUpdateChecker(() => Promise.reject(new Error('offline')), 1, () => now)
    now = 10
    expect(() => check()).not.toThrow()
  })
})
