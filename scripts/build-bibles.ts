import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import type { TranslationId } from '../src/lib/bible/types'
import { parseBsbTxt, parseVpl, toBookFiles, type RawBook } from './lib/bible-sources'
import { writeDailyTexts } from './lib/daily-texts'

const CACHE_DIR = '.cache'

interface Source {
  url: string
  read: (data: Uint8Array) => string
  parse: (text: string) => RawBook[]
}

// Fontes confirmadas em 2026-09-27. Ver spec, seção 3.
const SOURCES: Record<TranslationId, Source> = {
  BLIVRE: {
    url: 'https://ebible.org/Scriptures/porbr2018_vpl.zip',
    read: (data) => strFromU8(unzipSync(data)['porbr2018_vpl.txt']),
    parse: parseVpl,
  },
  BSB: {
    url: 'https://bereanbible.com/bsb.txt',
    read: (data) => strFromU8(data),
    parse: parseBsbTxt,
  },
}

async function download(url: string): Promise<Uint8Array> {
  const file = join(CACHE_DIR, url.split('/').pop()!)
  if (existsSync(file)) return new Uint8Array(readFileSync(file))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const data = new Uint8Array(await res.arrayBuffer())
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(file, data)
  return data
}

let verseCounts: Record<string, number[]> | null = null
for (const [id, source] of Object.entries(SOURCES) as [TranslationId, Source][]) {
  const books = toBookFiles(source.parse(source.read(await download(source.url))))
  const dir = join('public', 'bibles', id)
  mkdirSync(dir, { recursive: true })
  for (const book of books) writeFileSync(join(dir, `${book.book}.json`), JSON.stringify(book))
  console.log(`${id}: ${books.length} livros gravados em ${dir}`)
  // As traduções têm o mesmo número de versículos em cada capítulo; um teste confere.
  verseCounts ??= Object.fromEntries(books.map((b) => [b.book, b.chapters.map((c) => c.length)]))
}
// Usado para dividir os planos por versículos.
writeFileSync(join('src', 'lib', 'bible', 'verse-counts.json'), `${JSON.stringify(verseCounts)}\n`)
// O versículo do dia vem embutido no app; acompanha os textos novos.
writeDailyTexts()
