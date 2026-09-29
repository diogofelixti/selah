import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

const NT = new Set(['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'])

test('busca pela aba Ler e destaca as palavras encontradas', async ({ page }) => {
  await page.goto('/#/biblia')
  await page.getByRole('link', { name: 'Buscar na Bíblia' }).click()
  await expect(page).toHaveURL(/#\/busca/)
  await page.getByRole('searchbox', { name: 'Buscar na Bíblia' }).fill('amou mundo')
  const result = page.getByRole('link', { name: /João 3:16/ })
  await expect(result).toBeVisible({ timeout: 20_000 })
  await expect(result.locator('mark').first()).toHaveText(/amou|mundo/i)
})

test('ignora acentos', async ({ page }) => {
  await page.goto('/#/busca/misericordia')
  await expect(page.locator('.results mark').first()).toHaveText(/misericórdia/i, { timeout: 20_000 })
})

test('filtra pelo Novo Testamento', async ({ page }) => {
  await page.goto('/#/busca/misericordia')
  await expect(page.locator('.results a').first()).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Novo', exact: true }).click()
  await expect(page.locator('.results a').first()).toBeVisible()
  const books = await page.locator('.results a').evaluateAll((els) => els.map((a) => a.getAttribute('href')!.split('/')[2]))
  expect(books.length).toBeGreaterThan(0)
  expect(books.every((b) => NT.has(b))).toBe(true)
})

test('tocar num resultado abre o versículo no leitor', async ({ page }) => {
  await page.goto('/#/busca/amou%20mundo')
  await page.getByRole('link', { name: /João 3:16/ }).click({ timeout: 20_000 })
  await expect(page).toHaveURL(/#\/ler\/JHN\/3\/16$/)
  await expect(page.locator('#v16')).toHaveClass(/flash/)
})

test('limita a 200 resultados e mostra o total', async ({ page }) => {
  await page.goto('/#/busca/deus')
  await expect(page.getByText(/Mostrando 200 de [\d.]+ resultados/)).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.results li')).toHaveCount(200)
})

test('pede pelo menos 2 letras', async ({ page }) => {
  await page.goto('/#/busca')
  await page.getByRole('searchbox', { name: 'Buscar na Bíblia' }).fill('a')
  await expect(page.getByText('Digite pelo menos 2 letras')).toBeVisible()
})

test.describe('sem alguns livros', () => {
  test.use({ serviceWorkers: 'block' })

  test('mostra o que tem e avisa dos livros indisponíveis', async ({ page }) => {
    await page.route('**/bibles/BLIVRE/GEN.json', (route) => route.abort())
    await page.goto('/#/busca/amou%20mundo')
    await expect(page.getByRole('link', { name: /João 3:16/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Alguns livros não estão disponíveis offline.')).toBeVisible()
  })
})
