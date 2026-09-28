import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('abre um livro, marca e desmarca capítulos e vê as porcentagens mudarem', async ({ page }) => {
  await page.goto('/#/controle')
  await expect(page.getByRole('heading', { level: 1, name: 'O que já li' })).toBeVisible()
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Capítulo 1', exact: true }).click()
  await page.getByRole('button', { name: 'Capítulo 2', exact: true }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('2 de 4 capítulos')
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('50')
  await page.getByRole('button', { name: 'Capítulo 1, lido', exact: true }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('1 de 4 capítulos')
  await page.reload()
  await page.getByRole('button', { name: /Rute/ }).click()
  await expect(page.getByRole('button', { name: 'Capítulo 2, lido', exact: true })).toBeVisible()
})

test('marcar livro inteiro só completa o que falta', async ({ page }) => {
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Capítulo 3', exact: true }).click()
  await page.getByRole('button', { name: 'Marcar livro inteiro' }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
  const count = await page.evaluate(async () => {
    const req = indexedDB.open('selah')
    const db: IDBDatabase = await new Promise((ok) => (req.onsuccess = () => ok(req.result)))
    const all: unknown[] = await new Promise((ok) => {
      const r = db.transaction('readings').objectStore('readings').getAll()
      r.onsuccess = () => ok(r.result)
    })
    return all.length
  })
  expect(count).toBe(4)
})

test('limpar pede confirmação e cancelar não muda nada', async ({ page }) => {
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Rute/ }).click()
  await page.getByRole('button', { name: 'Marcar livro inteiro' }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
  page.once('dialog', (d) => {
    expect(d.message()).toBe('Desmarcar todos os capítulos de Rute?')
    void d.dismiss()
  })
  await page.getByRole('button', { name: 'Limpar' }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('4 de 4 capítulos')
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Limpar' }).click()
  await expect(page.getByRole('button', { name: /Rute/ })).toContainText('0 de 4 capítulos')
})

test('filtro de testamento e marcação refletida na aba Ler', async ({ page }) => {
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Novo/ }).click()
  await expect(page.getByRole('button', { name: /Mateus/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Gênesis/ })).toHaveCount(0)
  await page.getByRole('button', { name: /Judas/ }).click()
  await page.getByRole('button', { name: 'Capítulo 1', exact: true }).click()
  await page.goto('/#/livro/JUD')
  await expect(page.getByText('1 de 1 capítulos lidos')).toBeVisible()
})
