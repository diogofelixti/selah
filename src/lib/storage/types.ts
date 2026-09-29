import type { LanguageSetting } from '../i18n/lang'
import type { PlanId } from '../plans/catalog'
import type { Reading } from '../progress/progress'

export type { Reading }

export const THEMES = ['auto', 'aurora', 'noite'] as const
export type Theme = (typeof THEMES)[number]

export const FONT_SIZES = [1, 2, 3, 4] as const
export type FontSize = (typeof FONT_SIZES)[number]

export interface Settings {
  language: LanguageSetting
  theme: Theme
  fontSize: FontSize
}

export interface AppState {
  lastPosition: { book: string; chapter: number } | null
  activePlan: { id: PlanId; startedAt: number } | null
}

export interface AppData {
  readings: Reading[]
  settings: Settings
  state: AppState
}

export const DEFAULT_SETTINGS: Settings = { language: 'auto', theme: 'auto', fontSize: 2 }
export const DEFAULT_STATE: AppState = { lastPosition: null, activePlan: null }

export interface Repository {
  /** false quando os dados só vivem na memória e somem ao fechar o app. */
  persistent: boolean
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
  replaceAll(data: AppData): Promise<void>
  clearAll(): Promise<void>
}
