import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

// Síntese de voz falsa: cada fala termina em 300 ms; cancelar dispara "interrupted", como no Chrome.
const fakeSpeech = () => {
  const w = window as unknown as { __spoken: { text: string; rate: number }[] }
  w.__spoken = []
  class FakeUtterance {
    text: string
    lang = ''
    rate = 1
    voice: unknown = null
    onend: (() => void) | null = null
    onerror: ((e: { error: string }) => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }
  let current: FakeUtterance | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const synth = {
    speak(u: FakeUtterance) {
      w.__spoken.push({ text: u.text, rate: u.rate })
      current = u
      timer = setTimeout(() => {
        if (current === u) {
          current = null
          u.onend?.()
        }
      }, 300)
    },
    cancel() {
      clearTimeout(timer)
      const u = current
      current = null
      u?.onerror?.({ error: 'interrupted' })
    },
    getVoices: () => [],
    pause() {},
    resume() {},
  }
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
}

const spoken = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __spoken: { text: string; rate: number }[] }).__spoken)

test.describe('com síntese de voz', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(fakeSpeech)
  })

  test('lê o capítulo destacando o versículo atual', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await expect(page.locator('#v1')).toBeVisible()
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('#v1')).toHaveClass(/speaking/)
    await expect(page.getByText('Lendo versículo 1')).toBeVisible()
    await expect(page.locator('#v2')).toHaveClass(/speaking/)
    await expect(page.locator('#v1')).not.toHaveClass(/speaking/)
    expect((await spoken(page))[0].text).toMatch(/^E havia um homem/)
  })

  test('pausa e continua do mesmo versículo', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('#v2')).toHaveClass(/speaking/)
    await page.getByRole('button', { name: 'Pausar' }).click()
    const verse = await page.locator('.verse.speaking').getAttribute('id')
    await expect(page.getByText(/Pausado no versículo \d+/)).toBeVisible()
    const count = (await spoken(page)).length
    await page.waitForTimeout(700)
    expect((await spoken(page)).length).toBe(count)
    await page.getByRole('button', { name: 'Continuar' }).click()
    const list = await spoken(page)
    expect(list.length).toBe(count + 1)
    expect(list[list.length - 1].text).toBe(list[count - 1].text)
    await expect(page.locator(`#${verse}`)).toHaveClass(/speaking/)
  })

  test('alterna a velocidade', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await page.getByRole('button', { name: 'Velocidade 1×' }).click()
    await expect(page.getByRole('button', { name: 'Velocidade 1,25×' })).toBeVisible()
    await page.getByRole('button', { name: 'Velocidade 1,25×' }).click()
    await expect(page.getByRole('button', { name: 'Velocidade 0,8×' })).toBeVisible()
    const list = await spoken(page)
    expect(list[list.length - 1].rate).toBe(0.8)
  })

  test('parar esconde a barra e tira o destaque', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('.verse.speaking')).toHaveCount(1)
    await page.getByRole('button', { name: 'Parar', exact: true }).click()
    await expect(page.locator('.verse.speaking')).toHaveCount(0)
    await expect(page.getByText(/Lendo versículo/)).toHaveCount(0)
  })

  test('trocar de capítulo para a leitura', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('#v1')).toHaveClass(/speaking/)
    await page.goto('/#/ler/JHN/4')
    await expect(page.locator('#v1')).toBeVisible()
    const count = (await spoken(page)).length
    await page.waitForTimeout(800)
    expect((await spoken(page)).length).toBe(count)
    await expect(page.locator('.verse.speaking')).toHaveCount(0)
  })

  test('o botão de fone vira Parar leitura enquanto lê', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('#v1')).toHaveClass(/speaking/)
    await page.getByRole('button', { name: 'Parar leitura' }).click()
    await expect(page.locator('.verse.speaking')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ouvir capítulo' })).toBeVisible()
  })

  test('com versículos selecionados, começa do menor deles', async ({ page }) => {
    await page.goto('/#/ler/JHN/3')
    await page.locator('#v7').click()
    await page.locator('#v5').click()
    await page.getByRole('button', { name: 'Ouvir capítulo' }).click()
    await expect(page.locator('#v5')).toHaveClass(/speaking/)
    expect((await spoken(page))[0].text).toMatch(/^Respondeu Jesus/)
  })
})

test('sem síntese de voz, o botão não aparece', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }))
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ouvir capítulo' })).toHaveCount(0)
})
