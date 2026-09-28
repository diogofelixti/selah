import { describe, expect, it } from 'vitest'
import type { PlanDef } from './catalog'
import { isChapterDone, planStatus } from './status'

const plan: PlanDef = { id: 'gospels-30', days: [['MAT.1', 'MAT.2'], ['MAT.3'], ['MAT.4']] }

describe('planStatus', () => {
  it('começa no dia 1', () => {
    expect(planStatus(plan, new Set())).toEqual({
      totalDays: 3, completedDays: 0, remainingDays: 3, currentDay: 1, todayRefs: ['MAT.1', 'MAT.2'], nextRef: 'MAT.1',
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
