import { describe, expect, it } from 'vitest'
import { app, initApp, markRead, updateSettings } from './app.svelte'
import { createMemoryRepository } from './storage/repository'
import type { Repository } from './storage/types'

const fail = () => Promise.reject(new DOMException('cheio', 'QuotaExceededError'))

describe('app', () => {
  it('abre com memória quando ler o banco falha, em vez de ficar em branco', async () => {
    const broken: Repository = { ...createMemoryRepository(), persistent: true, getReadings: fail }
    let opened = 0
    await initApp(async () => {
      opened++
      return broken
    })
    expect(opened).toBe(1)
    expect(app.ready).toBe(true)
    expect(app.persistent).toBe(false)
    await markRead('JHN.2')
    expect(app.readings.map((r) => r.ref)).toEqual(['JHN.2'])
  })

  it('avisa quando não consegue salvar e não finge que salvou', async () => {
    const broken: Repository = { ...createMemoryRepository(), persistent: true, addReading: fail, saveSettings: fail }
    await initApp(async () => broken)
    await markRead('JHN.1')
    expect(app.readings).toEqual([])
    expect(app.saveError).toBe(true)
    app.saveError = false
    await updateSettings({ fontSize: 4 })
    expect(app.settings.fontSize).toBe(2)
    expect(app.saveError).toBe(true)
  })
})
