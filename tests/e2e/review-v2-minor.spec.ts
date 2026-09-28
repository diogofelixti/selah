import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

async function countReadings(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const req = indexedDB.open('selah')
    const db: IDBDatabase = await new Promise((ok) => (req.onsuccess = () => ok(req.result)))
    const all: unknown[] = await new Promise((ok) => {
      const r = db.transaction('readings').objectStore('readings').getAll()
      r.onsuccess = () => ok(r.result)
    })
    return all.length
  })
}

test('cancelar o Limpar não apaga nada no aparelho', async ({ page }) => {
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Marcar livro inteiro' }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
  page.once('dialog', (d) => void d.dismiss())
  await page.getByRole('button', { name: 'Limpar' }).click()
  await page.waitForTimeout(500)
  expect(await countReadings(page)).toBe(4)
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
})

test('a tela inicial mostra o dia do plano com dois livros', async ({ page }) => {
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Salmos e Provérbios em 31 dias' }).getByRole('button', { name: 'Começar' }).click()
  await page.goto('/')
  await expect(page.getByText('Hoje: Provérbios 1, Salmos 1 a 5 · 0 de 6 lidos')).toBeVisible()
})

test('as bolinhas da semana avançam depois da meia-noite com o app aberto', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 8, 28, 23, 50) })
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Capítulo 1', exact: true }).click()
  await page.goto('/')
  await expect(page.locator('.week [data-today="true"][data-read="true"]')).toHaveCount(1)
  await page.clock.fastForward('00:20:00')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.week [data-today="true"][data-read="false"]')).toHaveCount(1)
  await expect(page.locator('.week [data-read="true"]')).toHaveCount(1)
})

test('o foco do teclado aparece nas linhas de livro do Controle', async ({ page }) => {
  await page.goto('/#/controle')
  const row = page.getByRole('button', { name: /Gênesis/ })
  await row.focus()
  const clipped = await row.evaluate((el) => {
    const style = getComputedStyle(el)
    const card = el.parentElement!
    return getComputedStyle(card).overflow === 'hidden' && parseFloat(style.outlineOffset) >= 0
  })
  expect(clipped).toBe(false)
})
