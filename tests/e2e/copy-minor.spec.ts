import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR', permissions: ['clipboard-read', 'clipboard-write'] })

test('só um versículo por vez recebe Tab, e as setas andam entre eles', async ({ page }) => {
  await page.goto('/#/ler/PSA/119')
  await expect(page.locator('#v1')).toBeVisible()
  await expect(page.locator('.verse[tabindex="0"]')).toHaveCount(1)
  await page.locator('#v1').focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('#v2')).toBeFocused()
  await expect(page.locator('.verse[tabindex="0"]')).toHaveCount(1)
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('#v1')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#v1')).toHaveAttribute('aria-pressed', 'true')
})

test('clicar num versículo com texto selecionado nele não muda a seleção de versículos', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v1')).toBeVisible()
  await page.locator('#v1').evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    getSelection()!.removeAllRanges()
    getSelection()!.addRange(range)
    ;(el as HTMLElement).click()
  })
  await expect(page.locator('#v1')).toHaveAttribute('aria-pressed', 'false')
})

test('um aviso só por vez, mesmo com toques rápidos', async ({ page }) => {
  await page.goto('/#/temas/ansiedade')
  const buttons = page.getByRole('button', { name: 'Copiar versículo' })
  await expect(buttons.first()).toBeEnabled()
  await buttons.nth(0).click()
  await buttons.nth(1).click()
  await page.waitForTimeout(400)
  expect(await page.getByRole('status').filter({ hasText: 'Copiado' }).count()).toBe(1)
})

test('erro ao compartilhar mostra aviso, e cancelar não mostra', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(navigator, 'share', {
      value: () => Promise.reject(new DOMException('x', ++calls === 1 ? 'AbortError' : 'NotAllowedError')),
    })
  })
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Compartilhar' }).click()
  await page.getByRole('button', { name: 'Texto' }).click()
  await expect(page.getByText('Não foi possível compartilhar')).toHaveCount(0)
  await page.getByRole('button', { name: 'Compartilhar' }).click()
  await page.getByRole('button', { name: 'Texto' }).click()
  await expect(page.getByText('Não foi possível compartilhar')).toBeVisible()
})

test('versículo selecionado tem destaque próprio, diferente do versículo aberto por link', async ({ page }) => {
  await page.goto('/#/ler/PSA/23/4')
  await expect(page.locator('#v4')).toHaveClass(/flash/)
  await page.locator('#v4').click()
  const shadow = await page.locator('#v4').evaluate((el) => getComputedStyle(el).boxShadow)
  expect(shadow).toContain('154, 107, 31')
})

test('barra de cópia tem nome próprio e anuncia a contagem', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v1').click()
  await expect(page.getByRole('toolbar', { name: 'Ações dos versículos selecionados' })).toBeVisible()
  await expect(page.locator('.selection-bar .count')).toHaveAttribute('aria-live', 'polite')
})
