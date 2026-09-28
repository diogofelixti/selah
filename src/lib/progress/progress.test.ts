import { describe, expect, it } from 'vitest'
import { getBook } from '../bible/books'
import {
  bibleProgress, bookProgress, daysWithReading, localDayKey, percent, readSet, testamentProgress, unreadChapters, weekDays, type Reading,
} from './progress'

const r = (ref: string, readAt: number): Reading => ({ ref, readAt })

describe('readSet', () => {
  it('junta capítulos distintos e filtra por data inicial', () => {
    const readings = [r('JHN.1', 100), r('JHN.1', 300), r('JHN.2', 150)]
    expect(readSet(readings)).toEqual(new Set(['JHN.1', 'JHN.2']))
    expect(readSet(readings, 200)).toEqual(new Set(['JHN.1']))
  })
})

describe('contagens', () => {
  const set = new Set(['RUT.1', 'RUT.2', 'JHN.3', 'REV.22'])

  it('conta por livro, testamento e Bíblia', () => {
    expect(bookProgress(set, getBook('RUT')!)).toEqual({ read: 2, total: 4 })
    expect(testamentProgress(set, 'OT')).toEqual({ read: 2, total: 929 })
    expect(testamentProgress(set, 'NT')).toEqual({ read: 2, total: 260 })
    expect(bibleProgress(set)).toEqual({ read: 4, total: 1189 })
  })

  it('arredonda a porcentagem para baixo e só mostra 100 quando completo', () => {
    expect(percent({ read: 2, total: 4 })).toBe(50)
    expect(percent({ read: 1188, total: 1189 })).toBe(99)
    expect(percent({ read: 1189, total: 1189 })).toBe(100)
    expect(percent({ read: 0, total: 0 })).toBe(0)
  })
})

describe('dias com leitura (fuso America/Sao_Paulo)', () => {
  const now = new Date(2026, 8, 27, 10, 0).getTime()
  const lateNight = new Date(2026, 8, 26, 23, 30).getTime()

  it('roda com o fuso de São Paulo', () => {
    expect(new Date(lateNight).getUTCDate()).toBe(27)
  })

  it('usa o dia local, não o dia em UTC', () => {
    expect(localDayKey(lateNight)).toBe('2026-09-26')
  })

  it('conta dias distintos dentro da janela de 7 dias', () => {
    const eightDaysAgo = new Date(2026, 8, 19, 12, 0).getTime()
    const sixDaysAgo = new Date(2026, 8, 21, 8, 0).getTime()
    const readings = [r('GEN.1', lateNight), r('GEN.2', now), r('GEN.3', now), r('GEN.4', eightDaysAgo), r('GEN.5', sixDaysAgo)]
    expect(daysWithReading(readings, now)).toBe(3)
    expect(daysWithReading([], now)).toBe(0)
  })
})

describe('weekDays', () => {
  const now = new Date(2026, 8, 27, 10, 0).getTime() // domingo, 27/09/2026, 10h local
  it('devolve 7 dias do mais antigo para hoje, com o dia da semana local', () => {
    const days = weekDays([], now)
    expect(days).toHaveLength(7)
    expect(days.map((d) => d.key)).toEqual([
      '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27',
    ])
    expect(days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(days.map((d) => d.today)).toEqual([false, false, false, false, false, false, true])
  })

  it('marca como lido o dia local da leitura, mesmo às 23h30', () => {
    const lateNight = new Date(2026, 8, 26, 23, 30).getTime()
    const days = weekDays([r('GEN.1', lateNight), r('GEN.2', now)], now)
    expect(days.filter((d) => d.read).map((d) => d.key)).toEqual(['2026-09-26', '2026-09-27'])
  })
})

describe('unreadChapters', () => {
  it('lista só os capítulos do livro que ainda não foram lidos', () => {
    expect(unreadChapters('RUT', new Set(['RUT.1', 'RUT.3', 'JHN.1']))).toEqual(['RUT.2', 'RUT.4'])
    expect(unreadChapters('RUT', new Set(['RUT.1', 'RUT.2', 'RUT.3', 'RUT.4']))).toEqual([])
  })
})
