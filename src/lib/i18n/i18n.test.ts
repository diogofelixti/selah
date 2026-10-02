import { describe, expect, it } from 'vitest'
import en from '../../i18n/en.json'
import pt from '../../i18n/pt.json'
import { BOOKS, SECTIONS } from '../bible/books'
import { PLAN_IDS } from '../plans/catalog'
import { detectLanguage, resolveLanguage } from './lang'
import { flattenKeys, translate } from './translate'

describe('detectLanguage', () => {
  it('português para qualquer variante pt, inglês para o resto', () => {
    expect(detectLanguage('pt-BR')).toBe('pt')
    expect(detectLanguage('pt-PT')).toBe('pt')
    expect(detectLanguage('PT')).toBe('pt')
    expect(detectLanguage('en-US')).toBe('en')
    expect(detectLanguage('es-ES')).toBe('en')
    expect(detectLanguage('')).toBe('en')
    expect(detectLanguage(undefined)).toBe('en')
  })

  it('a escolha manual vence a detecção', () => {
    expect(resolveLanguage('auto', 'pt-BR')).toBe('pt')
    expect(resolveLanguage('en', 'pt-BR')).toBe('en')
    expect(resolveLanguage('pt', 'en-US')).toBe('pt')
  })
})

describe('translate', () => {
  const dict = { a: { b: 'Olá {name}, {count} dias', c: 'x' } }
  it('resolve chaves aninhadas e parâmetros', () => {
    expect(translate(dict, 'a.b', { name: 'Ana', count: 3 })).toBe('Olá Ana, 3 dias')
    expect(translate(dict, 'a.c')).toBe('x')
  })
  it('devolve a própria chave quando falta tradução e mantém parâmetro desconhecido', () => {
    expect(translate(dict, 'a.zzz')).toBe('a.zzz')
    expect(translate(dict, 'a')).toBe('a')
    expect(translate(dict, 'a.b', { name: 'Ana' })).toBe('Olá Ana, {count} dias')
  })
})

describe('arquivos de idioma', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(pt).sort())
  })

  it('têm nome para todo livro, seção e plano', () => {
    const keys = new Set(flattenKeys(pt))
    for (const b of BOOKS) expect(keys.has(`books.${b.id}`), b.id).toBe(true)
    for (const s of SECTIONS) expect(keys.has(`sections.${s.id}`), s.id).toBe(true)
    for (const id of PLAN_IDS) {
      // A descrição e a frase de propósito são conferidas por grupo em plans/catalog.test.ts.
      expect(keys.has(`plans.catalog.${id}.title`), id).toBe(true)
    }
  })

  it('não têm texto vazio', () => {
    for (const dict of [pt, en]) {
      for (const key of flattenKeys(dict)) expect(translate(dict, key).trim(), key).not.toBe('')
    }
  })
})
