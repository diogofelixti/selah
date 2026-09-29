import { describe, expect, it } from 'vitest'
import { app, initApp, markMany, markRead, setMarks, unmarkMany, unmarkRead, updateSettings, updateState } from './app.svelte'
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

describe('ações em lote', () => {
  it('marca e desmarca vários capítulos de uma vez', async () => {
    await initApp(async () => createMemoryRepository())
    await markMany(['RUT.1', 'RUT.2'])
    expect(app.readings.map((r) => r.ref)).toEqual(['RUT.1', 'RUT.2'])
    await unmarkMany(['RUT.1'])
    expect(app.readings.map((r) => r.ref)).toEqual(['RUT.2'])
  })

  it('não muda a tela se a gravação do lote falhar', async () => {
    const broken: Repository = { ...createMemoryRepository(), addReadings: fail, removeReadingsForMany: fail }
    await initApp(async () => broken)
    await markMany(['RUT.1', 'RUT.2'])
    expect(app.readings).toEqual([])
    expect(app.saveError).toBe(true)
    app.saveError = false
    await unmarkMany(['RUT.1'])
    expect(app.saveError).toBe(true)
  })
})

describe('toques repetidos', () => {
  it('ignora marcar de novo um capítulo que ainda está sendo gravado', async () => {
    await initApp(async () => createMemoryRepository())
    await Promise.all([markRead('RUT.1'), markRead('RUT.1')])
    expect(app.readings.map((r) => r.ref)).toEqual(['RUT.1'])
  })

  it('não duplica leituras quando o mesmo lote é disparado duas vezes', async () => {
    await initApp(async () => createMemoryRepository())
    await Promise.all([markMany(['RUT.1', 'RUT.2']), markMany(['RUT.1', 'RUT.2'])])
    expect(app.readings.map((r) => r.ref).sort()).toEqual(['RUT.1', 'RUT.2'])
  })
})

describe('marcações', () => {
  it('pinta vários versículos, anota um e apaga ao zerar cor e nota', async () => {
    await initApp(async () => createMemoryRepository())
    await setMarks(['JHN.3.16', 'JHN.3.17'], { color: 'green' })
    expect(app.marks.map((m) => [m.ref, m.color]).sort()).toEqual([['JHN.3.16', 'green'], ['JHN.3.17', 'green']])
    await setMarks(['JHN.3.16'], { note: 'amor' })
    expect(app.marks.find((m) => m.ref === 'JHN.3.16')).toMatchObject({ color: 'green', note: 'amor' })
    await setMarks(['JHN.3.17'], { color: null })
    expect(app.marks.map((m) => m.ref)).toEqual(['JHN.3.16'])
    await setMarks(['JHN.3.16'], { color: null, note: '' })
    expect(app.marks).toEqual([])
  })

  it('não muda a tela se a gravação falhar', async () => {
    const broken: Repository = { ...createMemoryRepository(), saveMarks: fail }
    await initApp(async () => broken)
    await setMarks(['JHN.3.16'], { color: 'gold' })
    expect(app.marks).toEqual([])
    expect(app.saveError).toBe(true)
  })
})

describe('registro para a sincronização', () => {
  it('desmarcar, remover marca e mudar plano ou posição ficam registrados com a data', async () => {
    const repo = createMemoryRepository()
    await initApp(async () => repo)
    const before = Date.now()
    await markMany(['RUT.1', 'RUT.2'])
    await unmarkRead('RUT.1')
    await unmarkMany(['RUT.2'])
    await setMarks(['RUT.1.16'], { color: 'gold' })
    await setMarks(['RUT.1.16'], { color: null })
    await updateState({ activePlan: { id: 'nt-90', startedAt: before } })
    await updateState({ lastPosition: { book: 'RUT', chapter: 1 } })
    const meta = await repo.getSyncMeta()
    // Desmarcar registra exatamente as leituras que estavam no aparelho.
    expect(meta.removedReadings.map((id) => id.split('@')[0]).sort()).toEqual(['RUT.1', 'RUT.2'])
    expect(meta.removedReadings.every((id) => Number(id.split('@')[1]) >= before)).toBe(true)
    expect(meta.removedMarks['RUT.1.16']).toBeGreaterThanOrEqual(before)
    expect(meta.activePlanAt).toBeGreaterThanOrEqual(before)
    expect(meta.lastPositionAt).toBeGreaterThanOrEqual(before)
    expect(app.syncMeta).toEqual(meta)
  })

  it('marcar de novo tira o versículo da lista de marcas removidas', async () => {
    const repo = createMemoryRepository()
    await initApp(async () => repo)
    await setMarks(['RUT.1.1'], { color: 'gold' })
    await setMarks(['RUT.1.1'], { color: null })
    await setMarks(['RUT.1.1'], { color: 'blue' })
    expect((await repo.getSyncMeta()).removedMarks).toEqual({})
  })
})
