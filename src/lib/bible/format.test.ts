import { describe, expect, it } from 'vitest'
import { splitImplied } from './format'

describe('splitImplied', () => {
  it('texto sem colchetes vira uma parte só', () => {
    expect(splitImplied('No princípio.')).toEqual([{ text: 'No princípio.', implied: false }])
  })

  it('separa palavras implícitas e remove os colchetes', () => {
    expect(splitImplied('para [que eu saiba] se és')).toEqual([
      { text: 'para ', implied: false },
      { text: 'que eu saiba', implied: true },
      { text: ' se és', implied: false },
    ])
    expect(splitImplied('[o povo] saiu')).toEqual([
      { text: 'o povo', implied: true },
      { text: ' saiu', implied: false },
    ])
  })

  it('colchete sem fechamento fica como texto normal', () => {
    expect(splitImplied('abre [sem fechar')).toEqual([{ text: 'abre [sem fechar', implied: false }])
  })
})
