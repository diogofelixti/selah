import { describe, expect, it } from 'vitest'
import type { BookText } from './bible/types'
import { buildIndex, highlightParts, normalize, searchTerms, searchVerses } from './search'

const gen: BookText = { book: 'GEN', chapters: [['No princípio criou Deus', ''], ['A misericórdia [do] SENHOR']] }
const jhn: BookText = { book: 'JHN', chapters: [['No princípio era o Verbo'], [], ['Porque Deus amou ao mundo de tal maneira', 'Deus enviou o Filho', 'E chamou a luz Dia; (Deus) viu que era bom.']] }
const index = buildIndex([gen, jhn])

describe('normalize', () => {
  it('minúsculas, sem acentos, sem colchetes e espaços simples', () => {
    expect(normalize('Misericórdia  [do] SENHOR')).toBe('misericordia do senhor')
  })
})

describe('buildIndex', () => {
  it('guarda os versículos em ordem canônica, pulando os vazios, com o testamento', () => {
    expect(index.map((v) => `${v.book}.${v.chapter}.${v.verse}`)).toEqual(['GEN.1.1', 'GEN.2.1', 'JHN.1.1', 'JHN.3.1', 'JHN.3.2', 'JHN.3.3'])
    expect(index[0].testament).toBe('OT')
    expect(index[2].testament).toBe('NT')
  })
})

describe('searchTerms', () => {
  it('normaliza, tira repetidos e ignora termos com menos de 2 letras', () => {
    expect(searchTerms('  Deus a DEUS amou ')).toEqual(['deus', 'amou'])
    expect(searchTerms('a e')).toEqual([])
  })
})

describe('searchVerses', () => {
  it('exige todas as palavras, em qualquer ordem', () => {
    const r = searchVerses(index, 'mundo amou')
    expect(r.total).toBe(1)
    expect(r.results[0].verse).toBe(1)
    expect(r.results[0].book).toBe('JHN')
  })

  it('ignora acentos e colchetes', () => {
    expect(searchVerses(index, 'misericordia do senhor').total).toBe(1)
  })

  it('acha parte da palavra', () => {
    expect(searchVerses(index, 'miseric').total).toBe(1)
  })

  it('filtra por testamento', () => {
    expect(searchVerses(index, 'principio').total).toBe(2)
    expect(searchVerses(index, 'principio', { testament: 'OT' }).results.map((v) => v.book)).toEqual(['GEN'])
    expect(searchVerses(index, 'principio', { testament: 'NT' }).results.map((v) => v.book)).toEqual(['JHN'])
  })

  it('o limite corta a lista mas o total conta tudo', () => {
    const r = searchVerses(index, 'deus', { limit: 1 })
    expect(r.total).toBe(4)
    expect(r.results).toHaveLength(1)
  })

  it('casa pelo início da palavra, não no meio dela', () => {
    expect(searchVerses(index, 'amou').results.map((v) => v.verse)).toEqual([1])
    expect(searchVerses(index, 'chamou').total).toBe(1)
    expect(searchVerses(index, 'ra').total).toBe(0)
  })

  it('pontuação antes da palavra não atrapalha', () => {
    expect(searchVerses(index, 'deus viu').results.map((v) => v.verse)).toEqual([3])
  })

  it('sem termos válidos não devolve nada', () => {
    expect(searchVerses(index, 'a')).toEqual({ total: 0, results: [] })
  })
})

describe('highlightParts', () => {
  it('destaca os termos mantendo acentos e tirando colchetes', () => {
    expect(highlightParts('Misericórdia e [paz]', ['misericordia', 'paz'])).toEqual([
      { text: 'Misericórdia', hit: true },
      { text: ' e ', hit: false },
      { text: 'paz', hit: true },
    ])
  })

  it('não destaca o termo no meio de outra palavra', () => {
    expect(highlightParts('E chamou: amou', ['amou'])).toEqual([
      { text: 'E chamou: ', hit: false },
      { text: 'amou', hit: true },
    ])
  })

  it('destaca parte da palavra e sobreposições viram um trecho só', () => {
    expect(highlightParts('Porque Deus amou', ['deu', 'deus'])).toEqual([
      { text: 'Porque ', hit: false },
      { text: 'Deus', hit: true },
      { text: ' amou', hit: false },
    ])
  })
})
