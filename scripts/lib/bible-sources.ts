import { BOOKS } from '../../src/lib/bible/books'
import type { BookText } from '../../src/lib/bible/types'

/** Livro como veio da fonte: código original, capítulo -> versículo -> texto. */
export interface RawBook {
  code: string
  chapters: Map<number, Map<number, string>>
}

function collect(lines: Iterable<[string, number, number, string]>): RawBook[] {
  const books: RawBook[] = []
  for (const [code, chapter, verse, text] of lines) {
    let book = books[books.length - 1]
    if (!book || book.code !== code) {
      book = { code, chapters: new Map() }
      books.push(book)
    }
    let verses = book.chapters.get(chapter)
    if (!verses) {
      verses = new Map()
      book.chapters.set(chapter, verses)
    }
    verses.set(verse, text)
  }
  return books
}

function* matchLines(text: string, re: RegExp): Generator<[string, number, number, string]> {
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = re.exec(line)
    if (m) yield [m[1], Number(m[2]), Number(m[3]), m[4]]
  }
}

/** Formato VPL do eBible.org: "GEN 1:1 texto". */
export function parseVpl(text: string): RawBook[] {
  return collect(matchLines(text, /^(\S+) (\d+):(\d+) ?(.*)$/))
}

/** bsb.txt do BereanBible.com: "Genesis 1:1<TAB>texto", com 3 linhas de cabeçalho. */
export function parseBsbTxt(text: string): RawBook[] {
  return collect(matchLines(text, /^(.+?) (\d+):(\d+)\t(.*)$/))
}

/** Converte para o formato do app, conferindo livros e capítulos contra BOOKS. */
export function toBookFiles(raw: RawBook[]): BookText[] {
  if (raw.length !== BOOKS.length) {
    throw new Error(`Esperava ${BOOKS.length} livros, encontrei ${raw.length}`)
  }
  return raw.map((rawBook, i) => {
    const info = BOOKS[i]
    if (rawBook.chapters.size !== info.chapters) {
      throw new Error(`${info.id} (${rawBook.code}): esperava ${info.chapters} capítulos, encontrei ${rawBook.chapters.size}`)
    }
    const chapters: string[][] = []
    for (let c = 1; c <= info.chapters; c++) {
      const verses = rawBook.chapters.get(c)
      if (!verses) throw new Error(`${info.id} ${c}: capítulo ausente`)
      const max = Math.max(...verses.keys())
      chapters.push(Array.from({ length: max }, (_, v) => verses.get(v + 1)?.trim() ?? ''))
    }
    return { book: info.id, chapters }
  })
}
