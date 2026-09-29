import { getBook } from '../bible/books'
import { isValidChapterRef, isValidVerseRef } from '../bible/refs'
import { isPlanId } from '../plans/catalog'
import {
  FONT_SIZES, MARK_COLORS, NOTE_MAX, THEMES, type AppData, type AppState, type FontSize, type MarkColor, type Reading, type Settings,
  type Theme, type VerseMark, isEmptyMark,
} from './types'

/** Versão 2 inclui as marcações. A versão 1 continua aceita na importação. */
export const BACKUP_VERSION = 2

export class BackupError extends Error {}

type Obj = Record<string, unknown>
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)
// Datas aceitas: de 1970 até um dia à frente (tolera relógios um pouco adiantados).
const MAX_CLOCK_SKEW = 86_400_000
const isTime = (x: unknown, now: number): x is number =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= now + MAX_CLOCK_SKEW

export function serializeBackup(data: AppData, now = Date.now()): string {
  return JSON.stringify(
    { app: 'selah', version: BACKUP_VERSION, exportedAt: new Date(now).toISOString(), ...data },
    null,
    2,
  )
}

function parseReading(x: unknown, now: number): Reading {
  if (!isObj(x) || typeof x.ref !== 'string' || !isValidChapterRef(x.ref) || !isTime(x.readAt, now)) {
    throw new BackupError('leitura inválida')
  }
  return { ref: x.ref, readAt: x.readAt }
}

function parseSettings(x: unknown): Settings {
  if (!isObj(x)) throw new BackupError('ajustes ausentes')
  const { language, theme, fontSize } = x
  if (language !== 'auto' && language !== 'pt' && language !== 'en') throw new BackupError('idioma inválido')
  if (!THEMES.includes(theme as Theme)) throw new BackupError('tema inválido')
  if (!FONT_SIZES.includes(fontSize as FontSize)) throw new BackupError('tamanho de letra inválido')
  return { language, theme: theme as Theme, fontSize: fontSize as FontSize }
}

function parseState(x: unknown, now: number): AppState {
  if (!isObj(x)) throw new BackupError('estado ausente')
  let lastPosition: AppState['lastPosition'] = null
  if (x.lastPosition !== null) {
    const p = x.lastPosition
    const book = isObj(p) && typeof p.book === 'string' ? getBook(p.book) : undefined
    if (!isObj(p) || !book || typeof p.chapter !== 'number' || !Number.isInteger(p.chapter) || p.chapter < 1 || p.chapter > book.chapters) {
      throw new BackupError('posição inválida')
    }
    lastPosition = { book: book.id, chapter: p.chapter }
  }
  let activePlan: AppState['activePlan'] = null
  if (x.activePlan !== null) {
    const a = x.activePlan
    if (!isObj(a) || !isPlanId(a.id) || !isTime(a.startedAt, now)) throw new BackupError('plano inválido')
    activePlan = { id: a.id, startedAt: a.startedAt }
  }
  return { lastPosition, activePlan }
}

function parseMark(x: unknown, now: number): VerseMark {
  if (
    !isObj(x) ||
    typeof x.ref !== 'string' ||
    !isValidVerseRef(x.ref) ||
    !(x.color === null || MARK_COLORS.includes(x.color as MarkColor)) ||
    typeof x.note !== 'string' ||
    x.note.length > NOTE_MAX ||
    !isTime(x.updatedAt, now)
  ) {
    throw new BackupError('marcação inválida')
  }
  const mark = { ref: x.ref, color: x.color as MarkColor | null, note: x.note, updatedAt: x.updatedAt }
  if (isEmptyMark(mark)) throw new BackupError('marcação vazia')
  return mark
}

function parseMarks(list: unknown[], now: number): VerseMark[] {
  const marks = list.map((m) => parseMark(m, now))
  if (new Set(marks.map((m) => m.ref)).size !== marks.length) throw new BackupError('marcação repetida')
  return marks
}

export function parseBackup(text: string, now = Date.now()): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('não é JSON')
  }
  if (!isObj(raw) || raw.app !== 'selah') throw new BackupError('não é um backup do Selah')
  if (raw.version !== 1 && raw.version !== BACKUP_VERSION) throw new BackupError('versão não suportada')
  if (raw.version === 2 && !Array.isArray(raw.marks)) throw new BackupError('marcações ausentes')
  if (!Array.isArray(raw.readings)) throw new BackupError('leituras ausentes')
  return {
    readings: raw.readings.map((r) => parseReading(r, now)),
    settings: parseSettings(raw.settings),
    state: parseState(raw.state, now),
    marks: raw.version === 2 ? parseMarks(raw.marks as unknown[], now) : [],
  }
}
