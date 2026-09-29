import { emptyDoc, mergeSync, readingId, type SyncDoc } from '../../server/src/sync-doc'
import { createMemoryRepository, openRepository } from './storage/repository'
import { applyDoc, buildDoc } from './sync/local-doc'
import {
  DEFAULT_SETTINGS, DEFAULT_STATE, EMPTY_SYNC_META, isEmptyMark, type AppData, type AppState, type MarkColor, type Reading,
  type Repository, type Settings, type SyncMeta, type VerseMark,
} from './storage/types'

export const app = $state({
  ready: false,
  persistent: true,
  /** Outra janela com versão antiga do app segura o banco. */
  blocked: false,
  /** true quando a última gravação no aparelho falhou (espaço cheio, banco fechado pelo sistema). */
  saveError: false,
  readings: [] as Reading[],
  marks: [] as VerseMark[],
  settings: { ...DEFAULT_SETTINGS } as Settings,
  state: { ...DEFAULT_STATE } as AppState,
  syncMeta: structuredClone(EMPTY_SYNC_META) as SyncMeta,
  /** Aumenta a cada mudança que precisa ir para a conta (a sincronização observa). */
  changes: 0,
})

let repo: Repository | null = null

function store(): Repository {
  if (!repo) throw new Error('initApp() precisa rodar antes')
  return repo
}

async function load(r: Repository): Promise<void> {
  const [readings, settings, state, marks, syncMeta] = await Promise.all([
    r.getReadings(), r.getSettings(), r.getState(), r.getMarks(), r.getSyncMeta(),
  ])
  repo = r
  app.readings = readings
  app.settings = settings
  app.state = state
  app.marks = marks
  app.syncMeta = syncMeta
  app.persistent = r.persistent
  app.blocked = r.blocked ?? false
}

const openDefault = () => openRepository({ onVersionChange: () => location.reload() })

export async function initApp(open: () => Promise<Repository> = openDefault): Promise<void> {
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

// Uma mudança nos dados por vez (e a aplicação da sincronização entra na mesma fila): assim o resultado
// de uma sincronização nunca é aplicado no meio de uma gravação, nem entre os dados e o registro dela.
let queue: Promise<unknown> = Promise.resolve()
function exclusive<T>(run: () => Promise<T>): Promise<T> {
  const next = queue.then(run, run)
  queue = next.catch(() => {})
  return next
}

/** Registra o que a sincronização precisa saber sobre uma mudança e avisa que há algo a enviar. */
async function recordSync(change: (meta: SyncMeta) => void): Promise<void> {
  const next = $state.snapshot(app.syncMeta)
  change(next)
  await save(() => store().saveSyncMeta(next), () => (app.syncMeta = next))
  app.changes++
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
  await guarded([ref], () => exclusive(async () => {
    const reading = { ref, readAt: Date.now() }
    await save(() => store().addReading(reading), () => (app.readings = [...app.readings, reading]))
    if (!app.saveError) app.changes++
  }))
}

/** Identidades das leituras de um capítulo neste aparelho (o que a desmarcação remove em todos). */
const readingIdsOf = (refs: Set<string>) => app.readings.filter((r) => refs.has(r.ref)).map((r) => readingId(r.ref, r.readAt))

export async function unmarkRead(ref: string): Promise<void> {
  await guarded([ref], () => exclusive(async () => {
    const ids = readingIdsOf(new Set([ref]))
    await save(() => store().removeReadingsFor(ref), () => (app.readings = app.readings.filter((r) => r.ref !== ref)))
    if (!app.saveError) await recordSync((m) => (m.removedReadings = [...new Set([...m.removedReadings, ...ids])]))
  }))
}

export async function markMany(refs: readonly string[]): Promise<void> {
  await guarded(refs, (free) => exclusive(async () => {
    const now = Date.now()
    const readings = free.map((ref) => ({ ref, readAt: now }))
    await save(() => store().addReadings(readings), () => (app.readings = [...app.readings, ...readings]))
    if (!app.saveError) app.changes++
  }))
}

export async function unmarkMany(refs: readonly string[]): Promise<void> {
  await guarded(refs, (free) => exclusive(async () => {
    const remove = new Set(free)
    const ids = readingIdsOf(remove)
    await save(
      () => store().removeReadingsForMany(free),
      () => (app.readings = app.readings.filter((r) => !remove.has(r.ref))),
    )
    if (!app.saveError) await recordSync((m) => (m.removedReadings = [...new Set([...m.removedReadings, ...ids])]))
  }))
}

/** Aplica cor e/ou nota a versículos. Sem cor e sem nota, a marcação é apagada. */
export async function setMarks(refs: readonly string[], patch: { color?: MarkColor | null; note?: string }): Promise<void> {
  const keys = refs.map((ref) => `mark:${ref}`)
  await guarded(keys, (free) => exclusive(async () => {
    const now = Date.now()
    const byRef = new Map(app.marks.map((m) => [m.ref, $state.snapshot(m)]))
    const next: VerseMark[] = free.map((key) => {
      const ref = key.slice('mark:'.length)
      const current = byRef.get(ref) ?? { ref, color: null, note: '', updatedAt: now }
      return { ...current, ...patch, note: (patch.note ?? current.note).trim(), updatedAt: now }
    })
    await save(
      () => store().saveMarks(next),
      () => {
        const changed = new Set(next.map((m) => m.ref))
        app.marks = [...app.marks.filter((m) => !changed.has(m.ref)), ...next.filter((m) => !isEmptyMark(m))]
      },
    )
    if (!app.saveError) {
      await recordSync((meta) => {
        for (const m of next) {
          if (isEmptyMark(m)) meta.removedMarks[m.ref] = m.updatedAt
          else delete meta.removedMarks[m.ref]
        }
      })
    }
  }))
}

// $state.snapshot: o IndexedDB não consegue clonar os proxies reativos do Svelte.
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...$state.snapshot(app.settings), ...patch }
  await save(() => store().saveSettings(next), () => (app.settings = next))
}

