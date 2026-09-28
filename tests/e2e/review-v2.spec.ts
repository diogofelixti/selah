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

test('plano concluído não mostra "Faltam 0 dias"', async ({ page }) => {
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Novo/ }).click()
  for (const book of ['Mateus', 'Marcos', 'Lucas', 'João']) {
    await page.getByRole('button', { name: new RegExp(`^\\d+ ${book} `) }).click()
    await page.getByRole('button', { name: 'Marcar livro inteiro' }).click()
  }
  await page.goto('/#/planos')
  await expect(page.getByText('Plano concluído. Parabéns!')).toBeVisible()
  await expect(page.getByText(/Faltam/)).toHaveCount(0)
})

test('toque duplo num capítulo e no marcar livro inteiro não duplica leituras', async ({ page }) => {
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Capítulo 1', exact: true }).dblclick()
  await expect(page.getByRole('button', { name: 'Capítulo 1, lido', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Marcar livro inteiro' }).dblclick()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
  await page.waitForTimeout(300)
  expect(await countReadings(page)).toBe(4)
})

test.describe('celular de 360px', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('capítulos do Controle têm pelo menos 44px', async ({ page }) => {
    await page.goto('/#/controle')
    await page.getByRole('button', { name: /Gênesis/ }).click()
    const box = (await page.getByRole('button', { name: 'Capítulo 1', exact: true }).boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})
