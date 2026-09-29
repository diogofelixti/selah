import { expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR' })

/** Classes dos elementos que mostram uma ilustração (pseudo-elemento visível com máscara). */
const illustrated = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = []
    for (const el of document.querySelectorAll('*')) {
      for (const pseudo of ['::before', '::after']) {
        const s = getComputedStyle(el, pseudo)
        const mask = s.maskImage || s.getPropertyValue('-webkit-mask-image')
        if (s.display !== 'none' && mask && mask !== 'none' && mask.includes('url(')) found.push(`${el.className}${pseudo}`)
      }
    }
    return found
  })

async function chooseTheme(page: Page, label: string) {
  await page.goto('/#/ajustes')
  await page.getByLabel(label).check()
}

test('Pergaminho ilustra os cabeçalhos, mas nunca o leitor', async ({ page }) => {
  await chooseTheme(page, 'Pergaminho (claro, ilustrado)')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pergaminho')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(241, 231, 208)')

  await page.goto('/#/biblia')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect((await illustrated(page)).some((c) => c.includes('page-head'))).toBe(true)

  await page.goto('/')
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  expect((await illustrated(page)).some((c) => c.includes('head'))).toBe(true)

  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v16')).toBeVisible()
  expect(await illustrated(page)).toEqual([])
})

test('Oliveira ilustra o estado vazio das marcações', async ({ page }) => {
  await chooseTheme(page, 'Oliveira (escuro, ilustrado)')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oliveira')
  await page.goto('/#/marcacoes')
  await expect(page.locator('.empty')).toBeVisible()
  expect((await illustrated(page)).some((c) => c.includes('empty'))).toBe(true)
})

test('Aurora e Noite não têm ilustração', async ({ page }) => {
  for (const label of ['Aurora (claro)', 'Noite (escuro)']) {
    await chooseTheme(page, label)
    await page.goto('/#/marcacoes')
    await expect(page.locator('.empty')).toBeVisible()
    expect(await illustrated(page)).toEqual([])
  }
})

test('as amostras dos Ajustes usam as cores de cada tema', async ({ page }) => {
  await page.goto('/#/ajustes')
  const bg = (theme: string) =>
    page.locator(`.swatch[data-theme="${theme}"]`).first().evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(await bg('pergaminho')).toBe('rgb(241, 231, 208)')
  expect(await bg('oliveira')).toBe('rgb(27, 31, 22)')
  expect(await bg('noite')).toBe('rgb(18, 22, 31)')
})
