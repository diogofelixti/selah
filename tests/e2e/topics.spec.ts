import { expect, test } from '@playwright/test'

// Sem service worker, para o page.route enxergar as requisições no teste de erro.
test.use({ locale: 'pt-BR', serviceWorkers: 'block' })

test('abre um tema e vai para o versículo no leitor', async ({ page }) => {
  await page.goto('/#/temas')
  await expect(page.getByRole('link', { name: 'O amor de Deus' })).toBeVisible()
  await page.getByRole('link', { name: 'Ansiedade' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ansiedade' })).toBeVisible()
  const first = page.getByRole('link', { name: /Filipenses 4:6/ })
  await expect(first).toBeVisible()
  await expect(first.locator('blockquote')).not.toBeEmpty()
  await first.click()
  await expect(page).toHaveURL(/#\/ler\/PHP\/4\/6$/)
  await expect(page.locator('#v6')).toHaveClass(/flash/)
})

test('mostra erro e tenta de novo quando os versículos não carregam', async ({ page }) => {
  let fail = true
  await page.route('**/bibles/BLIVRE/*.json', (route) => (fail ? route.abort() : route.continue()))
  await page.goto('/#/temas/forca')
  await expect(page.getByText('Não foi possível carregar os versículos')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(page.getByRole('link', { name: /Filipenses 4:13/ }).locator('blockquote')).not.toBeEmpty()
})

test('temas novos aparecem e abrem com os versículos', async ({ page }) => {
  await page.goto('/#/temas')
  for (const name of ['Paz', 'Fé', 'Solidão', 'Família', 'Sabedoria para decidir', 'Cansaço']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Paz', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Paz' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Isaías 26:3/ }).locator('blockquote')).not.toBeEmpty()
})

test('palavras implícitas aparecem em itálico, sem colchetes, e a lista tem 16 temas', async ({ page }) => {
  await page.goto('/#/temas')
  await expect(page.locator('a[href^="#/temas/"]')).toHaveCount(16)
  await page.goto('/#/temas/fe')
  const card = page.getByRole('link', { name: /Hebreus 11:6/ }).locator('blockquote')
  await expect(card).toContainText('agradar a Deus')
  await expect(card).not.toContainText('[')
  await expect(card.locator('em')).toHaveText('a Deus')
})
