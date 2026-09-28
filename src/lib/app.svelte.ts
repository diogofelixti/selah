import { createMemoryRepository, openRepository } from './storage/repository'
import {
  DEFAULT_SETTINGS, DEFAULT_STATE, type AppData, type AppState, type Reading, type Repository, type Settings,
} from './storage/types'

export const app = $state({
  ready: false,
  persistent: true,
  /** true quando a última gravação no aparelho falhou (espaço cheio, banco fechado pelo sistema). */
  saveError: false,
  readings: [] as Reading[],
  settings: { ...DEFAULT_SETTINGS } as Settings,
  state: { ...DEFAULT_STATE } as AppState,
})

let repo: Repository | null = null

function store(): Repository {
  if (!repo) throw new Error('initApp() precisa rodar antes')
  return repo
}

async function load(r: Repository): Promise<void> {
  const [readings, settings, state] = await Promise.all([r.getReadings(), r.getSettings(), r.getState()])
  repo = r
  app.readings = readings
  app.settings = settings
  app.state = state
  app.persistent = r.persistent
}

export async function initApp(open: () => Promise<Repository> = openRepository): Promise<void> {
  try {
    await load(await open())
  } catch {
    // Banco inacessível: o app abre mesmo assim, só na memória, e o aviso de dados não salvos aparece.
    await load(createMemoryRepository())
  }
  app.ready = true
}

/** Grava no aparelho e só atualiza a tela se deu certo; se falhar, liga o aviso de erro. */
async function save(write: () => Promise<void>, apply: () => void): Promise<void> {
  try {
    await write()
  } catch {
    app.saveError = true
    return
  }
  app.saveError = false
  apply()
}

// Capítulos com gravação em andamento. A tela só muda depois que o aparelho confirma a gravação,
// então um segundo toque rápido veria o estado antigo; esses toques são ignorados.
const inFlight = new Set<string>()

async function guarded(refs: readonly string[], run: (refs: string[]) => Promise<void>): Promise<void> {
  const free = [...new Set(refs)].filter((ref) => !inFlight.has(ref))
  if (free.length === 0) return
  for (const ref of free) inFlight.add(ref)
  try {
    await run(free)
  } finally {
    for (const ref of free) inFlight.delete(ref)
  }
}

export async function markRead(ref: string): Promise<void> {
  await guarded([ref], async () => {
    const reading = { ref, readAt: Date.now() }
    await save(() => store().addReading(reading), () => (app.readings = [...app.readings, reading]))
  })
}

export async function unmarkRead(ref: string): Promise<void> {
  await guarded([ref], async () => {
    await save(() => store().removeReadingsFor(ref), () => (app.readings = app.readings.filter((r) => r.ref !== ref)))
  })
}

export async function markMany(refs: readonly string[]): Promise<void> {
  await guarded(refs, async (free) => {
    const now = Date.now()
    const readings = free.map((ref) => ({ ref, readAt: now }))
    await save(() => store().addReadings(readings), () => (app.readings = [...app.readings, ...readings]))
  })
}

export async function unmarkMany(refs: readonly string[]): Promise<void> {
  await guarded(refs, async (free) => {
    const remove = new Set(free)
    await save(
      () => store().removeReadingsForMany(free),
      () => (app.readings = app.readings.filter((r) => !remove.has(r.ref))),
    )
  })
}

// $state.snapshot: o IndexedDB não consegue clonar os proxies reativos do Svelte.
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...$state.snapshot(app.settings), ...patch }
  await save(() => store().saveSettings(next), () => (app.settings = next))
}

export async function updateState(patch: Partial<AppState>): Promise<void> {
  const next = { ...$state.snapshot(app.state), ...patch }
  await save(() => store().saveState(next), () => (app.state = next))
}

/** Retorna false se não conseguiu gravar (app.saveError fica ligado). */
export async function replaceData(data: AppData): Promise<boolean> {
  await save(() => store().replaceAll(data), () => {
    app.readings = data.readings
    app.settings = data.settings
    app.state = data.state
  })
  return !app.saveError
}

export async function clearData(): Promise<boolean> {
  await save(() => store().clearAll(), () => {
    app.readings = []
    app.settings = { ...DEFAULT_SETTINGS }
    app.state = { ...DEFAULT_STATE }
  })
  return !app.saveError
}

export function snapshot(): AppData {
  return {
    readings: $state.snapshot(app.readings),
    settings: $state.snapshot(app.settings),
    state: $state.snapshot(app.state),
  }
}
