import { parseRoute, type Route } from './router'

export const router = $state({ route: parseRoute(location.hash) as Route })

window.addEventListener('hashchange', () => {
  router.route = parseRoute(location.hash)
})
