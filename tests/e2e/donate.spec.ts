import { expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR', permissions: ['clipboard-read', 'clipboard-write'] })

const card = (page: Page) => page.getByRole('region', { name: 'Apoie o Selah' })

for (const path of ['/#/ajustes', '/#/sobre']) {
  test(`cartão de doação em ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(card(page).getByText('Chave Pix (CNPJ)')).toBeVisible()
    await expect(card(page).getByText('41.123.299/0001-59')).toBeVisible()
    await expect(card(page).getByRole('button', { name: 'Copiar chave Pix' })).toContainText('Copiar')
    await card(page).getByRole('button', { name: 'Copiar chave Pix' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('41123299000159')
    await expect(page.getByText('Chave Pix copiada')).toBeVisible()
    const whatsapp = card(page).getByRole('link', { name: /WhatsApp/ })
    await expect(whatsapp).toHaveAttribute('href', `https://wa.me/5551996409363?text=${encodeURIComponent('Olá! Quero falar sobre o Selah.')}`)
    await expect(whatsapp).toHaveAttribute('target', '_blank')
    await expect(whatsapp).toContainText('(51) 99640-9363')
  })
}

test('cartão em inglês explica o Pix', async ({ page }) => {
  await page.goto('/#/ajustes')
  await page.getByLabel('English').check()
  await expect(page.getByRole('region', { name: 'Support Selah' }).getByText(/Pix is a Brazilian/)).toBeVisible()
})
