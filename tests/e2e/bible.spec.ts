import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('mostra testamentos, seções e livros com progresso', async ({ page }) => {
  await page.goto('/#/biblia')
  await expect(page.getByRole('heading', { name: 'Pentateuco' })).toBeVisible()
  await page.getByRole('link', { name: /Novo Testamento/ }).click()
  await expect(page.getByRole('heading', { name: 'Evangelhos' })).toBeVisible()
  await page.getByRole('link', { name: /^João/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'João' })).toBeVisible()
  await expect(page.getByText('0 de 21 capítulos lidos')).toBeVisible()
})

test('tocar e segurar marca e desmarca o capítulo sem abrir', async ({ page }) => {
  await page.goto('/#/livro/RUT')
  const hold = async (name: string) => {
    const box = (await page.getByRole('link', { name, exact: true }).boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()
  }
  await hold('Capítulo 2')
  await expect(page.getByRole('link', { name: 'Capítulo 2, lido', exact: true })).toBeVisible()
  await expect(page.getByText('1 de 4 capítulos lidos')).toBeVisible()
  await expect(page).toHaveURL(/#\/livro\/RUT$/)
  await hold('Capítulo 2, lido')
  await expect(page.getByRole('link', { name: 'Capítulo 2', exact: true })).toBeVisible()
})

test('toque simples abre o leitor', async ({ page }) => {
  await page.goto('/#/livro/RUT')
  await page.getByRole('link', { name: 'Capítulo 3', exact: true }).click()
  await expect(page).toHaveURL(/#\/ler\/RUT\/3$/)
})
