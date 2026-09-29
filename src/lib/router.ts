import { getBook } from './bible/books'
import { getTopic } from './topics/topics'

export type Route =
  | { name: 'home' }
  | { name: 'bible'; testament: 'OT' | 'NT' }
  | { name: 'book'; book: string }
  | { name: 'reader'; book: string; chapter: number; verse?: number }
  | { name: 'tracker' }
  | { name: 'search'; query: string }
  | { name: 'plans' }
  | { name: 'topics' }
  | { name: 'topic'; id: string }
  | { name: 'settings' }
  | { name: 'about' }

const HOME: Route = { name: 'home' }

const positiveInt = (s: string | undefined) => {
  const n = Number(s)
  return s !== undefined && Number.isInteger(n) && n > 0 ? n : null
}

export function parseRoute(hash: string): Route {
  const [head, a, b, c] = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  switch (head) {
    case undefined:
      return HOME
    case 'biblia':
      return { name: 'bible', testament: a === 'nt' ? 'NT' : 'OT' }
    case 'livro':
      return getBook(a ?? '') ? { name: 'book', book: a } : HOME
    case 'ler': {
      const book = getBook(a ?? '')
      const chapter = positiveInt(b)
      if (!book || chapter === null || chapter > book.chapters) return HOME
      const verse = positiveInt(c)
      return verse === null ? { name: 'reader', book: book.id, chapter } : { name: 'reader', book: book.id, chapter, verse }
    }
    case 'busca': {
      let query = ''
      try {
        query = decodeURIComponent(a ?? '')
      } catch {
        query = ''
      }
      return { name: 'search', query }
    }
    case 'controle':
      return { name: 'tracker' }
    case 'planos':
      return { name: 'plans' }
    case 'temas':
      if (a === undefined) return { name: 'topics' }
      return getTopic(a) ? { name: 'topic', id: a } : HOME
    case 'ajustes':
      return { name: 'settings' }
    case 'sobre':
      return { name: 'about' }
    default:
      return HOME
  }
}
