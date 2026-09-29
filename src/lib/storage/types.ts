import type { LanguageSetting } from '../i18n/lang'
import type { PlanId } from '../plans/catalog'
import type { Reading } from '../progress/progress'

export type { Reading }

export const THEMES = ['auto', 'aurora', 'noite', 'pergaminho', 'oliveira'] as const
export type Theme = (typeof THEMES)[number]

export const FONT_SIZES = [1, 2, 3, 4] as const
export type FontSize = (typeof FONT_SIZES)[number]

/** Lembrete diário: ligado neste aparelho e hora local "HH:MM". */
export interface ReminderSetting {
  enabled: boolean
  time: string
}

export const DEFAULT_REMINDER: ReminderSetting = { enabled: false, time: '07:00' }
export const isReminderTime = (x: unknown): x is string => typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x)

export interface Settings {
  language: LanguageSetting
  theme: Theme
  fontSize: FontSize
  reminder: ReminderSetting
}

export interface AppState {
  lastPosition: { book: string; chapter: number } | null
  activePlan: { id: PlanId; startedAt: number } | null
}

export const MARK_COLORS = ['gold', 'green', 'blue'] as const
export type MarkColor = (typeof MARK_COLORS)[number]
export const NOTE_MAX = 1000

/** Destaque e/ou nota de um versículo. Sem cor e sem nota, a marcação deixa de existir. */
export interface VerseMark {
  ref: string
  color: MarkColor | null
  note: string
  updatedAt: number
}

export const isEmptyMark = (m: VerseMark) => m.color === null && m.note.trim() === ''

export interface AppData {
  readings: Reading[]
  settings: Settings
  state: AppState
  marks: VerseMark[]
}

export const DEFAULT_SETTINGS: Settings = { language: 'auto', theme: 'auto', fontSize: 2, reminder: DEFAULT_REMINDER }
export const DEFAULT_STATE: AppState = { lastPosition: null, activePlan: null }

export interface Repository {
  /** false quando os dados só vivem na memória e somem ao fechar o app. */
  persistent: boolean
  /** true quando outra janela com versão antiga do app segura o banco. */
  blocked?: boolean
  getReadings(): Promise<Reading[]>
  addReading(reading: Reading): Promise<void>
  removeReadingsFor(ref: string): Promise<void>
  /** Grava várias leituras de uma vez: ou todas, ou nenhuma. */
  addReadings(readings: readonly Reading[]): Promise<void>
  /** Apaga as leituras de vários capítulos de uma vez: ou todas, ou nenhuma. */
  removeReadingsForMany(refs: readonly string[]): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  getState(): Promise<AppState>
  saveState(state: AppState): Promise<void>
  getMarks(): Promise<VerseMark[]>
  /** Grava várias marcações de uma vez (ou todas, ou nenhuma); as vazias são apagadas. */
  saveMarks(marks: readonly VerseMark[]): Promise<void>
  replaceAll(data: AppData): Promise<void>
  clearAll(): Promise<void>
}
