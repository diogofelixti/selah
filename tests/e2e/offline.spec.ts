import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('baixa a Bíblia e continua lendo sem internet', async ({ page, context }) => {
  await page.goto('/#/ajustes')
  await expect(page.getByText('Disponível offline ✓')).toBeVisible({ timeout: 60_000 })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await context.setOffline(true)
  await page.goto('/#/ler/ROM/8')
  await page.reload()
  await expect(page.locator('#v1')).toBeVisible()
  await expect(page.locator('#v28')).not.toBeEmpty()
})

test('tem manifesto instalável', async ({ page }) => {
  await page.goto('/')
  const href = await page.locator('link[rel=manifest]').getAttribute('href')
  const manifest = await (await page.request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'Selah · Leitura bíblica', short_name: 'Selah', display: 'standalone', start_url: '/' })
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
})
