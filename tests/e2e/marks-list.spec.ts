import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

async function mark(page: import('@playwright/test').Page, hash: string, verse: number, action: { color?: string; note?: string }) {
  await page.goto(hash)
  await page.locator(`#v${verse}`).click()
  if (action.color) {
    await page.getByRole('button', { name: 'Destacar' }).click()
    await page.getByRole('button', { name: action.color }).click()
    await expect(page.locator(`#v${verse}`)).toHaveAttribute('data-mark', /.+/)
  }
  if (action.note) {
    if (action.color) await page.locator(`#v${verse}`).click()
    await page.getByRole('button', { name: 'Anotar' }).click()
    await page.getByRole('dialog').getByRole('textbox').fill(action.note)
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('button', { name: /^Ver nota de/ })).toBeVisible()
  }
}

test('sem marcações, explica como marcar', async ({ page }) => {
  await page.goto('/#/biblia')
  await page.getByRole('link', { name: 'Minhas marcações' }).click()
  await expect(page).toHaveURL(/#\/marcacoes$/)
  await expect(page.getByText(/Selecione um versículo no leitor/)).toBeVisible()
})

test('lista em ordem canônica, filtra e abre no leitor', async ({ page }) => {
  await mark(page, '/#/ler/JHN/3', 16, { color: 'Verde' })
  await mark(page, '/#/ler/JHN/3', 3, { note: 'Nascer de novo' })
  await mark(page, '/#/ler/GEN/1', 1, { color: 'Dourado' })
  await page.goto('/#/marcacoes')
  const items = page.locator('.marks li')
  await expect(items).toHaveCount(3)
  await expect(items.nth(0)).toContainText('Gênesis 1:1')
  await expect(items.nth(1)).toContainText('João 3:3')
  await expect(items.nth(1)).toContainText('Nascer de novo')
  await expect(items.nth(2)).toContainText('João 3:16')
  await expect(items.nth(2)).toContainText('Porque Deus amou')
  await expect(page.getByText('3 marcações')).toBeVisible()

  await page.getByRole('button', { name: 'Com nota' }).click()
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('João 3:3')
  await page.getByRole('button', { name: 'Verde' }).click()
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('João 3:16')

  await items.first().getByRole('link').click()
  await expect(page).toHaveURL(/#\/ler\/JHN\/3\/16$/)
})

test('backup exportado e importado mantém as marcações', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await mark(page, '/#/ler/JHN/3', 16, { color: 'Azul', note: 'guardar' })
  await page.goto('/#/ajustes')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar progresso' }).click()
  const file = readFileSync(await (await download).path())
  await page.getByRole('button', { name: 'Apagar dados' }).click()
  await expect(page.getByText('Dados apagados.')).toBeVisible()
  await page.goto('/#/marcacoes')
  await expect(page.locator('.marks li')).toHaveCount(0)
  await page.goto('/#/ajustes')
  await page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: file })
  await expect(page.getByText('Progresso importado.')).toBeVisible()
  await page.getByRole('link', { name: 'Minhas marcações' }).click()
  await expect(page.locator('.marks li')).toHaveCount(1)
  await expect(page.locator('.marks li').first()).toContainText('guardar')
})

test.describe('sem internet', () => {
  test.use({ serviceWorkers: 'block' })

  test('avisa quando o texto do versículo marcado não pode ser carregado', async ({ page }) => {
    page.on('dialog', (d) => d.accept())
    const backup = {
      app: 'selah', version: 2, exportedAt: '2026-09-28T00:00:00.000Z',
      readings: [], settings: { language: 'pt', theme: 'auto', fontSize: 2 }, state: { lastPosition: null, activePlan: null },
      marks: [{ ref: 'JHN.3.16', color: 'gold', note: 'guardar', updatedAt: 1 }],
    }
    await page.goto('/#/ajustes')
    await page.locator('input[type=file]').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
    await expect(page.getByText('Progresso importado.')).toBeVisible()
    await page.route('**/bibles/BLIVRE/JHN.json', (route) => route.abort())
    await page.goto('/#/marcacoes')
    await expect(page.locator('.marks li').first()).toContainText('guardar')
    await expect(page.getByText('Texto indisponível sem internet.')).toBeVisible()
  })
})
