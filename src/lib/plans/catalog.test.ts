import { describe, expect, it } from 'vitest'
import { ALL_CHAPTER_REFS, chapterRefs, getBook } from '../bible/books'
import { readFileSync } from 'node:fs'
import { verseCount } from '../bible/verse-counts'
import { PLANS, PLAN_GROUPS, PLAN_IDS, isPlanId, planContains, splitByVerses, splitEvenly } from './catalog'

const sizes = (days: string[][]) => days.map((d) => d.length)
const verses = (day: string[]) => day.reduce((sum, ref) => sum + verseCount(ref), 0)
const average = (days: string[][]) => days.reduce((sum, d) => sum + verses(d), 0) / days.length

describe('splitEvenly', () => {
  it('dá um item a mais para os primeiros dias', () => {
    expect(sizes(splitEvenly(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 3))).toEqual([4, 3, 3])
  })
})

describe('splitByVerses', () => {
  it('divide em dias seguidos, sem dia vazio, e cada capítulo entra uma vez', () => {
    const refs = chapterRefs('PSA')
    const days = splitByVerses(refs, 30)
    expect(days).toHaveLength(30)
    expect(days.flat()).toEqual(refs)
    expect(days.every((d) => d.length > 0)).toBe(true)
  })

  it('deixa um capítulo longo sozinho quando ele já passa da média', () => {
    expect(splitByVerses(chapterRefs('PSA'), 30)).toContainEqual(['PSA.119'])
  })

  it('cada dia fica perto da média de versículos', () => {
    // Salmos tem 2.461 versículos: cerca de 82 por dia em 30 dias.
    const days = splitByVerses(chapterRefs('PSA'), 30)
    const others = days.filter((d) => !d.includes('PSA.119'))
    expect(Math.max(...others.map(verses))).toBeLessThan(120)
    expect(Math.min(...others.map(verses))).toBeGreaterThan(50)
  })

  it('com tantos dias quanto capítulos, faz um capítulo por dia', () => {
    expect(splitByVerses(['JHN.1', 'JHN.2'], 2)).toEqual([['JHN.1'], ['JHN.2']])
  })

  it('recusa mais dias que capítulos, em vez de deixar dias vazios', () => {
    expect(() => splitByVerses(['JHN.1', 'JHN.2'], 4)).toThrow()
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

  it('Salmos em 30 dias: em ordem, divididos por versículos, com o Salmo 119 num dia só', () => {
    const plan = PLANS['psalms-30']
    expect(plan.days).toHaveLength(30)
    expect(plan.days.flat()).toEqual(chapterRefs('PSA'))
    expect(plan.days).toContainEqual(['PSA.119'])
  })

  it('Cartas de Paulo em 30 dias: de Romanos a Filemom, 3 ou 2 por dia', () => {
    const plan = PLANS['paul-30']
    const books = ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']
    expect(plan.days).toHaveLength(30)
    expect(plan.days.flat()).toEqual(books.flatMap((b) => chapterRefs(b)))
    expect(plan.days.flat()).toHaveLength(87)
    expect(sizes(plan.days).every((n) => n === 3 || n === 2)).toBe(true)
  })

  it('Bíblia em 2 anos: 730 dias, em ordem, no mesmo ritmo do começo ao fim', () => {
    const plan = PLANS['bible-2y']
    expect(plan.days).toHaveLength(730)
    expect(plan.days.flat()).toEqual(ALL_CHAPTER_REFS)
    expect(plan.days.every((d) => d.length > 0)).toBe(true)
    // Antes eram 2 capítulos por dia até o dia 459 e 1 por dia depois disso.
    const first = average(plan.days.slice(0, 365))
    const second = average(plan.days.slice(365))
    expect(Math.abs(first - second) / first).toBeLessThan(0.05)
  })
})

describe('planos de personagens', () => {
  const range = (book: string, from: number, to: number) => chapterRefs(book).slice(from - 1, to)
  const cases: [string, string[]][] = [
    ['abraham', range('GEN', 12, 25)],
    ['joseph', range('GEN', 37, 50)],
    [
      'moses',
      [
        ...range('EXO', 1, 20), 'EXO.24', 'EXO.32', 'EXO.33', 'EXO.34',
        'NUM.11', 'NUM.12', 'NUM.13', 'NUM.14', 'NUM.16', 'NUM.17', 'NUM.20', 'NUM.21', 'NUM.27',
        'DEU.31', 'DEU.34',
      ],
    ],
    ['ruth', chapterRefs('RUT')],
    ['samuel', [...range('1SA', 1, 16), '1SA.19', '1SA.25']],
    ['david', [...range('1SA', 16, 31), ...chapterRefs('2SA'), '1KI.1', '1KI.2']],
    ['elijah', ['1KI.17', '1KI.18', '1KI.19', '1KI.21', '2KI.1', '2KI.2']],
    ['esther', chapterRefs('EST')],
    ['daniel', chapterRefs('DAN')],
    ['paul-story', ['ACT.9', 'ACT.11', ...range('ACT', 13, 28)]],
  ]

  it.each(cases)('%s: um capítulo por dia, na ordem da história', (id, refs) => {
    expect(PLANS[id as keyof typeof PLANS].days).toEqual(refs.map((r) => [r]))
  })

  it('Davi tem 42 dias', () => {
    expect(PLANS.david.days).toHaveLength(42)
  })

  it('o grupo de personagens está na ordem da Bíblia', () => {
    expect(PLAN_GROUPS.find((g) => g.id === 'people')!.plans).toEqual(cases.map(([id]) => id))
  })
})

describe('um livro para cada momento', () => {
  const range = (book: string, from: number, to: number) => chapterRefs(book).slice(from - 1, to)
  const psalms = [3, 4, 6, 13, 22, 23, 25, 27, 31, 32, 34, 38, 39, 40, 42, 43, 46, 51, 55, 56, 62, 69, 73, 77, 86, 88, 90, 121, 130, 142]
  const cases: [string, string[]][] = [
    ['mark', chapterRefs('MRK')],
    ['john-21', chapterRefs('JHN')],
    ['luke', chapterRefs('LUK')],
    ['matthew', chapterRefs('MAT')],
    ['acts', chapterRefs('ACT')],
    ['romans', chapterRefs('ROM')],
    ['galatians', chapterRefs('GAL')],
    ['ephesians', chapterRefs('EPH')],
    ['philippians', chapterRefs('PHP')],
    ['james', chapterRefs('JAS')],
    ['1-corinthians', chapterRefs('1CO')],
    ['hebrews', chapterRefs('HEB')],
    ['psalms-lament', psalms.map((n) => `PSA.${n}`)],
    ['proverbs-31', chapterRefs('PRO')],
    ['ecclesiastes', chapterRefs('ECC')],
    ['genesis', chapterRefs('GEN')],
    ['exodus', range('EXO', 1, 20)],
    ['numbers', [...range('NUM', 9, 14), 'NUM.16', 'NUM.17', 'NUM.20', 'NUM.21']],
    ['revelation', chapterRefs('REV')],
  ]

  it.each(cases)('%s: um capítulo por dia', (id, refs) => {
    expect(PLANS[id as keyof typeof PLANS].days).toEqual(refs.map((r) => [r]))
  })

  it('a seleção de Salmos tem 30 dias', () => {
    expect(PLANS['psalms-lament'].days).toHaveLength(30)
  })

  it('o grupo vem logo depois de Para começar, na ordem da trilha', () => {
    expect(PLAN_GROUPS.map((g) => g.id)).toEqual(['start', 'purpose', 'deeper', 'whole', 'people'])
    expect(PLAN_GROUPS.find((g) => g.id === 'purpose')!.plans).toEqual(cases.map(([id]) => id))
  })

  it('os planos novos ficam no fim da lista de ids, para não mexer nos antigos', () => {
    expect(PLAN_IDS.indexOf('paul-story')).toBe(18)
    expect(PLAN_IDS.indexOf('mark')).toBe(19)
  })
})

describe('PLAN_GROUPS', () => {
  it('cada plano aparece num grupo; só João e Provérbios aparecem em dois', () => {
    const listed = PLAN_GROUPS.flatMap((g) => g.plans)
    expect([...new Set(listed)].sort()).toEqual([...PLAN_IDS].sort())
    const twice = listed.filter((id, i) => listed.indexOf(id) !== i)
    expect(twice.sort()).toEqual(['john-21', 'proverbs-31'])
  })

  it('grupos e planos têm textos nos dois idiomas', () => {
    for (const lang of ['pt', 'en']) {
      const dict = JSON.parse(readFileSync(`src/i18n/${lang}.json`, 'utf8'))
      for (const g of PLAN_GROUPS) expect(dict.plans.groups[g.id], `${lang} ${g.id}`).toBeTruthy()
      for (const id of PLAN_IDS) expect(dict.plans.catalog[id]?.title, `${lang} ${id}`).toBeTruthy()
      // A descrição só aparece fora do grupo de propósito; lá o título do cartão é a frase.
      for (const g of PLAN_GROUPS) {
        for (const id of g.plans) {
          if (g.id === 'purpose') expect(dict.plans.purpose[id], `${lang} purpose ${id}`).toBeTruthy()
          else expect(dict.plans.catalog[id]?.desc, `${lang} ${id}`).toBeTruthy()
        }
      }
    }
  })
})
