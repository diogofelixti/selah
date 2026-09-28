import { openRepository } from './storage/repository'
import {
  DEFAULT_SETTINGS, DEFAULT_STATE, type AppData, type AppState, type Reading, type Repository, type Settings,
} from './storage/types'

export const app = $state({
  ready: false,
  persistent: true,
  readings: [] as Reading[],
  settings: { ...DEFAULT_SETTINGS } as Settings,
  state: { ...DEFAULT_STATE } as AppState,
})

let repo: Repository | null = null

function store(): Repository {
  if (!repo) throw new Error('initApp() precisa rodar antes')
  return repo
}

export async function initApp(): Promise<void> {
  repo = await openRepository()
  const [readings, settings, state] = await Promise.all([repo.getReadings(), repo.getSettings(), repo.getState()])
  app.readings = readings
  app.settings = settings
  app.state = state
  app.persistent = repo.persistent
  app.ready = true
}

export async function markRead(ref: string): Promise<void> {
  const reading = { ref, readAt: Date.now() }
  await store().addReading(reading)
  app.readings = [...app.readings, reading]
}

export async function unmarkRead(ref: string): Promise<void> {
  await store().removeReadingsFor(ref)
  app.readings = app.readings.filter((r) => r.ref !== ref)
}

// $state.snapshot: o IndexedDB não consegue clonar os proxies reativos do Svelte.
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...$state.snapshot(app.settings), ...patch }
  await store().saveSettings(next)
  app.settings = next
}

export async function updateState(patch: Partial<AppState>): Promise<void> {
  const next = { ...$state.snapshot(app.state), ...patch }
  await store().saveState(next)
  app.state = next
}

export async function replaceData(data: AppData): Promise<void> {
  await store().replaceAll(data)
  app.readings = data.readings
  app.settings = data.settings
  app.state = data.state
}

export async function clearData(): Promise<void> {
  await store().clearAll()
  app.readings = []
  app.settings = { ...DEFAULT_SETTINGS }
  app.state = { ...DEFAULT_STATE }
}

export function snapshot(): AppData {
  return {
    readings: $state.snapshot(app.readings),
    settings: $state.snapshot(app.settings),
    state: $state.snapshot(app.state),
  }
}
