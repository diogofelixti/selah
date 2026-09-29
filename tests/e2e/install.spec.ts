import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

const card = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Instalar o app' })

test('Chrome oferece a instalação: o botão abre a janela do navegador', async ({ page }) => {
  await page.goto('/#/ajustes')
  // O navegador avisa que o app pode ser instalado (evento beforeinstallprompt).
  await page.evaluate(() => {
    const w = window as unknown as { __prompted: number }
    w.__prompted = 0
    const e = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
    e.prompt = async () => void w.__prompted++
    e.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(e)
  })
  await card(page).getByRole('button', { name: 'Instalar o app' }).click()
  expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1)
  await expect(page.getByText('Selah instalado. Procure o ícone da lamparina na tela inicial.')).toBeVisible()
})

test('sem a instalação direta, mostra o caminho pelo menu do Chrome e a dica da Xiaomi', async ({ page }) => {
  await page.goto('/#/ajustes')
  await expect(card(page).getByText(/três pontinhos/)).toBeVisible()
  await expect(card(page).getByText(/Atalhos na tela inicial/)).toBeVisible()
})

test('já aberto como app instalado, o cartão não aparece', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window)
    window.matchMedia = (q: string) =>
      q === '(display-mode: standalone)' ? ({ ...original(q), matches: true, media: q } as MediaQueryList) : original(q)
  })
  await page.goto('/#/ajustes')
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible()
  await expect(card(page)).toHaveCount(0)
})

test.describe('iPhone', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1' })

  test('mostra o passo a passo do Safari', async ({ page }) => {
    await page.goto('/#/ajustes')
    await expect(card(page).getByText(/Compartilhar/)).toBeVisible()
    await expect(card(page).getByText(/Adicionar à Tela de Início/)).toBeVisible()
    await expect(card(page).getByRole('button', { name: 'Instalar o app' })).toHaveCount(0)
  })
})
