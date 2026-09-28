import { describe, expect, it } from 'vitest'
import { ALL_CHAPTER_REFS, getBook } from '../bible/books'
import { PLANS, isPlanId, planContains, splitEvenly } from './catalog'

const sizes = (days: string[][]) => days.map((d) => d.length)

describe('splitEvenly', () => {
  it('dá um item a mais para os primeiros dias', () => {
    expect(sizes(splitEvenly(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 3))).toEqual([4, 3, 3])
  })
})

describe('PLANS', () => {
  it('Bíblia em 1 ano cobre os 1.189 capítulos em ordem em 365 dias', () => {
    const plan = PLANS['bible-1y']
    expect(plan.days).toHaveLength(365)
    expect(plan.days.flat()).toEqual(ALL_CHAPTER_REFS)
  })

  it('NT em 90 dias cobre só o Novo Testamento', () => {
    const flat = PLANS['nt-90'].days.flat()
    expect(PLANS['nt-90'].days).toHaveLength(90)
    expect(flat).toHaveLength(260)
    expect(flat.every((ref) => getBook(ref.split('.')[0])?.testament === 'NT')).toBe(true)
  })

  it('Evangelhos em 30 dias tem 89 capítulos, 3 ou 2 por dia', () => {
    const plan = PLANS['gospels-30']
    expect(plan.days).toHaveLength(30)
    expect(plan.days.flat()).toHaveLength(89)
    expect(sizes(plan.days).every((n) => n === 3 || n === 2)).toBe(true)
    expect(plan.days[0]).toEqual(['MAT.1', 'MAT.2', 'MAT.3'])
  })

  it('Salmos e Provérbios em 31 dias começa cada dia com o Provérbio do dia', () => {
    const plan = PLANS['psalms-proverbs-31']
    expect(plan.days).toHaveLength(31)
    plan.days.forEach((day, i) => expect(day[0]).toBe(`PRO.${i + 1}`))
    expect(plan.days.flat().filter((ref) => ref.startsWith('PSA.'))).toHaveLength(150)
  })

  it('valida ids e pertencimento', () => {
    expect(isPlanId('nt-90')).toBe(true)
    expect(isPlanId('nope')).toBe(false)
    expect(planContains(PLANS['gospels-30'], 'JHN.21')).toBe(true)
    expect(planContains(PLANS['gospels-30'], 'GEN.1')).toBe(false)
  })
})
