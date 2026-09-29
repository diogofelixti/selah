import { spawn, type ChildProcess } from 'node:child_process'
import { appendFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

// O navegador busca o sw.js direto no servidor (o Playwright não intercepta esse pedido). Por isso este teste
// serve uma cópia do dist/ numa porta própria e troca o sw.js de verdade, como numa publicação nova.
const PORT = 4191
const BASE = `http://localhost:${PORT}`
let dir = ''
let server: ChildProcess

test.beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'selah-sw-'))
  cpSync('dist', dir, { recursive: true })
  server = spawn('npx', ['vite', 'preview', '--outDir', dir, '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    // Grupo próprio: no fim, derruba o npx e o node filho juntos.
    detached: true,
  })
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('servidor de teste não subiu')
})

test.afterAll(() => {
  try {
    if (server?.pid) process.kill(-server.pid)
  } catch {
    // já tinha saído
  }
  rmSync(dir, { recursive: true, force: true })
})

const waiting = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting)

test('versão nova do service worker espera o aceite e só então assume', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)

  // Publicação nova: o mesmo sw.js com um byte diferente.
  appendFileSync(join(dir, 'sw.js'), '\n// versão nova\n')
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update())

  // A nova fica esperando; a atual continua no controle até a pessoa aceitar.
  await expect.poll(() => waiting(page)).toBe(true)
  await expect(page.getByText('Nova versão disponível.')).toBeVisible()
  await page.waitForTimeout(1000)
  expect(await waiting(page)).toBe(true)

  // Marca a página atual: se ela recarregar, a marca some.
  await page.evaluate(() => ((window as unknown as { __old: boolean }).__old = true))
  await page.getByRole('button', { name: 'Atualizar' }).click()
  // Durante a recarga a consulta pode falhar; conta como "ainda não".
  await expect.poll(() => page.evaluate(() => (window as unknown as { __old?: boolean }).__old ?? false).catch(() => true)).toBe(false)
  expect(await waiting(page)).toBe(false)
  await expect(page.getByText('Versículo do dia')).toBeVisible()
})
