import { parseRoute, type Route } from './router'

export const router = $state({ route: parseRoute(location.hash) as Route })

// Cada entrada do histórico criada dentro do app ganha um índice em history.state.
// Índice 0 é a entrada por onde a pessoa chegou; voltar dali sairia do app.
const initial = (history.state as { selahIndex?: unknown } | null)?.selahIndex
let index = typeof initial === 'number' ? initial : 0
if (typeof initial !== 'number') history.replaceState({ ...history.state, selahIndex: 0 }, '')

window.addEventListener('hashchange', () => {
  const current = (history.state as { selahIndex?: unknown } | null)?.selahIndex
  if (typeof current === 'number') {
    index = current
  } else {
    index += 1
    history.replaceState({ ...history.state, selahIndex: index }, '')
  }
  router.route = parseRoute(location.hash)
})

/** true se voltar no histórico continua dentro do app. */
export function canGoBack(): boolean {
  return index > 0
}
