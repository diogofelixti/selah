import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

/** Largura e altura de um PNG, lidas do cabeçalho IHDR. */
function pngSize(buf: Buffer) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), signature: buf.subarray(1, 4).toString() }
}

test.describe('sem compartilhar arquivos', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }))
  })

  test('abre as opções e baixa um PNG de 1080 × 1350', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.locator('#v16').click()
    await page.getByRole('button', { name: 'Compartilhar' }).click()
    await expect(page.getByRole('button', { name: 'Texto' })).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Imagem' }).click()
    const file = await download
    expect(file.suggestedFilename()).toBe('selah-joao-3-16.png')
    const size = pngSize(readFileSync(await file.path()))
    expect(size).toEqual({ width: 1080, height: 1350, signature: 'PNG' })
    await expect(page.getByText('Imagem salva')).toBeVisible()
  })

  test('trecho longo demais desativa a imagem', async ({ page }) => {
    await page.goto('/#/ler/PSA/119')
    await expect(page.locator('#v1')).toBeVisible()
    for (let v = 1; v <= 40; v++) await page.locator(`#v${v}`).click()
    await page.getByRole('button', { name: 'Compartilhar' }).click()
    await expect(page.getByRole('button', { name: 'Imagem' })).toBeDisabled()
    await expect(page.getByText(/Trecho longo demais para imagem/)).toBeVisible()
  })

  test('o versículo do dia pode virar imagem', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.verse-card blockquote')).not.toBeEmpty()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Compartilhar imagem' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/^selah-.+\.png$/)
  })
})

test('compartilha o PNG quando o aparelho aceita arquivos', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared?: { name: string; type: string } }
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    Object.defineProperty(navigator, 'share', {
      value: (data: { files?: File[] }) => {
        const f = data.files?.[0]
        w.__shared = f ? { name: f.name, type: f.type } : undefined
        return Promise.resolve()
      },
      configurable: true,
    })
  })
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.locator('#v17').click()
  await page.getByRole('button', { name: 'Compartilhar' }).click()
  await page.getByRole('button', { name: 'Imagem' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared?: unknown }).__shared)).toEqual({ name: 'selah-joao-3-16-17.png', type: 'image/png' })
})
