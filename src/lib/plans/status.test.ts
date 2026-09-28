import { describe, expect, it } from 'vitest'
import type { PlanDef } from './catalog'
import { isChapterDone, planStatus, planStrip, visibleDays } from './status'

const plan: PlanDef = { id: 'gospels-30', days: [['MAT.1', 'MAT.2'], ['MAT.3'], ['MAT.4']] }

describe('planStatus', () => {
  it('começa no dia 1', () => {
    expect(planStatus(plan, new Set())).toEqual({
      totalDays: 3, completedDays: 0, remainingDays: 3, currentDay: 1, todayRefs: ['MAT.1', 'MAT.2'], nextRef: 'MAT.1',
      readChapters: 0, totalChapters: 4, percent: 0,
    })
  })

  it('aponta o próximo capítulo não lido do dia atual', () => {
    expect(planStatus(plan, new Set(['MAT.1'])).nextRef).toBe('MAT.2')
  })

  it('usa o primeiro dia não concluído, mesmo com dias posteriores concluídos', () => {
    const s = planStatus(plan, new Set(['MAT.1', 'MAT.2', 'MAT.4']))
    expect(s.currentDay).toBe(2)
    expect(s.completedDays).toBe(2)
    expect(s.remainingDays).toBe(1)
    expect(s.todayRefs).toEqual(['MAT.3'])
  })

  it('termina quando todos os dias estão concluídos', () => {
    const s = planStatus(plan, new Set(['MAT.1', 'MAT.2', 'MAT.3', 'MAT.4']))
    expect(s).toMatchObject({ currentDay: null, todayRefs: [], nextRef: null, remainingDays: 0, completedDays: 3 })
  })
})

describe('isChapterDone', () => {
  const before = [{ ref: 'MAT.1', readAt: 100 }, { ref: 'GEN.1', readAt: 100 }]

  it('sem plano, usa o progresso geral', () => {
    expect(isChapterDone('MAT.1', before, null)).toBe(true)
    expect(isChapterDone('MAT.2', before, null)).toBe(false)
  })

  it('com plano, capítulo do plano lido antes do início não conta', () => {
    expect(isChapterDone('MAT.1', before, { def: plan, startedAt: 200 })).toBe(false)
    const after = [...before, { ref: 'MAT.1', readAt: 300 }]
    expect(isChapterDone('MAT.1', after, { def: plan, startedAt: 200 })).toBe(true)
  })

  it('com plano, capítulo fora do plano usa o progresso geral', () => {
    expect(isChapterDone('GEN.1', before, { def: plan, startedAt: 200 })).toBe(true)
  })
})

describe('porcentagem do plano por capítulos', () => {
  it('conta capítulos lidos desde o início sobre o total', () => {
    const s = planStatus(plan, new Set(['MAT.1', 'MAT.4']))
    expect(s).toMatchObject({ readChapters: 2, totalChapters: 4, percent: 50 })
  })
})

describe('planStrip', () => {
  const long: PlanDef = { id: 'gospels-30', days: Array.from({ length: 30 }, (_, i) => [`LUK.${i + 1}`]) }
  const readUpTo = (n: number) => new Set(Array.from({ length: n }, (_, i) => `LUK.${i + 1}`))

  it('centraliza o dia atual no meio da janela', () => {
    const strip = planStrip(long, readUpTo(11))
    expect(strip.map((d) => d.n)).toEqual([9, 10, 11, 12, 13, 14, 15])
    expect(strip.filter((d) => d.current).map((d) => d.n)).toEqual([12])
    expect(strip.filter((d) => d.complete).map((d) => d.n)).toEqual([9, 10, 11])
  })

  it('não sai do começo nem do fim do plano', () => {
    expect(planStrip(long, new Set()).map((d) => d.n)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(planStrip(long, readUpTo(29)).map((d) => d.n)).toEqual([24, 25, 26, 27, 28, 29, 30])
  })

  it('plano concluído mostra os últimos dias sem dia atual', () => {
    const strip = planStrip(long, readUpTo(30))
    expect(strip.map((d) => d.n)).toEqual([24, 25, 26, 27, 28, 29, 30])
    expect(strip.some((d) => d.current)).toBe(false)
  })

  it('plano menor que a janela mostra todos os dias', () => {
    expect(planStrip(plan, new Set()).map((d) => d.n)).toEqual([1, 2, 3])
  })
})

describe('visibleDays', () => {
  it('mostra o dia atual e os seguintes, com contagem', () => {
    const days = visibleDays(plan, new Set(['MAT.1']))
    expect(days).toEqual([
      { n: 1, refs: ['MAT.1', 'MAT.2'], doneCount: 1, total: 2, complete: false, today: true },
      { n: 2, refs: ['MAT.3'], doneCount: 0, total: 1, complete: false, today: false },
      { n: 3, refs: ['MAT.4'], doneCount: 0, total: 1, complete: false, today: false },
    ])
  })

  it('para no fim do plano e fica vazio quando tudo foi lido', () => {
    expect(visibleDays(plan, new Set(['MAT.1', 'MAT.2', 'MAT.3'])).map((d) => d.n)).toEqual([3])
    expect(visibleDays(plan, new Set(['MAT.1', 'MAT.2', 'MAT.3', 'MAT.4']))).toEqual([])
  })
})
