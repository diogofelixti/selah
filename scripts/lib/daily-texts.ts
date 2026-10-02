import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TranslationId } from '../../src/lib/bible/types'

const TRANSLATIONS: TranslationId[] = ['BLIVRE', 'BSB']

/**
 * Grava o texto dos versículos do dia nas duas traduções, a partir de public/bibles.
 * Assim a tela inicial mostra o versículo sem esperar o livro inteiro baixar.
 */
export function writeDailyTexts(): void {
  const refs: string[] = JSON.parse(readFileSync(join('src', 'content', 'daily-verses.json'), 'utf8'))
  const out = Object.fromEntries(
    TRANSLATIONS.map((tr) => [
      tr,
      Object.fromEntries(
        refs.map((ref) => {
          const [book, chapter, verse] = ref.split('.')
          const file = JSON.parse(readFileSync(join('public', 'bibles', tr, `${book}.json`), 'utf8'))
          return [ref, file.chapters[Number(chapter) - 1][Number(verse) - 1]]
        }),
      ),
    ]),
  )
  writeFileSync(join('src', 'content', 'daily-verse-texts.json'), `${JSON.stringify(out, null, 2)}\n`)
}
