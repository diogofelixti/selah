import { ALL_CHAPTER_REFS, BOOKS, chapterRefs } from '../bible/books'
import { verseCount } from '../bible/verse-counts'

// Ids novos entram no fim: os antigos ficam salvos no plano ativo e nos backups.
export const PLAN_IDS = [
  'bible-1y',
  'nt-90',
  'gospels-30',
  'psalms-proverbs-31',
  'john-21',
  'proverbs-31',
  'psalms-30',
  'paul-30',
  'bible-2y',
  'abraham',
  'joseph',
  'moses',
  'ruth',
  'samuel',
  'david',
  'elijah',
  'esther',
  'daniel',
  'paul-story',
  'mark',
  'luke',
  'matthew',
  'acts',
  'romans',
  'galatians',
  'ephesians',
  'philippians',
  'james',
  '1-corinthians',
  'hebrews',
  'psalms-lament',
  'ecclesiastes',
  'genesis',
  'exodus',
  'numbers',
  'revelation',
] as const
export type PlanId = (typeof PLAN_IDS)[number]

/** Grupos da tela Planos, do mais curto e simples à Bíblia inteira. */
export const PLAN_GROUPS: readonly { id: 'start' | 'purpose' | 'deeper' | 'people' | 'whole'; plans: readonly PlanId[] }[] = [
  { id: 'start', plans: ['john-21', 'proverbs-31', 'psalms-30'] },
  // Um livro para cada momento: uma trilha dos Evangelhos ao Apocalipse. João e Provérbios
  // aparecem também em "Para começar"; é o mesmo plano, com o mesmo progresso.
  {
    id: 'purpose',
    plans: [
      'mark', 'john-21', 'luke', 'matthew', 'acts', 'romans', 'galatians', 'ephesians', 'philippians', 'james',
      '1-corinthians', 'hebrews', 'psalms-lament', 'proverbs-31', 'ecclesiastes', 'genesis', 'exodus', 'numbers',
      'revelation',
    ],
  },
  { id: 'deeper', plans: ['gospels-30', 'paul-30', 'psalms-proverbs-31', 'nt-90'] },
  { id: 'whole', plans: ['bible-1y', 'bible-2y'] },
  { id: 'people', plans: ['abraham', 'joseph', 'moses', 'ruth', 'samuel', 'david', 'elijah', 'esther', 'daniel', 'paul-story'] },
]

export interface PlanDef {
  id: PlanId
  days: string[][]
}

/** Divide em `parts` grupos contíguos; os primeiros recebem um item a mais quando a divisão não é exata. */
export function splitEvenly<T>(items: readonly T[], parts: number): T[][] {
  const base = Math.floor(items.length / parts)
  const extra = items.length % parts
  const out: T[][] = []
  let i = 0
  for (let d = 0; d < parts; d++) {
    const n = base + (d < extra ? 1 : 0)
    out.push(items.slice(i, i + n))
    i += n
  }
  return out
}

/**
 * Divide em `parts` dias seguidos pelo número de versículos. Cada dia leva capítulos até chegar o mais
 * perto possível da média do que falta, e sempre pelo menos um. Um capítulo longo pode ficar sozinho.
 */
export function splitByVerses(refs: readonly string[], parts: number): string[][] {
  if (parts > refs.length) throw new Error(`${parts} dias para ${refs.length} capítulos deixariam dias vazios`)
  let remaining = refs.reduce((sum, ref) => sum + verseCount(ref), 0)
  const out: string[][] = []
  let i = 0
  for (let d = 0; d < parts; d++) {
    const daysLeft = parts - d
    const target = remaining / daysLeft
    // O último dia leva o resto; os outros deixam ao menos um capítulo para cada dia seguinte.
    const end = daysLeft === 1 ? refs.length : refs.length - (daysLeft - 1)
    const day: string[] = []
    let sum = 0
    while (i < end) {
      const n = verseCount(refs[i])
      if (day.length > 0 && daysLeft > 1 && Math.abs(sum + n - target) > Math.abs(sum - target)) break
      day.push(refs[i])
      sum += n
      i++
    }
    out.push(day)
    remaining -= sum
  }
  return out
}

const refsOf = (ids: string[]) => ids.flatMap((id) => chapterRefs(id))

