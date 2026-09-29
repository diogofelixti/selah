import { expect, test, type Page } from '@playwright/test'
import { emptyDoc, mergeSync, type SyncDoc } from '../../server/src/sync-doc'

test.use({ locale: 'pt-BR' })

/** Botão do Google falso: ao tocar, entrega uma credencial como faria o Google. */
const FAKE_GIS = `
  window.google = { accounts: { id: {
    initialize(o) { window.__gis = o },
    renderButton(el) {
      const b = document.createElement('button')
      b.textContent = 'Entrar com o Google'
      b.onclick = () => window.__gis.callback({ credential: 'credencial-google' })
      el.appendChild(b)
    },
  } } }
`

type Call = { method: string; path: string; auth: string | null }

/** API falsa: guarda o documento da conta e junta com o que chega, como o servidor. */
async function fakeApi(page: Page, opts: { clientId?: string | null; remote?: SyncDoc } = {}) {
  let stored = opts.remote ?? emptyDoc()
  const calls: Call[] = []
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_GIS }),
  )
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace(/^\/api/, '')
    calls.push({ method: req.method(), path, auth: req.headers()['authorization'] ?? null })
    if (path === '/auth/config') return route.fulfill({ json: { googleClientId: opts.clientId === undefined ? 'id-teste' : opts.clientId } })
    if (path === '/auth/google') return route.fulfill({ json: { token: 't'.repeat(43), email: 'ana@gmail.com' } })
    if (path === '/sync') {
      stored = mergeSync(stored, JSON.parse(req.postData()!) as SyncDoc)
      return route.fulfill({ json: stored })
    }
    return route.fulfill({ status: 204 })
  })
  return {
    calls,
    get stored() {
      return stored
    },
    set stored(doc: SyncDoc) {
      stored = doc
    },
  }
}

const T = Date.now() - 3_600_000

test('sem client ID no servidor, a conta aparece como "Em breve"', async ({ page }) => {
  await fakeApi(page, { clientId: null })
  await page.goto('/#/ajustes')
  await expect(page.getByText(/Em breve: entre com sua conta Google/)).toBeVisible()
})

test('entrar traz os dados da conta e o que se marca depois vai para a conta', async ({ page }) => {
  const api = await fakeApi(page, { remote: { ...emptyDoc(), readings: [['GEN.1', T], ['GEN.2', T]] } })
  await page.goto('/#/ajustes')
  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await expect(page.getByText('Conectado como ana@gmail.com')).toBeVisible()
  await expect(page.getByText('Sincronizado agora')).toBeVisible()
  expect(api.calls.find((c) => c.path === '/sync')?.auth).toBe(`Bearer ${'t'.repeat(43)}`)

  await page.goto('/')
  await expect(page.getByText('2 de 1.189 capítulos')).toBeVisible()

  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  await expect.poll(() => api.stored.readings.map(([ref]) => ref), { timeout: 10_000 }).toContain('JHN.1')

  // A sessão continua ao recarregar.
  await page.goto('/#/ajustes')
  await page.reload()
  await expect(page.getByText('Conectado como ana@gmail.com')).toBeVisible()
})

test('sair e excluir conta mantêm os dados no aparelho', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  const api = await fakeApi(page, { remote: { ...emptyDoc(), readings: [['GEN.1', T]] } })
  await page.goto('/#/ajustes')
  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await expect(page.getByText('Conectado como ana@gmail.com')).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByText('Você saiu da conta. Os dados continuam neste aparelho.')).toBeVisible()
  expect(api.calls.some((c) => c.method === 'POST' && c.path === '/auth/logout')).toBe(true)
  await expect(page.getByRole('button', { name: 'Entrar com o Google' })).toBeVisible()

  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await page.getByRole('button', { name: 'Excluir conta' }).click()
  await expect(page.getByText('Conta excluída. Os dados deste aparelho continuam.')).toBeVisible()
  expect(api.calls.some((c) => c.method === 'DELETE' && c.path === '/account')).toBe(true)

  await page.goto('/')
  await expect(page.getByText('1 de 1.189 capítulos')).toBeVisible()
})

test('apagar os dados com conta sai da conta antes, e nada volta da conta', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  const api = await fakeApi(page, { remote: { ...emptyDoc(), readings: [['GEN.1', T]] } })
  await page.goto('/#/ajustes')
  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await expect(page.getByText('Sincronizado agora')).toBeVisible()
  await page.getByRole('button', { name: 'Apagar dados' }).click()
  await expect(page.getByRole('button', { name: 'Entrar com o Google' })).toBeVisible()
  expect(api.calls.some((c) => c.path === '/auth/logout')).toBe(true)
  await page.goto('/')
  await expect(page.getByText('0 de 1.189 capítulos')).toBeVisible()
  await page.waitForTimeout(4000)
  await expect(page.getByText('0 de 1.189 capítulos')).toBeVisible()
})

test('com o leitor aberto, a posição que veio de outro aparelho não é sobrescrita', async ({ page }) => {
  const api = await fakeApi(page)
  await page.goto('/#/ajustes')
  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await expect(page.getByText('Sincronizado agora')).toBeVisible()
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v16')).toBeVisible()
  await expect.poll(() => api.stored.lastPosition.value?.book, { timeout: 10_000 }).toBe('JHN')

  // Outro aparelho abriu Gênesis 1 depois.
  api.stored = { ...api.stored, lastPosition: { value: { book: 'GEN', chapter: 1 }, at: Date.now() + 1000 } }
  // Voltar ao app dispara a sincronização.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.waitForTimeout(8000)
  expect(api.stored.lastPosition.value).toEqual({ book: 'GEN', chapter: 1 })
})
