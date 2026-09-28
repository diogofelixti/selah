import { describe, expect, it } from 'vitest'
import { BOOKS } from '../../src/lib/bible/books'
import { parseBsbTxt, parseVpl, toBookFiles, type RawBook } from './bible-sources'

const plain = (books: RawBook[]) =>
  books.map((b) => ({ code: b.code, chapters: [...b.chapters].map(([c, v]) => [c, [...v]]) }))

function fullRaw(): RawBook[] {
  return BOOKS.map((b) => ({
    code: b.id,
    chapters: new Map(Array.from({ length: b.chapters }, (_, i) => [i + 1, new Map([[1, 'texto']])])),
  }))
}

describe('parseVpl', () => {
  it('lê livro, capítulo e versículo, ignorando o BOM', () => {
    const text = '﻿GEN 1:1 No princípio criou Deus os céus e a terra.\nGEN 1:2 E a terra estava desordenada.\nEXO 1:1 Estes pois são os nomes.\n'
    expect(plain(parseVpl(text))).toEqual([
      { code: 'GEN', chapters: [[1, [[1, 'No princípio criou Deus os céus e a terra.'], [2, 'E a terra estava desordenada.']]]] },
      { code: 'EXO', chapters: [[1, [[1, 'Estes pois são os nomes.']]]] },
    ])
  })
})

describe('parseBsbTxt', () => {
  it('pula o cabeçalho e lê linhas separadas por tab', () => {
    const text = [
      '﻿The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub. \t',
      'This text of God\'s Word has been dedicated to the public domain.\t',
      'Verse\tBerean Standard Bible',
      'Genesis 1:1\tIn the beginning God created the heavens and the earth.',
      '1 Samuel 2:3\tTalk no more so proudly.',
      'Matthew 17:21\t',
    ].join('\n')
    expect(plain(parseBsbTxt(text))).toEqual([
      { code: 'Genesis', chapters: [[1, [[1, 'In the beginning God created the heavens and the earth.']]]] },
      { code: '1 Samuel', chapters: [[2, [[3, 'Talk no more so proudly.']]]] },
      { code: 'Matthew', chapters: [[17, [[21, '']]]] },
    ])
  })
})

describe('toBookFiles', () => {
  it('atribui ids USFM pela ordem e preenche lacunas com vazio', () => {
    const raw = fullRaw()
    raw[0].chapters.set(1, new Map([[1, ' a '], [3, 'c']]))
    const files = toBookFiles(raw)
    expect(files).toHaveLength(66)
    expect(files.map((f) => f.book)).toEqual(BOOKS.map((b) => b.id))
    expect(files[0].chapters[0]).toEqual(['a', '', 'c'])
    expect(files[0].chapters).toHaveLength(50)
  })

  it('falha se faltar livro', () => {
    expect(() => toBookFiles(fullRaw().slice(1))).toThrow(/66 livros/)
  })

  it('falha se o número de capítulos não bater', () => {
    const raw = fullRaw()
    raw[1].chapters.delete(40)
    expect(() => toBookFiles(raw)).toThrow(/EXO/)
  })
})
