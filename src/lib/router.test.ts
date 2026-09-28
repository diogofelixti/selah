import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('parseRoute', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/biblia', { name: 'bible', testament: 'OT' }],
    ['#/biblia/nt', { name: 'bible', testament: 'NT' }],
    ['#/livro/JHN', { name: 'book', book: 'JHN' }],
    ['#/ler/JHN/3', { name: 'reader', book: 'JHN', chapter: 3 }],
    ['#/ler/JHN/3/16', { name: 'reader', book: 'JHN', chapter: 3, verse: 16 }],
    ['#/planos', { name: 'plans' }],
    ['#/temas', { name: 'topics' }],
    ['#/temas/ansiedade', { name: 'topic', id: 'ansiedade' }],
    ['#/ajustes', { name: 'settings' }],
    ['#/sobre', { name: 'about' }],
    ['#/controle', { name: 'tracker' }],
  ])('%s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })

  it.each(['#/ler/XYZ/1', '#/ler/JHN/99', '#/ler/JHN/0', '#/ler/JHN/abc', '#/ler/JHN', '#/livro/XYZ', '#/temas/nao-existe', '#/qualquer'])(
    '%s cai no início',
    (hash) => {
      expect(parseRoute(hash)).toEqual({ name: 'home' })
    },
  )

  it('ignora versículo inválido e mantém o capítulo', () => {
    expect(parseRoute('#/ler/JHN/3/0')).toEqual({ name: 'reader', book: 'JHN', chapter: 3 })
  })
})
