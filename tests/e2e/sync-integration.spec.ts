import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import { expect, test, type Browser, type Page } from '@playwright/test'

// Ponta a ponta de verdade: Postgres num container, a API do Selah (com o verificador de teste do Google,
// que só existe fora de produção) e um preview do app apontando para ela. Dois "aparelhos" na mesma conta.
test.use({ locale: 'pt-BR' })
test.describe.configure({ mode: 'serial' })

const API_PORT = 8797
const APP_PORT = 4192
const APP = `http://localhost:${APP_PORT}`
let db = ''
let api: ChildProcess
let preview: ChildProcess

const FAKE_GIS = `
  window.google = { accounts: { id: {
    initialize(o) { window.__gis = o },
    renderButton(el) {
      const b = document.createElement('button')
      b.textContent = 'Entrar com o Google'
      b.onclick = () => window.__gis.callback({ credential: 'teste:ana:ana@gmail.com' })
      el.appendChild(b)
    },
  } } }
`

async function waitFor(url: string) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`não respondeu: ${url}`)
}

test.beforeAll(async () => {
  test.setTimeout(120_000)
  const docker = (...args: string[]) => execFileSync('docker', args, { encoding: 'utf8' }).trim()
  db = docker('run', '-d', '--rm', '-e', 'POSTGRES_PASSWORD=test', '-p', '127.0.0.1::5432', 'postgres:16-alpine')
  const port = docker('port', db, '5432/tcp').split(':').pop()
  for (let i = 0; ; i++) {
    try {
      docker('exec', db, 'pg_isready', '-U', 'postgres', '-h', '127.0.0.1')
      break
    } catch (err) {
      if (i > 60) throw err
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  const webpush = createRequire(import.meta.url)('../../server/node_modules/web-push') as { generateVAPIDKeys(): { publicKey: string; privateKey: string } }
  const keys = webpush.generateVAPIDKeys()
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    DATABASE_URL: `postgres://postgres:test@127.0.0.1:${port}/postgres`,
    PORT: String(API_PORT),
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    VAPID_SUBJECT: 'mailto:teste@selah.local',
    AUTH_TEST: '1',
  }
  // Grupos próprios: no fim, derruba o npx e o node filho juntos.
  api = spawn('npx', ['tsx', 'src/main.ts'], { cwd: 'server', env, stdio: 'ignore', detached: true })
  await waitFor(`http://127.0.0.1:${API_PORT}/api/health`)
  preview = spawn('npx', ['vite', 'preview', '--port', String(APP_PORT), '--strictPort'], {
    env: { ...process.env, SELAH_API: `http://127.0.0.1:${API_PORT}` },
    stdio: 'ignore',
    detached: true,
  })
  await waitFor(APP)
})

test.afterAll(() => {
  for (const p of [api, preview]) {
    try {
      if (p?.pid) process.kill(-p.pid)
    } catch {
      // já tinha saído
    }
  }
  if (db) execFileSync('docker', ['rm', '-f', db])
})

async function device(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: 'pt-BR' })
  const page = await context.newPage()
  await page.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({ contentType: 'text/javascript', body: FAKE_GIS }))
  await page.goto(`${APP}/#/ajustes`)
  await page.getByRole('button', { name: 'Entrar com o Google' }).click()
  await expect(page.getByText('Conectado como ana@gmail.com')).toBeVisible()
  return page
}

async function markChapter(page: Page, book: string, chapter: number) {
  await page.goto(`${APP}/#/ler/${book}/${chapter}`)
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
}

const progress = async (page: Page) => {
  await page.goto(`${APP}/`)
  return page.getByText(/\d+ de 1\.189 capítulos/).textContent()
}

test('o que um aparelho marca aparece no outro, nos dois sentidos', async ({ browser }) => {
  const phone = await device(browser)
  await markChapter(phone, 'JHN', 1)
  const laptop = await device(browser)
  await expect.poll(() => progress(laptop), { timeout: 15_000 }).toBe('1 de 1.189 capítulos')

  // O notebook envia a mudança (3 s depois de marcar); o celular recebe ao abrir o app de novo.
  const sent = laptop.waitForResponse((r) => r.url().endsWith('/api/sync') && r.request().method() === 'POST', { timeout: 15_000 })
  await markChapter(laptop, 'GEN', 1)
  await sent
  await phone.goto(`${APP}/`)
  await phone.reload()
  await expect(phone.getByText('2 de 1.189 capítulos')).toBeVisible({ timeout: 15_000 })
})
