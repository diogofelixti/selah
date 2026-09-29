import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test } from '@playwright/test'

// O app de verdade (dist/) servido pelo nginx com a configuração do frodo, num container.
// Qualquer violação da política de segurança (CSP) durante o uso falha o teste.
test.use({ locale: 'pt-BR', ignoreHTTPSErrors: true })
test.describe.configure({ mode: 'serial' })

const PORT = 18444
const BASE = `https://selah.selatech.com.br:${PORT}`
let container = ''
let certs = ''

test.beforeAll(async () => {
  test.setTimeout(60_000)
  certs = mkdtempSync(join(tmpdir(), 'selah-certs-'))
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(certs, 'selatech.key'), '-out', join(certs, 'selatech.pem'), '-days', '1', '-subj', '/CN=selah'], { stdio: 'ignore' })
  container = execFileSync('docker', [
    'run', '-d', '--rm', '-p', `127.0.0.1:${PORT}:443`,
    '-v', `${certs}:/etc/ssl/cloudflare:ro`,
    '-v', `${resolve('dist')}:/srv/selah/app:ro`,
    '-v', `${resolve('deploy/nginx/selah.conf')}:/etc/nginx/conf.d/default.conf:ro`,
    'nginx:alpine',
  ], { encoding: 'utf8' }).trim()
  await new Promise((r) => setTimeout(r, 1500))
})

test.afterAll(() => {
  if (container) execFileSync('docker', ['rm', '-f', container])
  if (certs) rmSync(certs, { recursive: true, force: true })
})

test('o app funciona com a política de segurança do nginx, sem violações', async ({ browser }) => {
  void browser
  // Navegador próprio: o nome selah.selatech.com.br aponta para o container local.
  const b = await (await import('@playwright/test')).chromium.launch({
    args: [`--host-resolver-rules=MAP selah.selatech.com.br 127.0.0.1`],
  })
  const page = await (await b.newContext({ locale: 'pt-BR', ignoreHTTPSErrors: true, viewport: { width: 412, height: 900 } })).newPage()
  const violations: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violations.push(m.text())
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      ;(window as unknown as { __csp: string[] }).__csp ??= []
      ;(window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })
  // Sem API neste teste: o login aparece como disponível para carregar o script real do Google.
  await page.route('**/api/auth/config', (r) => r.fulfill({ json: { googleClientId: 'teste.apps.googleusercontent.com' } }))

  const res = await page.goto(`${BASE}/`)
  expect(res!.headers()['content-security-policy']).toContain("default-src 'self'")
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /aurora|noite/)

  await page.goto(`${BASE}/#/ler/JHN/3`)
  await expect(page.locator('#v16')).toBeVisible()
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Compartilhar' }).click()
  await expect(page.getByRole('button', { name: 'Imagem' })).toBeEnabled()

  await page.goto(`${BASE}/#/ajustes`)
  await page.getByLabel('Pergaminho (claro, ilustrado)').check()
  await page.goto(`${BASE}/#/marcacoes`)
  await expect(page.locator('.empty')).toBeVisible()
  await page.goto(`${BASE}/#/ajustes`)
  // O botão real do Google (iframe de accounts.google.com) aparece.
  await expect(page.locator('.google iframe, .google div[role=button]').first()).toBeVisible({ timeout: 15_000 })

  const fromPage = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
  await b.close()
  expect([...violations, ...fromPage]).toEqual([])
})
