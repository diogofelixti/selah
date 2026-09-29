import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('mostra progresso, semana, versículo, dica e começa pelo Evangelho de João', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Bíblia lida')).toBeVisible()
  await expect(page.getByText('0 de 1.189 capítulos')).toBeVisible()
  await expect(page.getByText('Antigo 0%')).toBeVisible()
  await expect(page.locator('.week [data-read="true"]')).toHaveCount(0)
  await expect(page.locator('.week [data-today="true"]')).toHaveCount(1)
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  await expect(page.locator('.verse-card blockquote')).not.toBeEmpty()
  await expect(page.getByText('Dica', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Começar a ler/ }).click()
  await expect(page).toHaveURL(/#\/ler\/JHN\/1$/)
})

test('conta o dia de leitura e mostra onde continuar', async ({ page }) => {
  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  // Espera a gravação terminar antes de sair da página.
  await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
  await page.goto('/')
  await expect(page.locator('.week [data-today="true"][data-read="true"]')).toHaveCount(1)
  await expect(page.getByText('Leitura em 1 dos últimos 7 dias')).toBeAttached()
  await expect(page.getByRole('link', { name: /Continuar leitura/ })).toContainText('João 1')
})

test('atalho do Controle e plano de hoje', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
  // Espera o plano aparecer (gravado) antes de sair da tela.
  await expect(page.getByText(/Dia 1 de \d+/).first()).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('Hoje: Mateus 1 a 3 · 0 de 3 lidos')).toBeVisible()
  await page.getByRole('link', { name: /Marcar leitura/ }).click()
  await expect(page).toHaveURL(/#\/controle$/)
})

test('abre os ajustes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ajustes' }).click()
  await expect(page).toHaveURL(/#\/ajustes$/)
})
