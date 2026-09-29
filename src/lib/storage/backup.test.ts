import { describe, expect, it } from 'vitest'
import { BackupError, parseBackup, serializeBackup } from './backup'
import type { AppData } from './types'

const data: AppData = {
  readings: [{ ref: 'JHN.3', readAt: 1700000000000 }],
  settings: { language: 'pt', theme: 'aurora', fontSize: 2 },
  state: { lastPosition: { book: 'JHN', chapter: 3 }, activePlan: { id: 'gospels-30', startedAt: 1690000000000 } },
  marks: [
    { ref: 'JHN.3.16', color: 'gold', note: 'meu versículo', updatedAt: 1700000000000 },
    { ref: 'PSA.23.1', color: null, note: 'ler com calma', updatedAt: 1700000000000 },
  ],
}

const withChange = (change: (raw: Record<string, any>) => void) => {
  const raw = JSON.parse(serializeBackup(data, 0))
  change(raw)
  return JSON.stringify(raw)
}

describe('backup', () => {
  it('ida e volta preserva os dados', () => {
    expect(parseBackup(serializeBackup(data))).toEqual(data)
  })

  it('grava cabeçalho com app, versão e data', () => {
    const raw = JSON.parse(serializeBackup(data, Date.UTC(2026, 8, 27)))
    expect(raw).toMatchObject({ app: 'selah', version: 2, exportedAt: '2026-09-27T00:00:00.000Z' })
  })

  it.each([
    ['não é JSON', 'isso não é json'],
    ['é outro app', withChange((r) => { r.app = 'outro' })],
    ['versão futura', withChange((r) => { r.version = 3 })],
    ['marcação com cor desconhecida', withChange((r) => { r.marks = [{ ref: 'JHN.3.16', color: 'red', note: '', updatedAt: 1 }] })],
    ['marcação em capítulo e não versículo', withChange((r) => { r.marks = [{ ref: 'JHN.3', color: 'gold', note: '', updatedAt: 1 }] })],
    ['marcação em livro inexistente', withChange((r) => { r.marks = [{ ref: 'XYZ.1.1', color: 'gold', note: '', updatedAt: 1 }] })],
    ['nota longa demais', withChange((r) => { r.marks = [{ ref: 'JHN.3.16', color: null, note: 'x'.repeat(1001), updatedAt: 1 }] })],
    ['versão 2 sem marks', withChange((r) => { delete r.marks })],
    ['livro inexistente', withChange((r) => { r.readings = [{ ref: 'XYZ.1', readAt: 1 }] })],
    ['capítulo 0', withChange((r) => { r.readings = [{ ref: 'JHN.0', readAt: 1 }] })],
    ['referência de versículo', withChange((r) => { r.readings = [{ ref: 'JHN.3.16', readAt: 1 }] })],
    ['data inválida', withChange((r) => { r.readings = [{ ref: 'JHN.3', readAt: 'ontem' }] })],
    ['idioma desconhecido', withChange((r) => { r.settings.language = 'fr' })],
    ['tamanho de letra fora da faixa', withChange((r) => { r.settings.fontSize = 9 })],
    ['plano desconhecido', withChange((r) => { r.state.activePlan = { id: 'nope', startedAt: 1 } })],
    ['posição em capítulo inexistente', withChange((r) => { r.state.lastPosition = { book: 'JHN', chapter: 99 } })],
    ['sem readings', withChange((r) => { delete r.readings })],
    ['capítulo com zero à esquerda', withChange((r) => { r.readings = [{ ref: 'JHN.03', readAt: 1 }] })],
    ['data de leitura no futuro distante', withChange((r) => { r.readings = [{ ref: 'JHN.3', readAt: 1e20 }] })],
    ['data de leitura negativa', withChange((r) => { r.readings = [{ ref: 'JHN.3', readAt: -5 }] })],
    ['plano começando no futuro', withChange((r) => { r.state.activePlan = { id: 'nt-90', startedAt: Date.now() + 10 * 86_400_000 } })],
  ])('rejeita arquivo com %s', (_name, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
  })

  it('aceita estado sem posição e sem plano', () => {
    const text = withChange((r) => { r.state = { lastPosition: null, activePlan: null } })
    expect(parseBackup(text).state).toEqual({ lastPosition: null, activePlan: null })
  })
})

describe('backup da versão 1', () => {
  it('importa sem marcações', () => {
    const raw = JSON.parse(serializeBackup(data, 0))
    raw.version = 1
    delete raw.marks
    expect(parseBackup(JSON.stringify(raw))).toEqual({ ...data, marks: [] })
  })
})
