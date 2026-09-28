import { getBook } from '../bible/books'
import { isValidChapterRef } from '../bible/refs'
import { isPlanId } from '../plans/catalog'
import { FONT_SIZES, THEMES, type AppData, type AppState, type FontSize, type Reading, type Settings, type Theme } from './types'

export const BACKUP_VERSION = 1

export class BackupError extends Error {}

type Obj = Record<string, unknown>
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export function serializeBackup(data: AppData, now = Date.now()): string {
  return JSON.stringify(
    { app: 'selah', version: BACKUP_VERSION, exportedAt: new Date(now).toISOString(), ...data },
    null,
    2,
  )
}

function parseReading(x: unknown): Reading {
  if (!isObj(x) || typeof x.ref !== 'string' || !isValidChapterRef(x.ref) || !isTime(x.readAt)) {
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

function parseState(x: unknown): AppState {
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
    if (!isObj(a) || !isPlanId(a.id) || !isTime(a.startedAt)) throw new BackupError('plano inválido')
    activePlan = { id: a.id, startedAt: a.startedAt }
  }
  return { lastPosition, activePlan }
}

export function parseBackup(text: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('não é JSON')
  }
  if (!isObj(raw) || raw.app !== 'selah') throw new BackupError('não é um backup do Selah')
  if (raw.version !== BACKUP_VERSION) throw new BackupError('versão não suportada')
  if (!Array.isArray(raw.readings)) throw new BackupError('leituras ausentes')
  return {
    readings: raw.readings.map(parseReading),
    settings: parseSettings(raw.settings),
    state: parseState(raw.state),
  }
}
