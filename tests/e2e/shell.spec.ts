import { expect, test } from '@playwright/test'

test.describe('em português', () => {
  test.use({ locale: 'pt-BR' })

  test('navega pelas 5 abas', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await expect(nav.getByRole('link')).toHaveCount(5)
    for (const name of ['Ler', 'Controle', 'Planos', 'Temas', 'Início']) {
      await nav.getByRole('link', { name }).click()
      await expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
    }
  })

  test('endereço inválido cai no início', async ({ page }) => {
    await page.goto('/#/ler/XYZ/1')
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('em inglês', () => {
  test.use({ locale: 'en-US' })

  test('abre em inglês pelo idioma do aparelho', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