function build(): Record<PlanId, PlanDef> {
  const nt = BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id)
  const psalms = splitEvenly(chapterRefs('PSA'), 31)
  const paul = ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']
  const oneADay = (book: string) => chapterRefs(book).map((ref) => [ref])
  // Trecho de um livro, do capítulo `from` ao `to`, um capítulo por dia.
  const chapters = (book: string, from: number, to: number) => chapterRefs(book).slice(from - 1, to)
  const daily = (refs: string[]) => refs.map((ref) => [ref])
  return {
    'bible-1y': { id: 'bible-1y', days: splitEvenly(ALL_CHAPTER_REFS, 365) },
    'nt-90': { id: 'nt-90', days: splitEvenly(refsOf(nt), 90) },
    'gospels-30': { id: 'gospels-30', days: splitEvenly(refsOf(['MAT', 'MRK', 'LUK', 'JHN']), 30) },
    'psalms-proverbs-31': {
      id: 'psalms-proverbs-31',
      days: chapterRefs('PRO').map((proverb, i) => [proverb, ...psalms[i]]),
    },
    'john-21': { id: 'john-21', days: oneADay('JHN') },
    'proverbs-31': { id: 'proverbs-31', days: oneADay('PRO') },
    'psalms-30': { id: 'psalms-30', days: splitByVerses(chapterRefs('PSA'), 30) },
    'paul-30': { id: 'paul-30', days: splitEvenly(refsOf(paul), 30) },
    'bible-2y': { id: 'bible-2y', days: splitByVerses(ALL_CHAPTER_REFS, 730) },
    abraham: { id: 'abraham', days: daily(chapters('GEN', 12, 25)) },
    joseph: { id: 'joseph', days: daily(chapters('GEN', 37, 50)) },
    // A vida inteira de Moisés, só nos capítulos em que a história dele avança: do Egito ao Sinai,
    // o bezerro de ouro, o deserto e a morte no monte Nebo.
    moses: {
      id: 'moses',
      days: daily([
        ...chapters('EXO', 1, 20), 'EXO.24', 'EXO.32', 'EXO.33', 'EXO.34',
        'NUM.11', 'NUM.12', 'NUM.13', 'NUM.14', 'NUM.16', 'NUM.17', 'NUM.20', 'NUM.21', 'NUM.27',
        'DEU.31', 'DEU.34',
      ]),
    },
    ruth: { id: 'ruth', days: oneADay('RUT') },
    // Até a morte de Samuel (1 Samuel 25:1), com a passagem de Davi por Ramá (19).
    samuel: { id: 'samuel', days: daily([...chapters('1SA', 1, 16), '1SA.19', '1SA.25']) },
    david: { id: 'david', days: daily([...chapters('1SA', 16, 31), ...chapterRefs('2SA'), ...chapters('1KI', 1, 2)]) },
    elijah: { id: 'elijah', days: daily(['1KI.17', '1KI.18', '1KI.19', '1KI.21', '2KI.1', '2KI.2']) },
    esther: { id: 'esther', days: oneADay('EST') },
    daniel: { id: 'daniel', days: oneADay('DAN') },
    // Conversão (9), chegada a Antioquia com Barnabé (11), viagens, prisão e Roma (13 a 28).
    'paul-story': { id: 'paul-story', days: daily(['ACT.9', 'ACT.11', ...chapters('ACT', 13, 28)]) },
    mark: { id: 'mark', days: oneADay('MRK') },
    luke: { id: 'luke', days: oneADay('LUK') },
    matthew: { id: 'matthew', days: oneADay('MAT') },
    acts: { id: 'acts', days: oneADay('ACT') },
    romans: { id: 'romans', days: oneADay('ROM') },
    galatians: { id: 'galatians', days: oneADay('GAL') },
    ephesians: { id: 'ephesians', days: oneADay('EPH') },
    philippians: { id: 'philippians', days: oneADay('PHP') },
    james: { id: 'james', days: oneADay('JAS') },
    '1-corinthians': { id: '1-corinthians', days: oneADay('1CO') },
    hebrews: { id: 'hebrews', days: oneADay('HEB') },
    // Salmos de lamento e de confiança: o autor fala com Deus sobre a dor sem esconder nada.
    'psalms-lament': {
      id: 'psalms-lament',
      days: daily([3, 4, 6, 13, 22, 23, 25, 27, 31, 32, 34, 38, 39, 40, 42, 43, 46, 51, 55, 56, 62, 69, 73, 77, 86, 88, 90, 121, 130, 142].map((n) => `PSA.${n}`)),
    },
    ecclesiastes: { id: 'ecclesiastes', days: oneADay('ECC') },
    genesis: { id: 'genesis', days: oneADay('GEN') },
    // Da escravidão à aliança no Sinai. Do 21 em diante vêm as leis e o tabernáculo.
    exodus: { id: 'exodus', days: daily(chapters('EXO', 1, 20)) },
    // A nuvem que guia, as reclamações, os espias, Corá, a água da rocha e a serpente de bronze.
    numbers: { id: 'numbers', days: daily([...chapters('NUM', 9, 14), 'NUM.16', 'NUM.17', 'NUM.20', 'NUM.21']) },
    revelation: { id: 'revelation', days: oneADay('REV') },
  }
}

export const PLANS: Record<PlanId, PlanDef> = build()

export function isPlanId(x: unknown): x is PlanId {
  return typeof x === 'string' && (PLAN_IDS as readonly string[]).includes(x)
}

const refSets = new WeakMap<PlanDef, Set<string>>()

export function planContains(plan: PlanDef, ref: string): boolean {
  let set = refSets.get(plan)
  if (!set) {
    set = new Set(plan.days.flat())
    refSets.set(plan, set)
  }
  return set.has(ref)
}