export function updateState(patch: Partial<AppState>): Promise<void> {
  return exclusive(async () => {
    const next = { ...$state.snapshot(app.state), ...patch }
    await save(() => store().saveState(next), () => (app.state = next))
    if (app.saveError) return
    const now = Date.now()
    await recordSync((m) => {
      if ('activePlan' in patch) m.activePlanAt = now
      if ('lastPosition' in patch) m.lastPositionAt = now
    })
  })
}

/** Retorna false se não conseguiu gravar (app.saveError fica ligado). */
export function replaceData(data: AppData): Promise<boolean> {
  return exclusive(async () => {
    await save(() => store().replaceAll(data), () => {
      app.readings = data.readings
      app.settings = data.settings
      app.state = data.state
      app.marks = data.marks
    })
    if (app.saveError) return false
    // Com conta, o backup se junta à conta na próxima sincronização. Plano e posição importados são a
    // escolha mais recente da pessoa: valem sobre os da conta.
    const now = Date.now()
    await recordSync((m) => {
      m.activePlanAt = now
      m.lastPositionAt = now
    })
    return !app.saveError
  })
}

export function clearData(): Promise<boolean> {
  return exclusive(async () => {
    await save(() => store().clearAll(), () => {
      app.readings = []
      app.settings = { ...DEFAULT_SETTINGS }
      app.state = { ...DEFAULT_STATE }
      app.marks = []
      app.syncMeta = structuredClone(EMPTY_SYNC_META)
    })
    return !app.saveError
  })
}

/**
 * Junta o documento que veio da conta com o que está no aparelho agora e grava, na fila das mudanças.
 * `stillValid` é conferido já com a vez garantida: depois de sair da conta, nada é aplicado.
 * Não conta como mudança local, senão cada sincronização dispararia outra.
 */
export function mergeRemote(remote: SyncDoc, stillValid: () => boolean): Promise<'applied' | 'unchanged' | 'stale' | 'failed'> {
  return exclusive(async () => {
    if (!stillValid()) return 'stale'
    const local = buildDoc($state.snapshot(app), $state.snapshot(app.syncMeta))
    const final = mergeSync(remote, local)
    // Documentos canônicos (a junção sempre monta as chaves na mesma ordem): comparar o texto basta.
    if (JSON.stringify(final) === JSON.stringify(mergeSync(local, emptyDoc()))) return 'unchanged'
    const out = applyDoc(final, $state.snapshot(app.state), $state.snapshot(app.syncMeta))
    await save(() => store().applySync({ readings: out.readings, marks: out.marks, state: out.state }, out.meta), () => {
      app.readings = out.readings
      app.marks = out.marks
      app.state = out.state
      app.syncMeta = out.meta
    })
    return app.saveError ? 'failed' : 'applied'
  })
}

export function snapshot(): AppData {
  return {
    readings: $state.snapshot(app.readings),
    settings: $state.snapshot(app.settings),
    state: $state.snapshot(app.state),
    marks: $state.snapshot(app.marks),
  }
}
