export type TranslationId = 'BLIVRE' | 'BSB'

/** Texto de um livro. chapters[c - 1][v - 1]; versículo omitido pela tradução é ''. */
export interface BookText {
  book: string
  chapters: string[][]
}
