import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR', permissions: ['clipboard-read', 'clipboard-write'] })

const clipboard = (page: import('@playwright/test').Page) => page.evaluate(() => navigator.clipboard.readText())

test('seleciona versículos, copia no formato certo e limpa a seleção', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v17').click()
  await page.locator('#v16').click()
  await expect(page.locator('#v16')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('2 versículos')).toBeVisible()
  await page.getByRole('button', { name: 'Copiar', exact: true }).click()
  await expect(page.getByText('Copiado')).toBeVisible()
  const text = await clipboard(page)
  expect(text).toMatch(/^16 Porque Deus amou ao mundo/)
  expect(text).toMatch(/João 3:16-17 \(BLIVRE\)$/)
  await expect(page.locator('#v16')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('2 versículos')).toHaveCount(0)
})

test('tocar de novo tira da seleção, e cancelar limpa tudo', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v1').click()
  await page.locator('#v2').click()
  await page.locator('#v2').click()
  await expect(page.getByText('1 versículo', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('[aria-pressed="true"].verse')).toHaveCount(0)
})

test('trocar de capítulo limpa a seleção', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v1').click()
  await page.goto('/#/ler/JHN/4')
  await expect(page.locator('#v1')).toBeVisible()
  await expect(page.getByText('1 versículo', { exact: true })).toHaveCount(0)
})

test('copia sem a API moderna (rede local sem HTTPS)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Copiar', exact: true }).click()
  await expect(page.getByText('Copiado')).toBeVisible()
})
