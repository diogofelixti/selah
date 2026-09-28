import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

async function startGospels(page: import('@playwright/test').Page) {
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
}

test('marca capítulos do plano sem abrir o leitor e o plano avança', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await startGospels(page)
  await expect(page.getByText('0 de 89 capítulos · Dia 1 de 30')).toBeVisible()
  await page.getByRole('button', { name: 'Mateus 1', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mateus 1', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('1 de 89 capítulos · Dia 1 de 30')).toBeVisible()
  await page.getByRole('button', { name: 'Marcar o dia todo' }).first().click()
  await expect(page.getByText('3 de 89 capítulos · Dia 2 de 30')).toBeVisible()
  await expect(page.getByText('3%', { exact: true })).toBeVisible()
  await expect(page.getByText('Faltam 29 dias de leitura')).toBeVisible()
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Novo/ }).click()
  await expect(page.getByRole('button', { name: /Mateus/ })).toContainText('3 de 28 capítulos')
})

test('o botão de ler abre o capítulo do plano', async ({ page }) => {
  await startGospels(page)
  await page.getByRole('link', { name: 'Ler Mateus 2' }).click()
  await expect(page).toHaveURL(/#\/ler\/MAT\/2$/)
})

test('a faixa mostra o dia atual e o plano pode ser encerrado', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await startGospels(page)
  await expect(page.locator('.strip [data-current="true"]')).toHaveText('1')
  await expect(page.locator('.strip li')).toHaveCount(7)
  await page.getByRole('button', { name: 'Encerrar plano' }).click()
  await expect(page.getByText(/Dia 1 de 30/)).toHaveCount(0)
})

test('capítulo lido antes do plano precisa ser marcado de novo para o plano', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/ler/MRK/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Novo Testamento em 90 dias' }).getByRole('button', { name: 'Começar' }).click()
  await page.goto('/#/ler/MRK/1')
  await expect(page.getByRole('button', { name: 'Marcar como lido' })).toBeVisible()
})
