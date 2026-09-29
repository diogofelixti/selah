import { expect, test, type Page } from '@playwright/test'

// Sem service worker: a interceptação de rede precisa ver os pedidos do app.
test.use({ locale: 'pt-BR', serviceWorkers: 'block' })

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

test('o tema escolhido vale antes de o app carregar', async ({ page }) => {
  await chooseTheme(page, 'Oliveira (escuro, ilustrado)')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oliveira')
  // Sem o JavaScript do app, só o script do index.html decide o tema.
  await page.route('**/assets/*.js', (route) => route.abort())
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oliveira')
})

test.describe('aparelho no modo escuro', () => {
  test.use({ colorScheme: 'dark' })

  test('sem escolha salva, segue o aparelho antes de o app carregar', async ({ page }) => {
    await page.route('**/assets/*.js', (route) => route.abort())
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'noite')
  })

  test('localStorage bloqueado não impede o app de abrir', async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('bloqueado', 'SecurityError')
        },
      }),
    )
    await page.goto('/#/ajustes')
    await page.getByLabel('Pergaminho (claro, ilustrado)').check()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'pergaminho')
  })
})

test('ao abrir com tema salvo, o tema e a cor da barra nunca passam por outro', async ({ page }) => {
  await chooseTheme(page, 'Oliveira (escuro, ilustrado)')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oliveira')
  await page.addInitScript(() => {
    const w = window as unknown as { __seen: string[] }
    w.__seen = []
    const record = () => {
      const meta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
      w.__seen.push(`${document.documentElement.dataset.theme}|${meta}`)
    }
    new MutationObserver(record).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme', 'content'] })
  })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
  expect(new Set(seen)).toEqual(new Set(['oliveira|#1b1f16']))
})

test.describe('tela estreita com letra grande', () => {
  test.use({ viewport: { width: 320, height: 700 } })

  test('o botão de Ajustes da tela inicial mantém 44px no tema ilustrado', async ({ page }) => {
    await chooseTheme(page, 'Pergaminho (claro, ilustrado)')
    await page.goto('/')
    await page.addStyleTag({ content: 'html { font-size: 150% }' })
    const box = await page.getByRole('link', { name: 'Ajustes' }).boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})
