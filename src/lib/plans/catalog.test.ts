import { describe, expect, it } from 'vitest'
import { ALL_CHAPTER_REFS, getBook } from '../bible/books'
import { chapterRefs } from '../bible/books'
import { readFileSync } from 'node:fs'
import { PLANS, PLAN_GROUPS, PLAN_IDS, isPlanId, planContains, splitEvenly } from './catalog'

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

  it('João em 21 dias: um capítulo por dia', () => {
    expect(PLANS['john-21'].days).toEqual(chapterRefs('JHN').map((r) => [r]))
  })

  it('Provérbios em 31 dias: um capítulo por dia', () => {
    expect(PLANS['proverbs-31'].days).toEqual(chapterRefs('PRO').map((r) => [r]))
  })

  it('Salmos em 30 dias: 5 salmos por dia, em ordem', () => {
    const plan = PLANS['psalms-30']
    expect(plan.days).toHaveLength(30)
    expect(sizes(plan.days).every((n) => n === 5)).toBe(true)
    expect(plan.days.flat()).toEqual(chapterRefs('PSA'))
  })

  it('Cartas de Paulo em 30 dias: de Romanos a Filemom, 3 ou 2 por dia', () => {
    const plan = PLANS['paul-30']
    const books = ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']
    expect(plan.days).toHaveLength(30)
    expect(plan.days.flat()).toEqual(books.flatMap((b) => chapterRefs(b)))
    expect(plan.days.flat()).toHaveLength(87)
    expect(sizes(plan.days).every((n) => n === 3 || n === 2)).toBe(true)
  })

  it('Bíblia em 2 anos: 730 dias, 1 ou 2 capítulos por dia', () => {
    const plan = PLANS['bible-2y']
    expect(plan.days).toHaveLength(730)
    expect(plan.days.flat()).toEqual(ALL_CHAPTER_REFS)
    expect(sizes(plan.days).every((n) => n === 1 || n === 2)).toBe(true)
  })
})

describe('PLAN_GROUPS', () => {
  it('cada plano aparece em exatamente um grupo', () => {
    const listed = PLAN_GROUPS.flatMap((g) => g.plans)
    expect([...listed].sort()).toEqual([...PLAN_IDS].sort())
  })

  it('grupos e planos têm textos nos dois idiomas', () => {
    for (const lang of ['pt', 'en']) {
      const dict = JSON.parse(readFileSync(`src/i18n/${lang}.json`, 'utf8'))
      for (const g of PLAN_GROUPS) expect(dict.plans.groups[g.id], `${lang} ${g.id}`).toBeTruthy()
      for (const id of PLAN_IDS) {
        expect(dict.plans.catalog[id]?.title, `${lang} ${id}`).toBeTruthy()
        expect(dict.plans.catalog[id]?.desc, `${lang} ${id}`).toBeTruthy()
      }
    }
  })
})
