import { expect, test } from '@playwright/test'

test.describe('leitor em português', () => {
  test.use({ locale: 'pt-BR', serviceWorkers: 'block' })

  test('lê, marca como lido, desfaz e mantém depois de recarregar', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await expect(page.locator('#v16')).toContainText('Porque Deus amou ao mundo')
    await page.getByRole('button', { name: 'Marcar como lido' }).click()
    await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
    await page.goto('/#/livro/JHN')
    await expect(page.getByText('1 de 21 capítulos lidos')).toBeVisible()
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Lido ✓' }).click()
    await expect(page.getByRole('button', { name: 'Marcar como lido' })).toBeVisible()
  })

  test('mostra palavras implícitas em itálico, sem colchetes', async ({ page }) => {
    await page.goto('/#/ler/GEN/27')
    await expect(page.locator('#v21 em')).toHaveText('que eu saiba')
    await expect(page.locator('#v21')).not.toContainText('[')
  })

  test('navega para o próximo livro no último capítulo', async ({ page }) => {
    await page.goto('/#/ler/GEN/50')
    await page.getByRole('link', { name: 'Próximo capítulo' }).click()
    await expect(page).toHaveURL(/#\/ler\/EXO\/1$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Êxodo')
  })

  test('abre destacando o versículo pedido', async ({ page }) => {
    await page.goto('/#/ler/PSA/23/4')
    await expect(page.locator('#v4')).toHaveClass(/flash/)
  })

  test('aumenta a letra e guarda a escolha', async ({ page }) => {
    await page.goto('/#/ler/JHN/1')
    const size = () => page.locator('.text').evaluate((el) => getComputedStyle(el).fontSize)
    const before = await size()
    await page.getByRole('button', { name: 'Aumentar letra' }).click()
    await expect.poll(size).not.toBe(before)
    const after = await size()
    await page.reload()
    await expect.poll(size).toBe(after)
  })

  test('mostra erro e tenta de novo quando o livro não carrega', async ({ page }) => {
    // Sem service worker, para o page.route enxergar a requisição.
    let fail = true
    await page.route('**/bibles/BLIVRE/RUT.json', (route) => (fail ? route.abort() : route.continue()))
    await page.goto('/#/ler/RUT/1')
    await expect(page.getByText('Não foi possível carregar este capítulo')).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Tentar de novo' }).click()
    await expect(page.locator('#v1')).toBeVisible()
  })

  test('volta para onde parou', async ({ page }) => {
    await page.goto('/#/ler/ROM/8')
    await expect(page.locator('#v1')).toBeVisible()
    await page.goto('/')
    await page.getByRole('link', { name: /Continuar leitura/ }).click()
    await expect(page).toHaveURL(/#\/ler\/ROM\/8$/)
  })
})

test.describe('leitor em inglês', () => {
  test.use({ locale: 'en-US' })

  test('usa a BSB', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await expect(page.locator('#v16')).toContainText('For God so loved the world')
  })

  test('pula versículos vazios da BSB', async ({ page }) => {
    await page.goto('/#/ler/MAT/17')
    await expect(page.locator('#v20')).toBeVisible()
    await expect(page.locator('#v21')).toHaveCount(0)
    await expect(page.locator('#v22')).toBeVisible()
  })
})
