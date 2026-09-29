import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

const backup = (readings: { ref: string; readAt: number }[]) =>
  JSON.stringify({
    app: 'selah',
    version: 1,
    exportedAt: '2026-09-27T00:00:00.000Z',
    readings,
    settings: { language: 'pt', theme: 'aurora', fontSize: 2 },
    state: { lastPosition: null, activePlan: null },
  })

test('troca o idioma para inglês e de volta', async ({ page }) => {
  await page.goto('/#/ajustes')
  await page.getByLabel('English').check()
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  await page.getByLabel('Automatic (device language)').check()
  await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible()
})

test('exporta o progresso', async ({ page }) => {
  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  // Espera a gravação terminar antes de sair da página.
  await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
  await page.goto('/#/ajustes')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar progresso' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^selah-backup-\d{4}-\d{2}-\d{2}\.json$/)
})

test('importa um backup válido e recusa um inválido sem mexer nos dados', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/ajustes')
  const input = page.locator('input[type=file]')
  await input.setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(backup([{ ref: 'RUT.1', readAt: 1 }])) })
  await expect(page.getByText('Progresso importado.')).toBeVisible()
  await input.setInputFiles({ name: 'ruim.json', mimeType: 'application/json', buffer: Buffer.from(backup([{ ref: 'XYZ.1', readAt: 1 }])) })
  await expect(page.getByText('Este arquivo não é um backup válido do Selah.')).toBeVisible()
  await page.goto('/#/livro/RUT')
  await expect(page.getByText('1 de 4 capítulos lidos')).toBeVisible()
})

test('apaga os dados depois de duas confirmações', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/ler/RUT/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  // Espera a gravação terminar antes de sair da página.
  await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
  await page.goto('/#/ajustes')
  await page.getByRole('button', { name: 'Apagar dados' }).click()
  await expect(page.getByText('Dados apagados.')).toBeVisible()
  await page.goto('/#/livro/RUT')
  await expect(page.getByText('0 de 4 capítulos lidos')).toBeVisible()
})

test('Sobre mostra as atribuições das traduções', async ({ page }) => {
  await page.goto('/#/ajustes')
  await page.getByRole('link', { name: 'Sobre o Selah' }).click()
  await expect(page.getByText(/Bíblia Livre \(BLIVRE\)/)).toBeVisible()
  await expect(page.getByText(/Berean Standard Bible \(BSB\)/)).toBeVisible()
})
