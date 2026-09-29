import { describe, expect, it } from 'vitest'
import { formatSelection, selectionParts } from './copy'

const texts = ['um', 'dois [que] três', 'quatro', 'cinco', '', 'seis']
const base = { book: 'JHN', chapter: 3, texts, bookName: () => 'João', translation: 'BLIVRE' }

describe('formatSelection', () => {
  it('um versículo vai entre aspas com referência e tradução', () => {
    expect(formatSelection({ ...base, verses: [1] })).toBe('“um” João 3:1 (BLIVRE)')
  })

  it('vários seguidos levam número e viram intervalo, mesmo selecionados fora de ordem', () => {
    expect(formatSelection({ ...base, verses: [3, 1, 2] })).toBe('1 um 2 dois que três 3 quatro João 3:1-3 (BLIVRE)')
  })

  it('não seguidos ficam separados por vírgula', () => {
    expect(formatSelection({ ...base, verses: [1, 3, 4] })).toBe('1 um 3 quatro 4 cinco João 3:1, 3-4 (BLIVRE)')
  })

  it('palavras implícitas saem sem colchetes', () => {
    expect(formatSelection({ ...base, verses: [2] })).toBe('“dois que três” João 3:2 (BLIVRE)')
  })

  it('ignora versículos vazios e repetidos', () => {
    expect(formatSelection({ ...base, verses: [4, 5, 6, 6] })).toBe('4 cinco 6 seis João 3:4, 6 (BLIVRE)')
  })

  it('não usa travessão nem meia risca', () => {
    expect(formatSelection({ ...base, verses: [1, 2, 3, 4, 6] })).not.toMatch(/[–—]/)
  })
})

describe('selectionParts', () => {
  it('separa corpo e referência, sem aspas e sem colchetes', () => {
    expect(selectionParts({ ...base, verses: [2] })).toMatchObject({ body: 'dois que três', reference: 'João 3:2', verses: [2] })
    expect(selectionParts({ ...base, verses: [3, 1] })).toMatchObject({ body: '1 um 3 quatro', reference: 'João 3:1, 3', verses: [1, 3] })
    expect(selectionParts({ ...base, verses: [5] })).toBeNull()
  })
})

describe('texto da imagem', () => {
  it('o número do versículo fica colado na primeira palavra (não quebra de linha sozinho)', () => {
    expect(selectionParts({ ...base, verses: [1, 3] })!.imageBody).toBe('1\u00a0um 3\u00a0quatro')
    expect(selectionParts({ ...base, verses: [2] })!.imageBody).toBe('dois que três')
  })
})
