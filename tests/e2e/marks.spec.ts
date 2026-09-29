import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('destaca vários versículos com uma cor e mantém depois de recarregar', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.locator('#v17').click()
  await page.getByRole('button', { name: 'Destacar' }).click()
  await page.getByRole('button', { name: 'Verde' }).click()
  await expect(page.locator('#v16')).toHaveAttribute('data-mark', 'green')
  await expect(page.locator('#v17')).toHaveAttribute('data-mark', 'green')
  await expect(page.locator('#v16')).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(page.locator('#v16')).toHaveAttribute('data-mark', 'green')
})

test('tira o destaque', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Destacar' }).click()
  await page.getByRole('button', { name: 'Dourado' }).click()
  await expect(page.locator('#v16')).toHaveAttribute('data-mark', 'gold')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Destacar' }).click()
  await page.getByRole('button', { name: 'Tirar destaque' }).click()
  await expect(page.locator('#v16')).not.toHaveAttribute('data-mark')
})

test('anota, abre, edita e apaga a nota de um versículo', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Anotar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nota em João 3:16' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox').fill('Lembrar do amor de Deus')
  await dialog.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog).toBeHidden()
  const noteButton = page.getByRole('button', { name: 'Ver nota de João 3:16' })
  await expect(noteButton).toBeVisible()
  await noteButton.click()
  await expect(dialog.getByRole('textbox')).toHaveValue('Lembrar do amor de Deus')
  await dialog.getByRole('textbox').fill('Mudou')
  await dialog.getByRole('button', { name: 'Salvar' }).click()
  // A tela só muda depois que o aparelho confirma a gravação: reabrir com o texto novo prova que já foi salvo.
  await page.getByRole('button', { name: 'Ver nota de João 3:16' }).click()
  await expect(dialog.getByRole('textbox')).toHaveValue('Mudou')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Ver nota de João 3:16' }).click()
  await expect(dialog.getByRole('textbox')).toHaveValue('Mudou')
  await dialog.getByRole('button', { name: 'Apagar nota' }).click()
  await expect(page.getByRole('button', { name: 'Ver nota de João 3:16' })).toHaveCount(0)
})

test('cancelar a nota não salva nada', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v16').click()
  await page.getByRole('button', { name: 'Anotar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nota em João 3:16' })
  await dialog.getByRole('textbox').fill('não salvar')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('button', { name: 'Ver nota de João 3:16' })).toHaveCount(0)
})

test('anotar só aparece com um versículo selecionado', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await page.locator('#v1').click()
  await expect(page.getByRole('button', { name: 'Anotar' })).toBeVisible()
  await page.locator('#v2').click()
  await expect(page.getByRole('button', { name: 'Anotar' })).toHaveCount(0)
})

test.describe('celular de 360px', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('botões da barra de seleção com 44px e cores numa linha só', async ({ page }) => {
    // Com Compartilhar (como no Android), a barra tem o maior número de botões.
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: () => Promise.resolve() }))
    await page.goto('/#/ler/JHN/3')
    await page.locator('#v1').click()
    const bar = page.getByRole('toolbar', { name: 'Ações dos versículos selecionados' })
    for (const name of ['Copiar', 'Compartilhar', 'Destacar', 'Anotar', 'Cancelar']) {
      const box = (await bar.getByRole('button', { name, exact: true }).boundingBox())!
      expect(box.width, name).toBeGreaterThanOrEqual(44)
    }
    await bar.getByRole('button', { name: 'Destacar' }).click()
    const clear = (await page.getByRole('button', { name: 'Tirar destaque' }).boundingBox())!
    expect(clear.height).toBeLessThanOrEqual(50)
  })
})
