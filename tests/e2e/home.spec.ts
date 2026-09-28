import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('mostra versículo do dia, progresso, dica e começa pelo Evangelho de João', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  await expect(page.locator('.verse-card blockquote')).not.toBeEmpty()
  await expect(page.getByText('0% da Bíblia lida')).toBeVisible()
  await expect(page.getByText('Leitura em 0 dos últimos 7 dias')).toBeVisible()
  await expect(page.getByText('Dica', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Começar a ler/ }).click()
  await expect(page).toHaveURL(/#\/ler\/JHN\/1$/)
})

test('conta o dia de leitura depois de marcar um capítulo', async ({ page }) => {
  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  await page.goto('/')
  await expect(page.getByText('Leitura em 1 dos últimos 7 dias')).toBeVisible()
  await expect(page.getByRole('link', { name: /Continuar leitura/ })).toContainText('João 1')
})

test('abre os ajustes pela engrenagem', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ajustes' }).click()
  await expect(page).toHaveURL(/#\/ajustes$/)
})
