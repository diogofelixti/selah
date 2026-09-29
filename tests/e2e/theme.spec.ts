import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

const theme = (page: import('@playwright/test').Page) => page.locator('html').getAttribute('data-theme')
const bodyBg = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.describe('aparelho no modo escuro', () => {
  test.use({ colorScheme: 'dark' })

  test('abre no tema Noite e a escolha manual vence', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'noite')
    expect(await bodyBg(page)).toBe('rgb(18, 22, 31)')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#12161f')
    await page.goto('/#/ajustes')
    await page.getByLabel('Aurora (claro)').check()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora')
    await page.reload()
    expect(await theme(page)).toBe('aurora')
  })
})

test.describe('aparelho no modo claro', () => {
  test.use({ colorScheme: 'light' })

  test('abre no Aurora, troca para Noite e segue o aparelho quando volta ao automático', async ({ page }) => {
    await page.goto('/#/ajustes')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora')
    await page.getByLabel('Noite (escuro)').check()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'noite')
    await page.getByLabel('Automático (tema do aparelho)').check()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'noite')
  })
})
