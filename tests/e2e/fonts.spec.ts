import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('títulos e leitura em Lora, interface em Source Sans 3', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v16')).toBeVisible()
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    const family = (sel: string) => getComputedStyle(document.querySelector(sel)!).fontFamily
    return {
      title: family('.reader h1'),
      text: family('.text'),
      ui: family('body'),
      loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    }
  })
  expect(fonts.title).toContain('Lora')
  expect(fonts.text).toContain('Lora')
  expect(fonts.ui).toContain('Source Sans 3')
  expect(fonts.loaded.join()).toMatch(/Lora/)
})
