import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('inicia um plano, avança ao ler e encerra', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
  await expect(page.getByText('Dia 1 de 30')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mateus 1' })).toBeVisible()

  for (const chapter of [1, 2, 3]) {
    await page.goto(`/#/ler/MAT/${chapter}`)
    await page.getByRole('button', { name: 'Marcar como lido' }).click()
    await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
  }
  await page.goto('/#/planos')
  await expect(page.getByText('Dia 2 de 30')).toBeVisible()
  await expect(page.getByText('Faltam 29 dias de leitura')).toBeVisible()

  await page.getByRole('button', { name: 'Encerrar plano' }).click()
  await expect(page.getByText('Dia 2 de 30')).toHaveCount(0)
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
